// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title BlockHashDispatcher
 * @notice A contract for dispatching block hashes to a proposal chain and managing messaging between chains.
 * @dev Inherits functionality from OApp, Pausable, and Ownable. Implements LayerZero messaging and access control.
 */
contract BlockHashDispatcher is Pausable, OApp, Initializable {
    /// @notice Messaging parameters structure
    struct MessagingParams {
        uint32 dstEid; // Destination chain ID
        bytes32 receiver; // Receiver address on the destination chain
        bytes payload; // Encoded data payload
        bytes options; // Messaging options
        bool payInLzToken; // Indicates payment in LayerZero tokens
    }

    /**
     * @notice ID of the proposal chain (e.g., BNB Chain) where block hashes will be sent
     */
    uint32 public BSC_CHAIN_ID;

    /**
     * @notice LZ chain id of this chain
     */
    uint32 public chainId;

    /**
     * @notice Emitted when a block hash is dispatched to the proposal chain
     * @param pId Proposal Id
     * @param blockNum Block number
     * @param payload Encoded data payload
     */
    event HashDispatched(uint256 indexed pId, uint256 indexed blockNum, bytes payload);

    /// @notice Error thrown when an invalid chain ID is provided
    error InvalidChainEid(uint32 eid);

    constructor(address endpoint_, address owner_) OApp(endpoint_, owner_) Ownable() {
        ensureNonzeroAddress(address(endpoint_));
    }

    function initialize(uint32 bnbChainEId_, uint32 chainId_) external initializer {
        if (bnbChainEId_ == 0 || chainId_ == 0) {
            revert InvalidChainEid(0);
        }

        BSC_CHAIN_ID = bnbChainEId_;
        chainId = chainId_;
    }

    /**
     * @notice Pauses the contract
     * @dev Callable only by the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Callable only by the owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Generates a payload containing a block hash
     * @param pId Unique identifier for the proposal
     * @param blockNumber Block number for which the hash is generated
     * @return payload Encoded payload containing the proposal ID, block number, and block hash
     */
    function getPayload(uint256 pId, uint256 blockNumber) public view returns (bytes memory payload) {
        bytes32 blockHash_ = blockhash(blockNumber);
        payload = abi.encode(pId, blockNumber, blockHash_, chainId);
    }

    /**
     * @notice Quotes the messaging fee for dispatching a block hash
     * @param pId Proposal ID
     * @param blockNumber Block number
     * @param options Messaging options
     * @param payInLzToken Payment method (native token or LayerZero token)
     * @return fee The messaging fee details
     */
    function quote(
        uint256 pId,
        uint256 blockNumber,
        bytes memory options,
        bool payInLzToken
    ) public view returns (MessagingFee memory fee) {
        return _quote(BSC_CHAIN_ID, getPayload(pId, blockNumber), options, payInLzToken);
    }

    /**
     * @notice Dispatches a block hash along with its proposal ID and block number to the proposal chain
     * @param pId Proposal ID
     * @param blockNumber Block number
     * @param zroTokens Address for ZRO token payment
     * @param options Custom gas options for execution on the destination chain
     */
    function dispatchHash(
        uint256 pId,
        uint256 blockNumber,
        uint256 zroTokens,
        bytes calldata options
    ) external payable whenNotPaused {
        bytes memory payload = getPayload(pId, blockNumber);

        _lzSend(
            BSC_CHAIN_ID,
            payload,
            options,
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, zroTokens),
            // Refund address in case of failed source message.
            payable(msg.sender)
        );
        emit HashDispatched(pId, blockNumber, payload);
    }

    /**
     * @notice Internal function to handle incoming LayerZero messages
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address _executor,
        bytes calldata _extraData
    ) internal override {}

    /**
     * @notice Retrieves the block hash for a given block number and proposal ID
     * @param blockNumber The block number
     * @param pId The proposal ID
     * @return pId The proposal ID
     * @return blockNumber The block number
     * @return blockHash_ The block hash
     */
    function getHash(
        uint256 blockNumber,
        uint256 pId
    ) external view whenNotPaused returns (uint256, uint256, bytes32, uint32) {
        bytes32 blockHash_ = blockhash(blockNumber);
        return (pId, blockNumber, blockHash_, chainId);
    }
}
