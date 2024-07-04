// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IOmnichainGovernanceExecutor } from "./interfaces/IOmnichainGovernanceExecutor.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title OmnichainExecutorOwner
 * @author Venus
 * @notice OmnichainProposalSender contract acts as a governance and access control mechanism,
 * allowing owner to upsert signature of OmnichainGovernanceExecutor contract,
 * also contains function to transfer the ownership of contract as well.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */

contract OmnichainExecutorOwner is AccessControlledV8 {
    /**
     *  @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IOmnichainGovernanceExecutor public immutable OMNICHAIN_GOVERNANCE_EXECUTOR;

    /**
     * @notice Stores function signature corresponding to their 4 bytes hash value
     */
    mapping(bytes4 => string) public functionRegistry;

    /**
     * @notice Event emitted when function registry updated
     */
    event FunctionRegistryChanged(string indexed signature, bool active);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address omnichainGovernanceExecutor_) {
        require(omnichainGovernanceExecutor_ != address(0), "Address must not be zero");
        OMNICHAIN_GOVERNANCE_EXECUTOR = IOmnichainGovernanceExecutor(omnichainGovernanceExecutor_);
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
     * @notice Sets the source message sender address
     * @param srcChainId_ The LayerZero id of a source chain
     * @param srcAddress_ The address of the contract on the source chain
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits SetTrustedRemoteAddress with source chain Id and source address
     */
    function setTrustedRemoteAddress(uint16 srcChainId_, bytes calldata srcAddress_) external {
        _checkAccessAllowed("setTrustedRemoteAddress(uint16,bytes)");
        require(srcChainId_ != 0, "ChainId must not be zero");
        ensureNonzeroAddress(address(uint160(bytes20(srcAddress_))));
        require(srcAddress_.length == 20, "Source address must be 20 bytes long");
        OMNICHAIN_GOVERNANCE_EXECUTOR.setTrustedRemoteAddress(srcChainId_, srcAddress_);
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
        (bool ok, bytes memory res) = address(OMNICHAIN_GOVERNANCE_EXECUTOR).call(data_);
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
        OMNICHAIN_GOVERNANCE_EXECUTOR.transferOwnership(newOwner_);
    }

    /**
     *  @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public virtual override {}
}
