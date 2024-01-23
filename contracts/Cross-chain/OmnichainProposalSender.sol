// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ILayerZeroEndpoint } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { BaseOmnichainControllerSrc } from "./BaseOmnichainControllerSrc.sol";

/**
 * @title OmnichainProposalSender
 * @author Venus
 * @notice OmnichainProposalSender contract builds upon the functionality of its parent contract , BaseOmnichainControllerSrc
 * It sends a proposal's data to remote chains for execution after the proposal passes on the main chain
 * when used with GovernorBravo, the owner of this contract must be set to the Timelock contract
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */

contract OmnichainProposalSender is ReentrancyGuard, BaseOmnichainControllerSrc {
    /**
     * @notice Stores the total number of remote proposals
     */
    uint64 public proposalCount;

    /**
     * @notice Execution hashes of failed messages
     * @dev [proposalId] -> [executionHash]
     */
    mapping(uint64 => bytes32) public storedExecutionHashes;

    /**
     * @notice Valid chainIds on remote
     */
    mapping(uint16 => bool) public validChainIds;

    /**
     * @notice LayerZero endpoint for sending messages to remote chains
     */
    ILayerZeroEndpoint public immutable LZ_ENDPOINT;

    /**
     * @notice Specifies the allowed path for sending messages (remote chainId => remote app address + local app address)
     */
    mapping(uint16 => bytes) public trustedRemoteLookup;

    /**
     * @notice Emitted when a remote message receiver is set for the remote chain
     */
    event SetTrustedRemoteAddress(uint16 indexed remoteChainId, bytes remoteAddress);

    /**
     * @notice Emitted when a proposal execution request is sent to the remote chain
     */
    event ExecuteRemoteProposal(uint16 indexed remoteChainId, uint256 proposalId, bytes payload);

    /**
     * @notice Emitted when a previously failed message is successfully sent to the remote chain
     */
    event ClearPayload(uint64 indexed proposalId, bytes32 executionHash);

    /**
     * @notice Emitted when an execution hash of a failed message is saved
     */
    event StorePayload(
        uint64 indexed proposalId,
        uint16 indexed remoteChainId,
        bytes payload,
        bytes adapterParams,
        uint256 value,
        bytes reason
    );

    /**
     * @notice Emitted while updating Valid ChainId mapping
     */
    event UpdatedValidChainId(uint16 indexed chainId, bool isAdded);

    /**
     * @notice Emitted while fallback withdraw
     */
    event FallbackWithdraw(address indexed receiver, uint256 value);

    constructor(
        ILayerZeroEndpoint lzEndpoint_,
        address accessControlManager_
    ) BaseOmnichainControllerSrc(accessControlManager_) {
        ensureNonzeroAddress(address(lzEndpoint_));
        LZ_ENDPOINT = lzEndpoint_;
    }

    /**
     * @notice Estimates LayerZero fees for cross-chain message delivery to the remote chain
     * @dev The estimated fees are the minimum required; it's recommended to increase the fees amount when sending a message. The unused amount will be refunded
     * @param remoteChainId_ The LayerZero id of a remote chain
     * @param payload_ The payload to be sent to the remote chain. It's computed as follows: payload = abi.encode(targets, values, signatures, calldatas)
     * @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
     * @return nativeFee The amount of fee in the native gas token (e.g. ETH)
     * @return zroFee The amount of fee in ZRO token
     */
    function estimateFees(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_
    ) external view returns (uint256, uint256) {
        return LZ_ENDPOINT.estimateFees(remoteChainId_, address(this), payload_, false, adapterParams_);
    }

    /**
     * @notice Sends a message to execute a remote proposal
     * @dev Stores the hash of the execution parameters if sending fails (e.g., due to insufficient fees)
     * @param remoteChainId_ The LayerZero id of the remote chain
     * @param payload_ The payload to be sent to the remote chain. It's computed as follows: payload = abi.encode(targets, values, signatures, calldatas, proposalType)
     * @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
     * @custom:event Emits ExecuteRemoteProposal with remote chain id and payload on success
     * @custom:event Emits StorePayload with last stored payload proposal ID ,remote chain id , payload, adapter params , values and reason for failure
     */
    function execute(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_
    ) external payable whenNotPaused {
        _ensureAllowed("execute(uint16,bytes,bytes)");

        require(msg.value > 0, "OmnichainProposalSender: value cannot be zero");
        require(validChainIds[remoteChainId_], "OmnichainProposalSender: Invalid chainId");
        require(payload_.length != 0, "OmnichainProposalSender: Empty payload");

        bytes memory trustedRemote = trustedRemoteLookup[remoteChainId_];
        require(trustedRemote.length != 0, "OmnichainProposalSender: destination chain is not a trusted source");

        (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas,

        ) = abi.decode(payload_, (address[], uint[], string[], bytes[], uint8));
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == calldatas.length,
            "OmnichainProposalSender: proposal function information arity mismatch"
        );

        _isEligibleToSend(remoteChainId_, targets.length);

        uint64 _pId = ++proposalCount;
        bytes memory payload;
        payload = abi.encode(payload_, _pId);

        try
            LZ_ENDPOINT.send{ value: msg.value }(
                remoteChainId_,
                trustedRemote,
                payload,
                payable(tx.origin),
                address(0),
                adapterParams_
            )
        {
            emit ExecuteRemoteProposal(remoteChainId_, _pId, payload_);
        } catch (bytes memory reason) {
            storedExecutionHashes[_pId] = keccak256(abi.encode(remoteChainId_, payload, adapterParams_, msg.value));
            emit StorePayload(_pId, remoteChainId_, payload_, adapterParams_, msg.value, reason);
        }
    }

    /**
     * @notice Resends a previously failed message
     * @dev Allows providing more fees if needed. The extra fees will be refunded to the caller
     * @param pId_ The proposal ID to identify a failed message
     * @param remoteChainId_ The LayerZero id of the remote chain
     * @param payload_ The payload to be sent to the remote chain. It's computed as follows: payload = abi.encode(targets, values, signatures, calldatas)
     * @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
     * @param originalValue_ The msg.value passed when execute() function was called
     * @custom:event Emits ClearPayload with proposal ID and hash
     */
    function retryExecute(
        uint64 pId_,
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        uint256 originalValue_
    ) external payable whenNotPaused nonReentrant {
        bytes32 hash = storedExecutionHashes[pId_];
        require(hash != bytes32(0), "OmnichainProposalSender: no stored payload");
        require(payload_.length != 0, "OmnichainProposalSender: Empty payload");

        bytes memory execution = abi.encode(remoteChainId_, payload_, adapterParams_, originalValue_);
        require(keccak256(execution) == hash, "OmnichainProposalSender: invalid execution params");

        delete storedExecutionHashes[pId_];

        LZ_ENDPOINT.send{ value: originalValue_ + msg.value }(
            remoteChainId_,
            trustedRemoteLookup[remoteChainId_],
            payload_,
            payable(msg.sender),
            address(0),
            adapterParams_
        );
        emit ClearPayload(pId_, hash);
    }

    /**
     * @notice Clear previously failed message
     * @param to_ Address of the receiver
     * @param pId_ The proposal ID to identify a failed message
     * @param remoteChainId_ The LayerZero id of the remote chain
     * @param payload_ The payload to be sent to the remote chain. It's computed as follows: payload = abi.encode(targets, values, signatures, calldatas)
     * @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
     * @param originalValue_ The msg.value passed when execute() function was called
     * @custom:access Only owner
     * @custom:event Emits ClearPayload with proposal ID and hash
     * @custom:event Emits FallbackWithdraw with receiver and amount
     */
    function fallbackWithdraw(
        address to_,
        uint64 pId_,
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        uint256 originalValue_
    ) external onlyOwner nonReentrant {
        ensureNonzeroAddress(to_);
        require(originalValue_ > 0, "OmnichainProposalSender: invalid native amount");
        require(address(this).balance >= originalValue_, "OmnichainProposalSender: insufficient native balance");
        require(payload_.length != 0, "OmnichainProposalSender: Empty payload");

        bytes32 hash = storedExecutionHashes[pId_];
        require(hash != bytes32(0), "OmnichainProposalSender: no stored payload");

        bytes memory execution = abi.encode(remoteChainId_, payload_, adapterParams_, originalValue_);
        require(keccak256(execution) == hash, "OmnichainProposalSender: invalid execution params");

        delete storedExecutionHashes[pId_];

        // Transfer the native to the `to_` address
        (bool sent, ) = to_.call{ value: originalValue_ }("");
        require(sent, "Call failed");

        emit FallbackWithdraw(to_, originalValue_);
        emit ClearPayload(pId_, hash);
    }

    /**
     * @notice Sets the remote message receiver address
     * @param remoteChainId_ The LayerZero id of a remote chain
     * @param remoteAddress_ The address of the contract on the remote chain to receive messages sent by this contract
     * @custom:access Controlled by AccessControlManager.
     * @custom:event Emits SetTrustedRemoteAddress with remote chain Id and remote address
     */
    function setTrustedRemoteAddress(uint16 remoteChainId_, bytes calldata remoteAddress_) external {
        _ensureAllowed("setTrustedRemoteAddress(uint16,bytes)");
        require(remoteChainId_ != 0, "ChainId must not be zero");
        ensureNonzeroAddress(address(uint160(bytes20(remoteAddress_))));
        trustedRemoteLookup[remoteChainId_] = abi.encodePacked(remoteAddress_, address(this));
        emit SetTrustedRemoteAddress(remoteChainId_, remoteAddress_);
    }

    /**
     * @notice Sets the configuration of the LayerZero messaging library of the specified version
     * @param version_ Messaging library version
     * @param chainId_ The LayerZero chainId for the pending config change
     * @param configType_ The type of configuration. Every messaging library has its own convention
     * @param config_ The configuration in bytes. It can encode arbitrary content
     * @custom:access Controlled by AccessControlManager.
     */
    function setConfig(uint16 version_, uint16 chainId_, uint256 configType_, bytes calldata config_) external {
        _ensureAllowed("setConfig(uint16,uint16,uint256,bytes)");
        LZ_ENDPOINT.setConfig(version_, chainId_, configType_, config_);
    }

    /**
     * @notice Sets the configuration of the LayerZero messaging library of the specified version
     * @param version_ New messaging library version
     * @custom:access Controlled by AccessControlManager.
     */
    function setSendVersion(uint16 version_) external {
        _ensureAllowed("setSendVersion(uint16)");
        LZ_ENDPOINT.setSendVersion(version_);
    }

    /**
     * @notice Update the list of valid chain Ids.
     * @param chainId_ chainId to be added or removed.
     * @param isAdded_  should be true to add chainId.
     * @custom:access Controlled by AccessControlManager.
     * @custom:event Emits UpdatedValidChainId with chain id and bool
     */
    function updateValidChainId(uint16 chainId_, bool isAdded_) external {
        _ensureAllowed("updateValidChainId(uint16,bool)");
        if (!isAdded_) {
            delete validChainIds[chainId_];
        } else {
            validChainIds[chainId_] = isAdded_;
        }
        emit UpdatedValidChainId(chainId_, isAdded_);
    }

    /**
     * @notice Gets the configuration of the LayerZero messaging library of the specified version
     * @param version_ Messaging library version
     * @param chainId_ The LayerZero chainId
     * @param configType_ Type of configuration. Every messaging library has its own convention.
     */
    function getConfig(uint16 version_, uint16 chainId_, uint256 configType_) external view returns (bytes memory) {
        return LZ_ENDPOINT.getConfig(version_, chainId_, address(this), configType_);
    }
}
