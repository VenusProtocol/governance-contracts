// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../../Governance/AccessControlledV8.sol";
import { IVotingPowerAggregator } from "../interfaces/IVotingPowerAggregator.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title VotingPowerAggregatorOwner
 * @author Venus
 **/

contract VotingPowerAggregatorOwner is AccessControlledV8 {
    /**
     *  @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IVotingPowerAggregator public immutable VOTING_POWER_AGGREGATOR;

    /**
     * @notice Stores function signature corresponding to their 4 bytes hash value
     */
    mapping(bytes4 => string) public functionRegistry;

    /**
     * @notice Event emitted when function registry updated
     */
    event FunctionRegistryChanged(string indexed signature, bool active);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address votingPowerAggregator) {
        require(votingPowerAggregator != address(0), "Address must not be zero");
        VOTING_POWER_AGGREGATOR = IVotingPowerAggregator(votingPowerAggregator);
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param accessControlManager_  Address of access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        require(accessControlManager_ != address(0), "Address must not be zero");
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Sets the dest message sender address
     * @param destChainId_ The LayerZero id of a dest chain
     * @param destAddress_ The address of the contract on the dest chain
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits setPeer with dest chain Id and dest address
     */
    function setPeer(uint16 destChainId_, bytes32 destAddress_) external {
        _checkAccessAllowed("setPeer(uint16,bytes)");
        require(destChainId_ != 0, "ChainId must not be zero");
        VOTING_POWER_AGGREGATOR.setPeer(destChainId_, destAddress_);
    }

    /**
     * @notice Invoked when called function does not exist in the contract
     * @param data_ Calldata containing the encoded function call
     * @return Result of function call
     * @custom:access Controlled by Access Control Manager
     */
    fallback(bytes calldata data_) external returns (bytes memory) {
        string memory fun = functionRegistry[msg.sig];
        require(bytes(fun).length != 0, "Function not found");
        _checkAccessAllowed(fun);
        (bool ok, bytes memory res) = address(VOTING_POWER_AGGREGATOR).call(data_);
        require(ok, "call failed");
        return res;
    }

    /**
     * @notice A registry of functions that are allowed to be executed from proposals
     * @param signatures_  Function signature to be added or removed
     * @param active_ bool value, should be true to add function
     * @custom:access Only owner
     */
    function upsertSignature(string[] calldata signatures_, bool[] calldata active_) external onlyOwner {
        uint256 signatureLength = signatures_.length;
        require(signatureLength == active_.length, "Input arrays must have the same length");
        for (uint256 i; i < signatureLength; ++i) {
            bytes4 sigHash = bytes4(keccak256(bytes(signatures_[i])));
            bytes memory signature = bytes(functionRegistry[sigHash]);
            if (active_[i] && signature.length == 0) {
                functionRegistry[sigHash] = signatures_[i];
                emit FunctionRegistryChanged(signatures_[i], true);
            } else if (!active_[i] && signature.length != 0) {
                delete functionRegistry[sigHash];
                emit FunctionRegistryChanged(signatures_[i], false);
            }
        }
    }

    /**
     * @notice This function transfer the ownership of the executor from this contract to new owner
     * @param newOwner_ New owner of the governanceExecutor
     * @custom:access Controlled by AccessControlManager
     */

    function transferBridgeOwnership(address newOwner_) external {
        _checkAccessAllowed("transferBridgeOwnership(address)");
        require(newOwner_ != address(0), "Address must not be zero");
        VOTING_POWER_AGGREGATOR.transferOwnership(newOwner_);
    }

    /**
     *  @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public virtual override {}
}
