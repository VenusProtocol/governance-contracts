// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IDataWarehouse } from "../interfaces/IDataWarehouse.sol";
import { IGovernorBravoDelegate } from "../interfaces/IGovernorBravoDelegate.sol";
import { IBlockHashDispatcher } from "../interfaces/IBlockHashDispatcher.sol";
import { SlotUtils } from "../../Utils/SlotUtils.sol";
import { StateProofVerifier } from "../libs/StateProofVerifier.sol";
import { ExcessivelySafeCall } from "@layerzerolabs/solidity-examples/contracts/libraries/ExcessivelySafeCall.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppRead } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppRead.sol";
import { ILayerZeroEndpointV2, MessagingFee, MessagingReceipt, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { ReadCodecV1, EVMCallComputeV1, EVMCallRequestV1 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/ReadCodecV1.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { AddressCast } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/AddressCast.sol";
import { IXvsVault } from "../interfaces/IXvsVault.sol";
// import { XvsVaultInterface } from "../../Governance/GovernorBravoInterfaces.sol";

contract VotingPowerAggregator is Pausable, OAppRead, OAppOptionsType3 {
    using ExcessivelySafeCall for address;

    struct Proofs {
        uint16 remoteChainId;
        bytes numCheckpointsProof;
        bytes checkpointsProof;
    }

    struct NetworkProposalBlockDetails {
        uint256 blockNumber;
        bytes32 blockHash;
    }

    struct SyncingParameters {
        uint16 remoteChainId;
        bytes32 blockHash;
        bytes remoteBlockHeaderRLP;
        bytes xvsVaultStateProofRLP;
    }

    struct NetworkConfig {
        address xvsVault;
        address blockHashDispatcher;
        bool isLzReadSupported;
    }

    struct LzReadParams {
        uint16 remoteTargetEid;
        uint256 blockNumber;
    }

    /// @notice LayerZero read message type.
    uint8 private constant READ_MSG_TYPE = 1;

    uint8 public constant CHECKPOINTS_SLOT = 16;
    uint8 public constant NUM_CHECKPOINTS_SLOT = 17;
    uint16 public constant MAX_BLOCK_TIME_DIFF = 600; // 10 mins
    uint16 private constant BSC_CHAIN_ID = 5656;

    IDataWarehouse public warehouse;
    IGovernorBravoDelegate public governorBravo;
    IXvsVault public bscXvsVault;

    uint32 public READ_CHANNEL;

    // chainId -> block number -> block hash
    mapping(uint16 => mapping(uint256 => bytes32)) public remoteBlockHash;

    // pId -> chainId -> block number
    mapping(uint256 => mapping(uint16 => NetworkProposalBlockDetails)) public proposalBlockDetails;

    // chainId -> NetworkConfig
    mapping(uint16 => NetworkConfig) public networkConfig;

    // pId -> (remoteChainId, blockNumber, blockHash)
    mapping(uint256 => uint16[]) public proposalRemoteChainIds;

    // pId -> (remoteChainId, blockNumber)
    mapping(uint256 => LzReadParams[]) public lzReadParams;

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
     * @notice Thrown when syncing details for an unsupported network is provided
     */
    error RemoteChainNotSupported(uint16 chainId);

    /**
     * @notice Thrown when chain id is deactivated
     */
    error DeactivatedChainId(uint16 chainId);

    /**
     * @notice Thrown when an access controlled function is called
     */
    error InvalidCaller(address providedAddress, address requiredAddress);

    /**
     * @notice Thrown when an access controlled function is called
     */
    error InvalidBlockTimestamp(uint16 remoteChainId, uint256 providedTimestamp);

    /**
     * @notice Thrown array lengths mismatch
     */
    error LengthMismatch(string additionalReason);

    /**
     * @notice Thrown when an access controlled function is called
     */
    error ProposalThresholdNotMet(uint256 providedPower, uint256 acceptablePower);

    /**
     * @notice Thrown when an invalid chain id is provided
     */
    error InvalidChainId(uint16 chainId);

    /**
     * @notice Thrown when an access controlled function is called
     */
    error LZReceiveProposalNotExists(string reason);

    constructor(
        address endpoint,
        uint32 readChannel,
        address warehouseAddress,
        address governorBravoAddress,
        address delegate,
        address bscXvsVaultAddress
    ) OAppRead(endpoint, delegate) {
        ensureNonzeroAddress(warehouseAddress);
        ensureNonzeroAddress(governorBravoAddress);
        ensureNonzeroAddress(bscXvsVaultAddress);
        warehouse = IDataWarehouse(warehouseAddress);
        governorBravo = IGovernorBravoDelegate(governorBravoAddress);
        bscXvsVault = IXvsVault(bscXvsVaultAddress);

        // Set the read channel
        READ_CHANNEL = readChannel;
        _setPeer(READ_CHANNEL, AddressCast.toBytes32(address(this)));
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
     * @notice Sets the LayerZero read channel, enabling or disabling it based on `_active`.
     * @param _channelId The channel ID to set.
     * @param _active Flag to activate or deactivate the channel.
     */
    function setReadChannel(uint32 _channelId, bool _active) public override onlyOwner {
        _setPeer(_channelId, _active ? AddressCast.toBytes32(address(this)) : bytes32(0));
        READ_CHANNEL = _channelId;
    }

    /**
     * @notice Updates the network configuration for a given chain ID.
     * @param chainId The chain ID for which to update the configuration.
     * @param xvsVaultAddress The address of the XVS vault.
     * @param blockHashDispatcherAddress The address of the block hash fetcher.
     * @custom:access Only owner
     */
    function updateNetworkConfig(
        uint16 chainId,
        address xvsVaultAddress,
        address blockHashDispatcherAddress,
        bool isLzReadSupported
    ) external onlyOwner {
        ensureNonzeroAddress(xvsVaultAddress);
        ensureNonzeroAddress(blockHashDispatcherAddress);

        if (chainId == 0) {
            revert InvalidChainId(chainId);
        }

        networkConfig[chainId] = NetworkConfig({
            xvsVault: xvsVaultAddress,
            blockHashDispatcher: blockHashDispatcherAddress,
            isLzReadSupported: isLzReadSupported
        });

        emit UpdateVaultAddress(chainId, xvsVaultAddress);
    }

    /**
     * 
     * @param pId proposal Id to start syncing voting power of
     * @param proposer The address of the proposer
     * @param syncingParameters Array of syncing parameters containing remote chain id with their corresponding block hash, remote block header RLP, and XVS vault state proof RLP
     * @param proposerVotingProofs Array of proofs containing remote chain id with their corresponding proofs (numCheckpointsProof, checkpointsProof) where
     * numCheckpointsProof is the proof data needed to verify the number of checkpoints and
     * checkpointsProof is the proof data needed to verify the actual voting power from the checkpoints
     * @param proposalThreshold The minimum voting power required to start syncing
     * @param extraOptions Additional messaging options, including gas and fee settings
     * @custom:access Only GovernorBravo
     */
    function startVotingPowerSync(
        uint256 pId,
        address proposer,
        SyncingParameters[] calldata syncingParameters,
        Proofs[] calldata proposerVotingProofs,
        uint256 proposalThreshold,
        bytes calldata extraOptions
    ) external {
        if (msg.sender != address(governorBravo)) {
            revert InvalidCaller(msg.sender, address(governorBravo));
        }
        if (proposerVotingProofs.length > syncingParameters.length) {
            revert LengthMismatch("proposerVotingProofs length > syncingParameters length");
        }

        for (uint256 i; i < syncingParameters.length; i++) {
            SyncingParameters memory params = syncingParameters[i];
            if (
                networkConfig[params.remoteChainId].xvsVault == address(0) ||
                networkConfig[params.remoteChainId].blockHashDispatcher == address(0)
            ) {
                revert RemoteChainNotSupported(params.remoteChainId);
            }

            StateProofVerifier.BlockHeader memory decodedHeader = warehouse.processStorageRoot(
                networkConfig[params.remoteChainId].xvsVault,
                params.blockHash,
                params.remoteBlockHeaderRLP,
                params.xvsVaultStateProofRLP
            );

            if (!isValidBlockTimestamp(decodedHeader.timestamp)) {
                revert InvalidBlockTimestamp(params.remoteChainId, decodedHeader.timestamp);
            }

            proposalBlockDetails[pId][params.remoteChainId] = NetworkProposalBlockDetails(
                decodedHeader.number,
                params.blockHash
            );

            proposalRemoteChainIds[pId].push(params.remoteChainId);

            if (networkConfig[params.remoteChainId].isLzReadSupported) {
                lzReadParams[pId].push(LzReadParams(params.remoteChainId, decodedHeader.number));
            }
        }

        proposalBlockDetails[pId][BSC_CHAIN_ID] = NetworkProposalBlockDetails(block.number, blockhash(block.number));

        uint96 power = getVotingPower(proposer, pId, proposerVotingProofs);
        if (power < proposalThreshold) {
            revert ProposalThresholdNotMet(power, proposalThreshold);
        }

        readRemoteBlockHash(pId, extraOptions);
    }

    /**
     * @notice Sends a read request to LayerZero, querying Uniswap QuoterV2 for WETH/USDC prices on configured chains.
     * @param _extraOptions Additional messaging options, including gas and fee settings.
     * @return receipt The LayerZero messaging receipt for the request.
     */
    function readRemoteBlockHash(
        uint256 proposalId,
        bytes calldata _extraOptions
    ) public payable returns (MessagingReceipt memory receipt) {
        uint16[] memory remoteTargetEids = new uint16[](lzReadParams[proposalId].length);
        uint256[] memory blockNumbers = new uint256[](lzReadParams[proposalId].length);

        for (uint256 i = 0; i < lzReadParams[proposalId].length; i++) {
            remoteTargetEids[i] = lzReadParams[proposalId][i].remoteTargetEid;
            blockNumbers[i] = lzReadParams[proposalId][i].blockNumber;
        }

        bytes memory cmd = getCmd(proposalId, remoteTargetEids, blockNumbers);
        return
            _lzSend(
                READ_CHANNEL,
                cmd,
                combineOptions(READ_CHANNEL, READ_MSG_TYPE, _extraOptions),
                MessagingFee(msg.value, 0),
                payable(msg.sender)
            );
    }

    /**
     * @notice Quotes the estimated messaging fee for querying Uniswap QuoterV2 for WETH/USDC prices.
     * @param _extraOptions Additional messaging options.
     * @param _payInLzToken Boolean flag indicating whether to pay in LayerZero tokens.
     * @return fee The estimated messaging fee.
     */
    function quoteRemoteBlockHash(
        uint256 proposalId,
        uint16[] calldata remoteTargetEids,
        uint256[] calldata blockNumbers,
        bytes calldata _extraOptions,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory cmd = getCmd(proposalId, remoteTargetEids, blockNumbers);
        return _quote(READ_CHANNEL, cmd, combineOptions(READ_CHANNEL, READ_MSG_TYPE, _extraOptions), _payInLzToken);
    }

    /**
     * @notice Constructs a command to query the Uniswap QuoterV2 for WETH/USDC prices on all configured chains.
     * @return cmd The encoded command to request Uniswap quotes.
     */
    function getCmd(
        uint256 proposalId,
        uint16[] memory remoteTargetEids,
        uint256[] memory blockNumbers
    ) public view returns (bytes memory) {
        uint256 networkCount = remoteTargetEids.length;

        if (networkCount != blockNumbers.length) {
            revert LengthMismatch("network count length != blockNumbers length");
        }

        EVMCallRequestV1[] memory readRequests = new EVMCallRequestV1[](networkCount);

        for (uint256 i = 0; i < networkCount; i++) {
            if (networkConfig[remoteTargetEids[i]].blockHashDispatcher == address(0)) {
                revert RemoteChainNotSupported(remoteTargetEids[i]);
            }

            bytes memory callData = abi.encodeWithSelector(
                IBlockHashDispatcher.getHash.selector,
                proposalId,
                blockNumbers[i]
            );

            readRequests[i] = EVMCallRequestV1({
                appRequestLabel: uint16(i + 1),
                targetEid: remoteTargetEids[i],
                isBlockNum: false,
                blockNumOrTimestamp: uint64(block.timestamp),
                confirmations: 5,
                to: networkConfig[remoteTargetEids[i]].blockHashDispatcher,
                callData: callData
            });
        }

        EVMCallComputeV1 memory computeSettings = EVMCallComputeV1({
            computeSetting: 3, // None
            targetEid: ILayerZeroEndpointV2(endpoint).eid(),
            isBlockNum: false,
            blockNumOrTimestamp: uint64(block.timestamp),
            confirmations: 15,
            to: address(this)
        });

        return ReadCodecV1.encode(0, readRequests, computeSettings);
    }

    /**
     * @notice Calculates the total voting power of a voter across multiple remote chains
     * @param voter The address of the voter for whom to calculate the voting power
     * @param proofs Array of proofs containing remote chain id with their corresponding proofs (numCheckpointsProof, checkpointsProof) where
     *  numCheckpointsProof is the proof data needed to verify the number of checkpoints and
     *  checkpointsProof is the proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of the voter across all supported remote chains
     */
    function getVotingPower(address voter, uint256 pId, Proofs[] calldata proofs) public view returns (uint96 power) {
        uint96 totalVotingPower;
        for (uint16 i; i < proofs.length; ++i) {
            totalVotingPower += _getVotingPower(
                proofs[i].remoteChainId,
                pId,
                proofs[i].numCheckpointsProof,
                proofs[i].checkpointsProof,
                voter
            );
        }

        totalVotingPower += bscXvsVault.getPriorVotes(voter, proposalBlockDetails[pId][BSC_CHAIN_ID].blockNumber - 1);

        return totalVotingPower;
    }

    /**
     * @dev Calculates the total voting power of a voter for a remote chain
     * @param voter The address of the voter for whom to calculate the voting power
     * @param pId The identifier that links to remote chain-specific data
     * @param numCheckpointsProof The proof data needed to verify the number of checkpoints
     * @param checkpointsProof The proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of supported remote chains
     */
    function _getVotingPower(
        uint16 remoteChainId,
        uint256 pId,
        bytes calldata numCheckpointsProof,
        bytes calldata checkpointsProof,
        address voter
    ) internal view returns (uint96) {
        NetworkProposalBlockDetails memory blockDetails = proposalBlockDetails[pId][remoteChainId];
        address vault = networkConfig[remoteChainId].xvsVault;


        StateProofVerifier.SlotValue memory latestCheckpoint = warehouse.getStorage(
            vault,
            blockDetails.blockHash,
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
            blockDetails.blockHash,
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
        (uint256 pId, uint256 blockNumber, bytes32 blockHash) = abi.decode(payload, (uint256, uint256, bytes32));
        uint16 remoteChainId = uint16(origin.srcEid);

        if (proposalBlockDetails[pId][remoteChainId].blockNumber == 0) {
            revert LZReceiveProposalNotExists("Remote proposal does not exist");
        }

        remoteBlockHash[remoteChainId][blockNumber] = blockHash;

        if (isProposalSynced(pId)) {
            governorBravo.activateProposal(pId);
        }
    }

    /**
     * @notice Checks if the proposal is synced across all remote chains
     * @param proposalId The identifier that links to remote chain-specific data
     * @return True if the proposal is synced across all remote chains, false otherwise
     */
    function isProposalSynced(uint256 proposalId) public view returns (bool) {
        uint16[] memory remoteProposalChainIds = proposalRemoteChainIds[proposalId];
        uint256 proposalsLength = remoteProposalChainIds.length;

        for (uint8 i = 0; i < proposalsLength; i++) {
            uint16 remoteProposalChainId = remoteProposalChainIds[i];
            NetworkProposalBlockDetails memory NetworkProposalBlockDetails = proposalBlockDetails[proposalId][
                remoteProposalChainId
            ];
            if (
                remoteBlockHash[remoteProposalChainId][NetworkProposalBlockDetails.blockNumber] !=
                NetworkProposalBlockDetails.blockHash
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Checks if the provided block time is within 10 minutes and less than or equal to the current timestamp
     * @param providedBlockTime The block time to be validated
     * @return isValid True if the provided block time is valid, false otherwise
     */
    function isValidBlockTimestamp(uint256 providedBlockTime) internal view returns (bool) {
        uint256 currentTimestamp = block.timestamp;
        return (providedBlockTime <= currentTimestamp) && (providedBlockTime >= currentTimestamp - MAX_BLOCK_TIME_DIFF);
    }
}
