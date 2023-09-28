// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";

interface IOmnichainGovernanceExecutor {
    function transferOwnership(address addr) external;
}

contract OmnichainProposalExecutorOwner is AccessControlledV8 {
    // @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IOmnichainGovernanceExecutor public immutable omnichainGovernanceExecutor;

    // Stores function signature corresponding to their 4 bytes hash value
    mapping(bytes4 => string) public functionRegistry;

    // Event emitted when function registry updated
    event FunctionRegistryChanged(string signature, bool isRemoved);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address omnichainGovernanceExecutor_, address accessControlManager_) {
        require(omnichainGovernanceExecutor_ != address(0), "Address must not be zero");
        require(accessControlManager_ != address(0), "Address must not be zero");
        omnichainGovernanceExecutor = IOmnichainGovernanceExecutor(omnichainGovernanceExecutor_);
        __AccessControlled_init(accessControlManager_);
    }

    ///  @notice Invoked when called function does not exist in the contract

    fallback(bytes calldata data_) external payable returns (bytes memory) {
        string memory fun = _getFunctionName(msg.sig);
        require(bytes(fun).length != 0, "Function not found");
        _checkAccessAllowed(fun);
        (bool ok, bytes memory res) = address(omnichainGovernanceExecutor).call(data_);
        require(ok, "call failed");
        return res;
    }

    /// Functions will be added or removed
    /// @param signatures_  Function signature to be added or removed
    /// @param isRemoved_  bool value , should be true to remove function and vice versa
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

    /// @notice This function transfer the ownership of the bridge from this contract to new owner.
    /// @param newOwner_ New owner of the governanceExecutor Bridge.

    function transferBridgeOwnership(address newOwner_) external {
        _checkAccessAllowed("transferBridgeOwnership(address)");
        require(address(newOwner_) != address(0), "Address must not be zero");
        omnichainGovernanceExecutor.transferOwnership(newOwner_);
    }

    /// @notice Empty implementation of renounce ownership to avoid any mishappening.
    function renounceOwnership() public virtual override {}

    /// Returns function signature corresponding to its 4 bytes hash
    /// @param signature_ 4 bytes of function signature
    function _getFunctionName(bytes4 signature_) internal view returns (string memory) {
        return functionRegistry[signature_];
    }
}
