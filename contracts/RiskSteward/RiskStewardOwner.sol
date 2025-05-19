// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskStewardReceiver } from "../interfaces/IRiskStewardReceiver.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title RiskStewardOwner
 * @author Venus
 * @notice RiskStewardOwner contract acts as a governance and access control mechanism,
 * allowing owner to upsert signature of RiskStewardReceiver contract,
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */

contract RiskStewardOwner is AccessControlledV8 {
    /**
     *  @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice Stores function signature corresponding to their 4 bytes hash value
     */
    mapping(bytes4 => string) public functionRegistry;

    /**
     * @notice Event emitted when function registry updated
     */
    event FunctionRegistryChanged(string indexed signature, bool active);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address riskStewardReceiver_) {
        ensureNonzeroAddress(riskStewardReceiver_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param accessControlManager_  Address of access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        ensureNonzeroAddress(accessControlManager_);
        __AccessControlled_init(accessControlManager_);
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
        (bool ok, bytes memory res) = address(RISK_STEWARD_RECEIVER).call(data_);
        require(ok, "call failed");
        return res;
    }

    /**
     * @notice A registry of functions that are allowed to be executed
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
     *  @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public virtual override {}
}
