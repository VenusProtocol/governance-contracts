// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;
import { IDataWarehouse } from "../interfaces/IDataWarehouse.sol";
import { SlotUtils } from "../../Utils/SlotUtils.sol";
import { StateProofVerifier } from "../libs/StateProofVerifier.sol";
import { ExcessivelySafeCall } from "@layerzerolabs/solidity-examples/contracts/libraries/ExcessivelySafeCall.sol";

import { NonblockingLzApp } from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

import { BlockHashDispatcher } from "./BlockHashDispatcher.sol";

import { MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppRead } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppRead.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { IOAppMapper } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppMapper.sol";
import { IOAppReducer } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppReducer.sol";
import { ReadCodecV1, EVMCallComputeV1, EVMCallRequestV1 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/ReadCodecV1.sol";

contract VotingPowerAggregator is NonblockingLzApp, Pausable, OAppRead {
    using ExcessivelySafeCall for address;

    struct Proofs {
        uint16 remoteChainId;
        bytes numCheckpointsProof;
        bytes checkpointsProof;
    }

    enum Status {
        REJECTED,
        PENDING,
        ACTIVE
    }

    uint8 public constant CHECKPOINTS_SLOT = 16;
    uint8 public constant NUM_CHECKPOINTS_SLOT = 17;
    IDataWarehouse public warehouse;

    address public governanceBravo;
    mapping(uint256 => uint16[]) private requiredChainIds;
    mapping(uint256 => uint16[]) public remoteChainIds;
    // block timestamp => proposal ID
    mapping(uint256 => uint256) public proposalId;

    mapping(uint256 => bytes[]) private remoteBlockHeaders;

    // blockTimestamp => proof
    mapping(uint256 => Proofs[]) public proposerVotingProof;

    // containing deactivation record of chain id
    mapping(uint16 => bool) public isdeactived;

    // chainId -> block number -> block hash
    mapping(uint16 => mapping(uint256 => bytes32)) public remoteBlockHash;

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

    constructor(address endpoint, address warehouseAddress, address bravo) NonblockingLzApp(endpoint) {
        ensureNonzeroAddress(warehouseAddress);
        ensureNonzeroAddress(bravo);
        warehouse = IDataWarehouse(warehouseAddress);
        governanceBravo = bravo;
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

    function getRemoteBlockHashes(
        uint16[] remoteChainId,
        uint16 appLabel,
        Proofs[] proposerVotingProofs,
        bytes[] memory remoteBlockheader
    ) external {
        uint32 channelId = getChannelId();
        EVMReadRequest[] requests = getRequests(remoteChainIds);
        EVMComputeRequest computeRequest = getComputeRequests(remoteChainIds);
        bytes calldata options = getOptions();

        // decode blockTimestamp from remoteBlockHeader
        for (uint256 i; i < remoteBlockHeader.length; i++) {
            blockTimestamp = decode(remoteBlockheader);
            requiredChainIds[blockTimestamp].push(remoteChainIds);
            remoteBlockHeaders[blockTimestamp] = remoteBlockHeader;
        }
        remoteChainIds[blockTimestamp] = remoteChainId;

        proposerVotingProof[tx.origin] = proposerVotingProofs;
        bytes memory cmd = buildCmd(_appLabel, _requests, _computeRequest);
        receipt = _lzSend(_channelId, cmd, _options, MessagingFee(msg.value, 0), payable(tx.origin));
    }

    /**
     * @notice Builds the command to be sent
     * @param appLabel The application label to use for the message.
     * @param _readRequests An array of `EvmReadRequest` structs containing the read requests to be made.
     * @param _computeRequest A `EvmComputeRequest` struct containing the compute request to be made.
     * @return cmd The encoded command to be sent to to the channel.
     */
    function buildCmd(
        uint16 appLabel,
        EvmReadRequestV1[] memory _readRequests,
        EvmComputeRequest memory _computeRequest
    ) public pure returns (bytes memory) {
        require(_readRequests.length > 0, "LzReadCounter: empty requests");
        // build read requests
        EVMCallRequestV1[] memory readRequests = new EVMCallRequestV1[](_readRequests.length);
        for (uint256 i = 0; i < _readRequests.length; i++) {
            EvmReadRequestV1 memory req = _readRequests[i];
            readRequests[i] = EVMCallRequestV1({
                appRequestLabel: req.appRequestLabel,
                targetEid: req.targetEid,
                isBlockNum: req.isBlockNum,
                blockNumOrTimestamp: req.blockNumOrTimestamp,
                confirmations: req.confirmations,
                to: req.to,
                callData: abi.encodeWithSelector(this.myInformation.selector)
            });
        }
        require(_computeRequest.computeSetting <= COMPUTE_SETTING_NONE, "LzReadCounter: invalid compute type");
        EVMCallComputeV1 memory evmCompute = EVMCallComputeV1({
            computeSetting: _computeRequest.computeSetting,
            targetEid: _computeRequest.computeSetting == COMPUTE_SETTING_NONE ? 0 : _computeRequest.targetEid,
            isBlockNum: _computeRequest.isBlockNum,
            blockNumOrTimestamp: _computeRequest.blockNumOrTimestamp,
            confirmations: _computeRequest.confirmations,
            to: _computeRequest.to
        });
        bytes memory cmd = ReadCodecV1.encode(appLabel, readRequests, evmCompute);
        return cmd;
    }

    /**
     * @notice Calculates the total voting power of a voter across multiple remote chains
     * @param voter The address of the voter for whom to calculate the voting power
     * @param proofs Array of proofs containing remote chain id with their corresponding proofs (numCheckpointsProof, checkpointsProof) where
     *  numCheckpointsProof is the proof data needed to verify the number of checkpoints and
     *  checkpointsProof is the proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of the voter across all supported remote chains
     */
    function getVotingPower(
        address voter,
        uint256 blockTimestamp,
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
                blockTimestamp,
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
     * @dev Internal function override to handle incoming messages from another chain.
     * @param payload The encoded message payload being received. This is the resolved command from the DVN
     *
     * @dev The following params are unused in the current implementation of the OApp.
     * @dev _origin A struct containing information about the message sender.
     * @dev _guid A unique global packet identifier for the message.
     * @dev _executor The address of the Executor responsible for processing the message.
     * @dev _extraData Arbitrary data appended by the Executor to the message.
     *
     * Decodes the received payload and processes it as per the business logic defined in the function.
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        uint256 status;
        (uint256 blockTimestamp, bytes memory blockHash) = abi.decode(payload);
        remoteBlockHash[origin.srcEid][blockTimestamp] = blockHash;
        requiredChainIds[blockTimestamp].remove(origin.srcEid);

        // Once all the block hashes has been synced
        if (requiredChainIds[blockTimestamp].length == 0) {
            // verify all block hashes
            for (uint256 i; i < remoteBlockheaders[blockTimestamp].length; i++) {
                bytes memory decodedBlockHash = abi.decode(remoteBlockheaders[blockTimestamp][i]);
                // compare with the block hashes got from above steps
                uint chainId = remoteChainIds[blockTimestamp];
                if (decodedBlockHash != remoteBlockHash[chainId][blockTimestamp]) {
                    status = Status.REJECTED;
                    break;
                }
            }

            if (proposerVotingProof[blockTimestamp][0].remoteChainId != 0 && status != Status.REJECTED) {
                uint96 votes = getVotingPower(msg.sender, blocknumber, proposerVotingProof);
                // compare proposer votes with the threshold
                if (votes > threshold) {
                    status = Status.ACTIVE;
                } else {
                    status = Status.PENDING;
                }
            }

            IGovernanceBravoDelegate(governanceBravo).InternalActivateProposal(proposalId[blockTimestamp], status);
        }
    }
}
