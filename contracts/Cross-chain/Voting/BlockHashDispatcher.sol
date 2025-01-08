// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { ILayerZeroEndpoint } from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IAccessControlManagerV8 } from "./../../Governance/IAccessControlManagerV8.sol";

contract BlockHashDispatcher is Pausable {
    /**
     * @notice ACM (Access Control Manager) contract address
     */
    address public accessControlManager;

    /**
     *  @notice Proposal chain id on which block hash will be send (BNB)
     */

    uint16 public proposalChainId;

    // remote identifier => blockHash
    mapping(uint256 => bytes32) public blockHash;

    /**
     * @notice LayerZero endpoint for sending messages to remote chains
     */
    ILayerZeroEndpoint public immutable LZ_ENDPOINT;

    /**
     * @notice Specifies the allowed path for sending messages (remote chainId => remote app address + local app address)
     */
    mapping(uint16 => bytes) public trustedRemoteLookup;

    /**
     * @notice Execution hashes of failed messages
     * @dev [identifier] -> [executionHash]
     */
    mapping(uint256 => bytes32) public storedExecutionHashes;

    /**
     * @notice Emitted when a remote message receiver is set for the remote chain
     */
    event SetTrustedRemoteAddress(uint16 indexed chainId, bytes oldRemoteAddress, bytes newRemoteAddress);
    /**
     * @notice Emitted when block hash is send to proposal chain (BNB)
     */
    event HashDispatched(uint256 indexed remoteIdentifier, bytes payload);

    /**
     * @notice Emitted when an execution hash of a failed message is saved
     */
    event HashStored(uint256 indexed remoteIdentifier, bytes payload, bytes adapterParams, uint256 value, bytes reason);

    /**
     * @notice Event emitted when trusted remote sets to empty
     */
    event TrustedRemoteRemoved(uint16 indexed chainId);

    /**
     * @notice Emitted when a previously failed message is successfully sent to the proposal chain (BNB)
     */
    event ClearPayload(uint256 indexed remoteIdentifier, bytes32 executionHash);

    /*
     * @notice Emitted when the address of ACM is updated
     */
    event NewAccessControlManager(address indexed oldAccessControlManager, address indexed newAccessControlManager);

    constructor(ILayerZeroEndpoint lzEndpoint_, address accessControlManager_, uint16 proposalChainId_) {
        ensureNonzeroAddress(address(lzEndpoint_));
        require(proposalChainId_ != 0, "chain id can't be zero");
        LZ_ENDPOINT = lzEndpoint_;
        proposalChainId = proposalChainId_;
        accessControlManager = accessControlManager_;
    }

    /**
     * @notice Triggers the paused state of the controller
     * @custom:access Controlled by AccessControlManager
     */
    function pause() external {
        _ensureAllowed("pause()");
        _pause();
    }

    /**
     * @notice Triggers the resume state of the controller
     * @custom:access Controlled by AccessControlManager
     */
    function unpause() external {
        _ensureAllowed("unpause()");
        _unpause();
    }

    /**
     * @notice Sets the address of Access Control Manager (ACM)
     * @param newAccessControlManager The new address of the Access Control Manager
     * @custom:access Only owner
     * @custom:event Emits NewAccessControlManager with old and new access control manager addresses
     */
    function setAccessControlManager(address newAccessControlManager) external {
        _ensureAllowed("setAccessControlManager(address)");
        ensureNonzeroAddress(newAccessControlManager);
        emit NewAccessControlManager(accessControlManager, newAccessControlManager);
        accessControlManager = newAccessControlManager;
    }

    /**
     * @notice Estimates LayerZero fees for cross-chain message delivery to the proposal chain
     * @dev The estimated fees are the minimum required; it's recommended to increase the fees amount when sending a message. The unused amount will be refunded
     * @param payload The payload to be sent to the proposal chain. It's computed as follows:
     * payload = abi.encode(remoteIdentifier, blockHash)
     * @param useZro Bool that indicates whether to pay in ZRO tokens or not
     * @param adapterParams The params used to specify the custom amount of gas required for the execution on the proposal chain
     * @return nativeFee The amount of fee in the native gas token (e.g. ETH)
     * @return zroFee The amount of fee in ZRO token
     */
    function estimateFees(
        bytes calldata payload,
        bool useZro,
        bytes calldata adapterParams
    ) external view returns (uint256, uint256) {
        return LZ_ENDPOINT.estimateFees(proposalChainId, address(this), payload, useZro, adapterParams);
    }

    /**
     * @notice Remove trusted remote from storage
     * @param chainId The chain's id corresponds to setting the trusted remote to empty
     * @custom:access Controlled by Access Control Manager
     * @custom:event Emit TrustedRemoteRemoved with remote chain id
     */
    function removeTrustedRemote(uint16 chainId) external {
        _ensureAllowed("removeTrustedRemote(uint16)");
        require(trustedRemoteLookup[chainId].length != 0, "trusted remote not found");
        delete trustedRemoteLookup[chainId];
        emit TrustedRemoteRemoved(chainId);
    }

    /**
     * @notice Dispatches a block hash along with a remote identifier to proposal chain(BNB)
     * @param remoteIdentifier A unique identifier to identify the proposal
     * @param zroPaymentAddress The address for payment using ZRO tokens
     * @param adapterParams The params used to specify the custom amount of gas required for the execution on the destination
     */
    function dispatchHash(
        uint256 remoteIdentifier,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable {
        // Send hash only once for each unique identifier
        require(blockHash[remoteIdentifier] == bytes32(0), "block hash already exists");

        bytes32 blockHash_ = blockhash(block.number - 1);
        bytes memory payload = abi.encode(remoteIdentifier, blockHash_);
        uint16 proposalChainId_ = proposalChainId;
        bytes memory trustedRemote = trustedRemoteLookup[proposalChainId_];
        require(trustedRemote.length != 0, "proposal chain id is not set");

        // A zero value will result in a failed message; therefore, a positive value is required to send a message across the chain.
        require(msg.value > 0, "value cannot be zero");

        try
            LZ_ENDPOINT.send{ value: msg.value }(
                proposalChainId_,
                trustedRemote,
                payload,
                payable(msg.sender),
                zroPaymentAddress,
                adapterParams
            )
        {
            emit HashDispatched(remoteIdentifier, payload);
        } catch (bytes memory reason) {
            storedExecutionHashes[remoteIdentifier] = keccak256(abi.encode(payload, adapterParams, msg.value));
            emit HashStored(remoteIdentifier, payload, adapterParams, msg.value, reason);
        }
    }

    /**
     * @notice Resends a previously failed message
     * @dev Allows providing more fees if needed. The extra fees will be refunded to the caller
     * @param remoteIdentifier The unique remote identifier identify a failed message
     * @param payload The payload to be sent to the remote chain
     * It's computed as follows: payload = abi.encode(remoteIdentifier, blockHash)
     * @param adapterParams The params used to specify the custom amount of gas required for the execution on the destination
     * @param zroPaymentAddress The address of the ZRO token holder who would pay for the transaction.
     * @param originalValue The msg.value passed when dispatchHash() function was called
     * @custom:event Emits ClearPayload with proposal id and hash
     * @custom:access Controlled by Access Control Manager
     */
    function retryExecute(
        uint256 remoteIdentifier,
        bytes calldata payload,
        bytes calldata adapterParams,
        address zroPaymentAddress,
        uint256 originalValue
    ) external payable whenNotPaused {
        _ensureAllowed("retryExecute(uint256,uint16,bytes,bytes,address,uint256)");
        uint16 proposalChainId_ = proposalChainId;

        bytes memory trustedRemote = trustedRemoteLookup[proposalChainId_];
        require(trustedRemote.length != 0, "proposal chain id is not a trusted source");
        bytes32 hash = storedExecutionHashes[remoteIdentifier];
        require(hash != bytes32(0), "no stored payload");

        require(keccak256(abi.encode(payload, adapterParams, originalValue)) == hash, "invalid execution params");

        delete storedExecutionHashes[remoteIdentifier];

        emit ClearPayload(remoteIdentifier, hash);

        LZ_ENDPOINT.send{ value: originalValue + msg.value }(
            proposalChainId_,
            trustedRemote,
            payload,
            payable(msg.sender),
            zroPaymentAddress,
            adapterParams
        );
    }

    /**
     * @notice Ensure that the caller has permission to execute a specific function
     * @param functionSig Function signature to be checked for permission
     */
    function _ensureAllowed(string memory functionSig) internal view {
        require(
            IAccessControlManagerV8(accessControlManager).isAllowedToCall(msg.sender, functionSig),
            "access denied"
        );
    }

    function getHash(uint256 blockTimestamp) external view returns (uint256, bytes32) {
        bytes32 blockHash_ = blockhash(blockTimestamp);
        return (blockTimestamp, blockHash_);
    }
}
