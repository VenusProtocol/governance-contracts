// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@layerzerolabs/solidity-examples/contracts/interfaces/ILayerZeroEndpoint.sol";
import { OmnichainController } from "./OmnichainController.sol";

/// @title Omnichain Governance Proposal Sender
/// @notice Sends a proposal's data to remote chains for execution after the proposal passes on the main chain
/// @dev When used with GovernorBravo the owner of this contract must be set to the Timelock contract
contract OmnichainProposalSender is ReentrancyGuard, OmnichainController {
    enum ProposalType {
        NORMAL,
        FASTTRACK,
        CRITICAL
    }

    uint64 public lastStoredPayloadNonce;

    /// @notice Execution hashes of failed messages
    /// @dev [nonce] -> [executionHash]

    mapping(uint64 => bytes32) public storedExecutionHashes;

    /// @notice Valid chainIds on remote

    mapping(uint16 => bool) public validChainIds;

    /// @notice Unique Proposal, should not having multiple proposal with chainId at a time

    mapping(uint256 => mapping(uint16 => uint256)) public uniqueProposal;

    /// @notice LayerZero endpoint for sending messages to remote chains

    ILayerZeroEndpoint public immutable lzEndpoint;

    /// @notice Specifies the allowed path for sending messages (remote chainId => remote app address + local app address)

    mapping(uint16 => bytes) public trustedRemoteLookup;

    /// @notice Emitted when a remote message receiver is set for the remote chain

    event SetTrustedRemoteAddress(uint16 remoteChainId, bytes remoteAddress);

    /// @notice Emitted when a proposal execution request sent to the remote chain

    event ExecuteRemoteProposal(uint16 indexed remoteChainId, bytes payload);

    /// @notice Emitted when a previously failed message successfully sent to the remote chain

    event ClearPayload(uint64 indexed nonce, bytes32 executionHash);

    /// @notice Emitted when an execution hash of a failed message saved

    event StorePayload(
        uint64 indexed nonce,
        uint16 indexed remoteChainId,
        bytes payload,
        bytes adapterParams,
        uint256 value,
        bytes reason
    );

    /// @notice Emitted while updating Valid ChainId mapping

    event UpdatedValidChainId(uint16 chainId, bool isAdded);

    constructor(
        ILayerZeroEndpoint lzEndpoint_,
        address accessControlManager_
    ) OmnichainController(accessControlManager_) {
        require(address(lzEndpoint_) != address(0), "OmnichainProposalSender: invalid endpoint");
        lzEndpoint = lzEndpoint_;
    }

    /// @notice Estimates LayerZero fees for cross-chain message delivery to the remote chain
    /// @dev The estimated fees are the minimum required, it's recommended to increase the fees amount when sending a message. The unused amount will be refunded
    /// @param remoteChainId_ The LayerZero id of a remote chain
    /// @param payload_ The payload to be sent to the remote chain. It's computed as follows payload = abi.encode(targets, values, signatures, calldatas)
    /// @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
    /// @return nativeFee The amount of fee in the native gas token (e.g. ETH)
    /// @return zroFee The amount of fee in ZRO token
    function estimateFees(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        return lzEndpoint.estimateFees(remoteChainId_, address(this), payload_, false, adapterParams_);
    }

    /// @notice Sends a message to execute a remote proposal
    /// @dev Stores the hash of the execution parameters if sending fails (e.g., due to insufficient fees)
    /// @param remoteChainId_ The LayerZero id of the remote chain
    /// @param payload_ The payload_ to be sent to the remote chain. It's computed as follows payload = abi.encode(targets, values, signatures, calldatas)
    /// @param adapterParams_ The params used to specify the custom amount of gas required for the execution on the destination
    function execute(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_
    ) external payable whenNotPaused {
        _ensureAllowed("execute(uint16,bytes,bytes)");

        (address[] memory targets, , , , uint256 pId, ) = abi.decode(
            payload_,
            (address[], uint[], string[], bytes[], uint256, uint8)
        );

        require(validChainIds[remoteChainId_], "OmnichainProposalSender: Invalid chainId");
        bytes memory trustedRemote = trustedRemoteLookup[remoteChainId_];
        require(trustedRemote.length != 0, "OmnichainProposalSender: destination chain is not a trusted source");
        ++uniqueProposal[pId][remoteChainId_];
        require(uniqueProposal[pId][remoteChainId_] == 1, "OmnichainProposalSender: Invalid proposal");

        _isEligibleToSend(remoteChainId_, targets.length);
        try
            lzEndpoint.send{ value: msg.value }(
                remoteChainId_,
                trustedRemote,
                payload_,
                payable(tx.origin),
                address(0),
                adapterParams_
            )
        {
            emit ExecuteRemoteProposal(remoteChainId_, payload_);
        } catch (bytes memory reason) {
            uint64 _lastStoredPayloadNonce = ++lastStoredPayloadNonce;
            bytes memory execution = abi.encode(remoteChainId_, payload_, adapterParams_, msg.value);
            storedExecutionHashes[_lastStoredPayloadNonce] = keccak256(execution);
            emit StorePayload(_lastStoredPayloadNonce, remoteChainId_, payload_, adapterParams_, msg.value, reason);
        }
    }

    /// @notice Resends a previously failed message
    /// @dev Allows to provide more fees if needed. The extra fees will be refunded to the caller
    /// @param nonce_ The nonce to identify a failed message
    /// @param remoteChainId_ The LayerZero id of the remote chain
    /// @param payload_ The payload to be sent to the remote chain. It's computed as follows payload = abi.encode(targets, values, signatures, calldatas)
    /// @param adapterParams_ _The params used to specify the custom amount of gas required for the execution on the destination
    /// @param originalValue_ The msg.value passed when execute() function was called
    function retryExecute(
        uint64 nonce_,
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        uint256 originalValue_
    ) external payable whenNotPaused nonReentrant {
        bytes32 hash = storedExecutionHashes[nonce_];
        require(hash != bytes32(0), "OmnichainProposalSender: no stored payload_");

        bytes memory execution = abi.encode(remoteChainId_, payload_, adapterParams_, originalValue_);
        require(keccak256(execution) == hash, "OmnichainProposalSender: invalid execution params");

        delete storedExecutionHashes[nonce_];

        lzEndpoint.send{ value: originalValue_ + msg.value }(
            remoteChainId_,
            trustedRemoteLookup[remoteChainId_],
            payload_,
            payable(msg.sender),
            address(0),
            adapterParams_
        );
        emit ClearPayload(nonce_, hash);
    }

    /// @notice Sets the remote message receiver address
    /// @param remoteChainId_ The LayerZero id of a remote chain
    /// @param remoteAddress_ The address of the contract on the remote chain to receive messages sent by this contract
    function setTrustedRemoteAddress(uint16 remoteChainId_, bytes calldata remoteAddress_) external {
        _ensureAllowed("setTrustedRemoteAddress(uint16,bytes)");
        trustedRemoteLookup[remoteChainId_] = abi.encodePacked(remoteAddress_, address(this));
        emit SetTrustedRemoteAddress(remoteChainId_, remoteAddress_);
    }

    /// @notice Sets the configuration of the LayerZero messaging library of the specified version
    /// @param version_ Messaging library version
    /// @param chainId_ The LayerZero chainId for the pending config change
    /// @param configType_ The type of configuration. Every messaging library has its own convention
    /// @param config_ The configuration in bytes. It can encode arbitrary content
    function setConfig(uint16 version_, uint16 chainId_, uint256 configType_, bytes calldata config_) external {
        _ensureAllowed("setConfig(uint16,uint16,uint256,bytes)");
        lzEndpoint.setConfig(version_, chainId_, configType_, config_);
    }

    /// @notice Sets the configuration of the LayerZero messaging library of the specified version
    /// @param version_ New messaging library version
    function setSendVersion(uint16 version_) external {
        _ensureAllowed("setSendVersion(uint16)");
        lzEndpoint.setSendVersion(version_);
    }

    /// Update the list of valid chain Ids
    /// @param chainId_ chainId to be added or removed
    /// @param isAdded_  should be true to add chainId
    function updateValidChainID(uint16 chainId_, bool isAdded_) external {
        _ensureAllowed("updateValidChainID(uint16,bool)");
        if (!isAdded_) {
            delete validChainIds[chainId_];
        } else {
            validChainIds[chainId_] = isAdded_;
        }
        emit UpdatedValidChainId(chainId_, isAdded_);
    }

    /// @notice Gets the configuration of the LayerZero messaging library of the specified version
    /// @param version_ Messaging library version
    /// @param chainId_ The LayerZero chainId
    /// @param configType_ Type of configuration. Every messaging library has its own convention.
    function getConfig(uint16 version_, uint16 chainId_, uint256 configType_) external view returns (bytes memory) {
        return lzEndpoint.getConfig(version_, chainId_, address(this), configType_);
    }

    /// @notice Empty implementation of renounce ownership to avoid any mishappening.

    function renounceOwnership() public override {}
}
