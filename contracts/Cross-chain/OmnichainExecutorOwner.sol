// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";

interface IOmnichainGovernanceExecutor {
    function transferOwnership(address addr) external;
}

/**
 * @title OmnichainExecutorOwner
 * @author Venus
 * @notice OmnichainProposalSender contract acts as a governance and access control mechanism,
 * allowing owner to upsert signature of OmnichainGovernanceExecutor contract,
 * also contains function to transfer the ownership of contract as well.
 */

contract OmnichainExecutorOwner is AccessControlledV8 {
    /**
     *  @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IOmnichainGovernanceExecutor public immutable omnichainGovernanceExecutor;

    /**
     * @notice Stores function signature corresponding to their 4 bytes hash value
     */
    mapping(bytes4 => string) public functionRegistry;

    /**
     * @notice Event emitted when function registry updated
     */
    event FunctionRegistryChanged(string signature, bool isRemoved);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address omnichainGovernanceExecutor_) {
        require(omnichainGovernanceExecutor_ != address(0), "Address must not be zero");
        omnichainGovernanceExecutor = IOmnichainGovernanceExecutor(omnichainGovernanceExecutor_);
    }

    /**
     * @notice Initialize the contract
     * @param accessControlManager_  Address of access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        require(address(accessControlManager_) != address(0), "Address must not be zero");
        __AccessControlled_init(accessControlManager_);
    }

    /**
     *  @notice Invoked when called function does not exist in the contract.
     */
    fallback(bytes calldata data_) external returns (bytes memory) {
        string memory fun = _getFunctionName(msg.sig);
        require(bytes(fun).length != 0, "Function not found");
        _checkAccessAllowed(fun);
        (bool ok, bytes memory res) = address(omnichainGovernanceExecutor).call(data_);
        require(ok, "call failed");
        return res;
    }

    /**
     * @notice Functions will be added or removed.
     * @param signatures_  Function signature to be added or removed.
     * @param isRemoved_  bool value , should be true to remove function.
     */
    function upsertSignature(string[] calldata signatures_, bool[] calldata isRemoved_) external onlyOwner {
        uint256 signatureLength = signatures_.length;
        require(signatureLength == isRemoved_.length, "Input arrays must have the same length");
        for (uint256 i; i < signatureLength; i++) {
            bytes4 sigHash = bytes4(keccak256(bytes(signatures_[i])));
            if (isRemoved_[i]) {
                delete functionRegistry[sigHash];
            } else {
                functionRegistry[sigHash] = signatures_[i];
            }
            emit FunctionRegistryChanged(signatures_[i], isRemoved_[i]);
        }
    }

    /**
     * @notice This function transfer the ownership of the bridge from this contract to new owner.
     * @param newOwner_ New owner of the governanceExecutor Bridge.
     * @custom:access Controlled by AccessControlManager.
     */

    function transferBridgeOwnership(address newOwner_) external {
        _checkAccessAllowed("transferBridgeOwnership(address)");
        require(address(newOwner_) != address(0), "Address must not be zero");
        omnichainGovernanceExecutor.transferOwnership(newOwner_);
    }

    /**
     *  @notice Empty implementation of renounce ownership to avoid any mishappening.
     */
    function renounceOwnership() public virtual override {}

    function _getFunctionName(bytes4 signature_) internal view returns (string memory) {
        return functionRegistry[signature_];
    }
}