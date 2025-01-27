// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IVotingPowerAggregator {
    struct Proofs {
        uint32 remoteChainEid;
        bytes numCheckpointsProof;
        bytes checkpointsProof;
    }

    /**
     * @notice Emitted when proposal failed
     */
    event ReceivePayloadFailed(uint32 indexed remoteChainEid, bytes indexed remoteAddress, uint64 nonce, bytes reason);

    /**
     * @notice Emitted when block hash of remote chain is received
     */
    event HashReceived(uint256 indexed remoteIdentifier, uint32 indexed remoteChainEid, bytes blockHash);

    /**
     * @notice Emitted when remote configurations are updated
     */
    event UpdateDeactivatedremoteChainEid(uint32 indexed remoteChainEid, bool isSupported);

    /**
     * @notice Emitted when vault address is updated
     */
    event UpdateVaultAddress(uint32 indexed remoteChainEid, address xvsVault);

    /**
     * @notice Thrown when syncing details for an unsupported network is provided
     */
    error RemoteChainNotSupported(uint32 chainId);

    /**
     * @notice Thrown when chain id is deactivated
     */
    error DeactivatedChainId(uint32 chainId);

    /**
     * @notice Thrown when an access controlled function is called
     */
    error InvalidCaller(address providedAddress, address requiredAddress);

    /**
     * @notice Thrown when an invalid block timestamp is provided
     */
    error InvalidBlockTimestamp(uint32 remoteChainEid, uint256 providedTimestamp);

    /**
     * @notice Thrown when array lengths mismatch
     */
    error LengthMismatch(string additionalReason);

    /**
     * @notice Thrown when proposal threshold is not met
     */
    error ProposalThresholdNotMet(uint256 providedPower, uint256 acceptablePower);

    /**
     * @notice Thrown when an invalid chain id is provided
     */
    error InvalidChainEid(uint32 remoteChainEid);

    /**
     * @notice Thrown when a proposal does not exist
     */
    error LZReceiveProposalNotExists(string reason);
}
