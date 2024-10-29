// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;
import { IDataWarehouse } from "../interfaces/IDataWarehouse.sol";
import { SlotUtils } from "../../Utils/SlotUtils.sol";
import { StateProofVerifier } from "../libs/StateProofVerifier.sol";
import { ExcessivelySafeCall } from "@layerzerolabs/solidity-examples/contracts/libraries/ExcessivelySafeCall.sol";

import { NonblockingLzApp } from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract VotingPowerAggregator is NonblockingLzApp, Pausable {
    using ExcessivelySafeCall for address;

    struct Proofs {
        uint16 remoteChainId;
        bytes numCheckpointsProof;
        bytes checkpointsProof;
    }

    uint8 public constant CHECKPOINTS_SLOT = 16;
    uint8 public constant NUM_CHECKPOINTS_SLOT = 17;
    IDataWarehouse public warehouse;

    // containing deactivation record of chain id
    mapping(uint16 => bool) public isdeactived;

    // remote identifier => chainId => blockHash
    mapping(uint256 => mapping(uint16 => bytes32)) public remoteBlockHash;

    // Address of XVS vault corresponding to remote chain Id
    mapping(uint16 => address) public xvsVault;

    /**
     * @notice Emitted when proposal failed
     */
    event ReceivePayloadFailed(uint16 indexed remoteChainId, bytes indexed remoteAddress, uint64 nonce, bytes reason);

    /**
     * @notice Emitted when block hash of remote chain is received
     */
    event HashReceived(uint256 indexed remoteIdentifier, uint16 indexed remoteChainId, bytes blockHash);

    /**
     *  @notice Emitted when remote configurations are updated
     */
    event UpdateDeactivatedRemoteChainId(uint16 indexed remoteChainId, bool isSupported);

    /**
     * @notice Emitted when vault addressis updated
     */
    event UpdateVaultAddress(uint16 indexed remoteChainId, address xvsVault);

    /**
     * @notice Thrown when invalid chain id is provided
     */
    error InvalidChainId(uint16 chainId);

    /**
     * @notice Thrown when chain id is deactivated
     */
    error DeactivatedChainId(uint16 chainId);

    constructor(address endpoint, address warehouseAddress) NonblockingLzApp(endpoint) {
        ensureNonzeroAddress(warehouseAddress);
        warehouse = IDataWarehouse(warehouseAddress);
    }

    /**
     * @notice Triggers the paused state of the aggregator
     * @custom:access Only owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Triggers the resume state of the aggregator
     * @custom:access Only owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update xvs vault address corresponding to the remote chain id
     * @param remoteChainId An array of remote chain ids
     * @param xvsVaultAddress An array of XVS vault addresses corresponding to each remote chain id
     * @custom:access Only owner
     * @custom:event UpdateVaultAddress with remote chain id and its corresponding xvs vault address
     */
    function updateVaultAddress(
        uint16[] calldata remoteChainId,
        address[] calldata xvsVaultAddress
    ) external onlyOwner {
        require(remoteChainId.length == xvsVaultAddress.length, "invalid params");
        for (uint16 i; i < remoteChainId.length; ++i) {
            ensureNonzeroAddress(xvsVaultAddress[i]);
            if (remoteChainId[i] == 0) {
                revert InvalidChainId(remoteChainId[i]);
            }

            xvsVault[remoteChainId[i]] = xvsVaultAddress[i];
            emit UpdateVaultAddress(remoteChainId[i], xvsVaultAddress[i]);
        }
    }

    /**
     * @notice Updates the deactivedRemoteChainIds array
     * @param remoteChainId An array of remote chain ids to update
     * @param isDeactivated An array indicating whether each remote chain id is deactivated or not
     * @custom:access Only owner
     * @custom:emit UpdateDeactivatedRemoteChainId emitted with remote chain id & its deactivation status
     */
    function updateDeactivatedRemoteChainId(
        uint16[] calldata remoteChainId,
        bool[] calldata isDeactivated
    ) external onlyOwner {
        for (uint16 i; i < remoteChainId.length; ++i) {
            if (remoteChainId[i] == 0) {
                revert InvalidChainId(remoteChainId[i]);
            }
            isdeactived[remoteChainId[i]] = isDeactivated[i];
            emit UpdateDeactivatedRemoteChainId(remoteChainId[i], isDeactivated[i]);
        }
    }

    /**
     * @notice Calculates the total voting power of a voter across multiple remote chains
     * @param voter The address of the voter for whom to calculate the voting power
     * @param remoteIdentifier The identifier that links to remote chain-specific data
     * @param proofs Array of proofs containing remote chain id with their corresponding proofs (numCheckpointsProof, checkpointsProof) where
     *  numCheckpointsProof is the proof data needed to verify the number of checkpoints and
     *  checkpointsProof is the proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of the voter across all supported remote chains
     */
    function getVotingPower(
        address voter,
        uint256 remoteIdentifier,
        Proofs[] calldata proofs
    ) external view returns (uint96 power) {
        uint96 totalVotingPower;
        for (uint16 i; i < proofs.length; ++i) {
            // remoteChainId must be active
            if (isdeactived[proofs[i].remoteChainId]) {
                revert DeactivatedChainId(proofs[i].remoteChainId);
            }
            totalVotingPower += _getVotingPower(
                proofs[i].remoteChainId,
                remoteIdentifier,
                proofs[i].numCheckpointsProof,
                proofs[i].checkpointsProof,
                voter
            );
        }

        return totalVotingPower;
    }

    /**
     * @dev Calculates the total voting power of a voter for a remote chain
     * @param voter The address of the voter for whom to calculate the voting power
     * @param remoteIdentifier The identifier that links to remote chain-specific data
     * @param numCheckpointsProof The proof data needed to verify the number of checkpoints
     * @param checkpointsProof The proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of supported remote chains
     */
    function _getVotingPower(
        uint16 remoteChainId,
        uint256 remoteIdentifier,
        bytes calldata numCheckpointsProof,
        bytes calldata checkpointsProof,
        address voter
    ) internal view returns (uint96) {
        bytes32 blockHash = remoteBlockHash[remoteIdentifier][remoteChainId];
        address vault = xvsVault[remoteChainId];

        StateProofVerifier.SlotValue memory latestCheckpoint = warehouse.getStorage(
            vault,
            blockHash,
            SlotUtils.getAccountSlotHash(voter, NUM_CHECKPOINTS_SLOT),
            numCheckpointsProof
        );

        // Reverts if latest checkpoint not exists
        require(latestCheckpoint.exists, "Invalid num checkpoint proof");

        if (latestCheckpoint.value == 0) {
            return 0;
        }
        StateProofVerifier.SlotValue memory votingPower = warehouse.getStorage(
            vault,
            blockHash,
            SlotUtils.getCheckpointSlotHash(voter, uint32(latestCheckpoint.value - 1), uint32(CHECKPOINTS_SLOT)),
            checkpointsProof
        );

        // Reverts if voting power not exists
        require(votingPower.exists, "Invalid checkpoint proof");

        return votingPower.value >> 32;
    }

    /**
     * @notice Process blocking LayerZero receive request
     * @param remoteChainId Remote chain Id
     * @param remoteAddress Remote address from which payload is received
     * @param nonce Nonce associated with the payload to prevent replay attacks
     * @param payload Encoded payload containing block hash and remote identifier of remote chains
     * @custom:event Emit ReceivePayloadFailed if call fails
     */
    function _blockingLzReceive(
        uint16 remoteChainId,
        bytes memory remoteAddress,
        uint64 nonce,
        bytes memory payload
    ) internal override {
        bytes32 hashedPayload = keccak256(payload);
        bytes memory callData = abi.encodeCall(
            this.nonblockingLzReceive,
            (remoteChainId, remoteAddress, nonce, payload)
        );

        (bool success, bytes memory reason) = address(this).excessivelySafeCall(gasleft() - 30000, 150, callData);
        // try-catch all errors/exceptions
        if (!success) {
            failedMessages[remoteChainId][remoteAddress][nonce] = hashedPayload;
            emit ReceivePayloadFailed(remoteChainId, remoteAddress, nonce, reason); // Retrieve payload from the remote chain if needed to clear
        }
    }

    /**
     * @notice Process non blocking LayerZero receive request
     * @param payload Encoded payload containing block hash and remote identifier of remote chains
     * @custom:event Emit ProposalReceived
     */
    function _nonblockingLzReceive(
        uint16 remoteChainId,
        bytes memory,
        uint64,
        bytes memory payload
    ) internal override whenNotPaused {
        // remoteIdentifier is unique identifier generated at the time of createProposal
        (uint256 remoteIdentifier, bytes memory blockHash) = abi.decode(payload, (uint256, bytes));

        // Prevent Overriding hash
        require(remoteBlockHash[remoteIdentifier][remoteChainId] == bytes32(0), "block hash already exists");

        emit HashReceived(remoteIdentifier, remoteChainId, blockHash);
    }
}
