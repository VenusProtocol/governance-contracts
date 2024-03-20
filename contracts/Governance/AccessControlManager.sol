// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IAccessControlManagerV8.sol";

/**
 * @title AccessControlManager
 * @author Venus
 * @dev This contract is a wrapper of OpenZeppelin AccessControl extending it in a way to standartize access control within Venus Smart Contract Ecosystem.
 * @notice Access control plays a crucial role in the Venus governance model. It is used to restrict functions so that they can only be called from one
 * account or list of accounts (EOA or Contract Accounts).
 *
 * The implementation of `AccessControlManager`(https://github.com/VenusProtocol/governance-contracts/blob/main/contracts/Governance/AccessControlManager.sol)
 * inherits the [Open Zeppelin AccessControl](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol)
 * contract as a base for role management logic. There are two role types: admin and granular permissions.
 * 
 * ## Granular Roles
 * 
 * Granular roles are built by hashing the contract address and its function signature. For example, given contract `Foo` with function `Foo.bar()` which
 * is guarded by ACM, calling `giveRolePermission` for account B do the following:
 * 
 * 1. Compute `keccak256(contractFooAddress,functionSignatureBar)`
 * 1. Add the computed role to the roles of account B
 * 1. Account B now can call `ContractFoo.bar()`
 * 
 * ## Admin Roles
 * 
 * Admin roles allow for an address to call a function signature on any contract guarded by the `AccessControlManager`. This is particularly useful for
 * contracts created by factories.
 * 
 * For Admin roles a null address is hashed in place of the contract address (`keccak256(0x0000000000000000000000000000000000000000,functionSignatureBar)`.
 * 
 * In the previous example, giving account B the admin role, account B will have permissions to call the `bar()` function on any contract that is guarded by
 * ACM, not only contract A.
 * 
 * ## Protocol Integration
 * 
 * All restricted functions in Venus Protocol use a hook to ACM in order to check if the caller has the right permission to call the guarded function.
 * `AccessControlledV5` and `AccessControlledV8` abstract contract makes this integration easier. They call ACM's external method
 * `isAllowedToCall(address caller, string functionSig)`. Here is an example of how `setCollateralFactor` function in `Comptroller` is integrated with ACM:

```
    contract Comptroller is [...] AccessControlledV8 {
        [...]
        function setCollateralFactor(VToken vToken, uint256 newCollateralFactorMantissa, uint256 newLiquidationThresholdMantissa) external {
            _checkAccessAllowed("setCollateralFactor(address,uint256,uint256)");
            [...]
        }
    }
```
 */
contract AccessControlManager is AccessControl, IAccessControlManagerV8 {
    /// @notice Emitted when an account is given a permission to a certain contract function
    /// @dev If contract address is 0x000..0 this means that the account is a default admin of this function and
    /// can call any contract function with this signature
    event PermissionGranted(address account, address contractAddress, string functionSig);

    /// @notice Emitted when an account is revoked a permission to a certain contract function
    event PermissionRevoked(address account, address contractAddress, string functionSig);

    constructor() {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Gives a function call permission to one single account
     * @dev this function can be called only from Role Admin or DEFAULT_ADMIN_ROLE
     * @param contractAddress address of contract for which call permissions will be granted
     * @dev if contractAddress is zero address, the account can access the specified function
     *      on **any** contract managed by this ACL
     * @param functionSig signature e.g. "functionName(uint256,bool)"
     * @param accountToPermit account that will be given access to the contract function
     * @custom:event Emits a {RoleGranted} and {PermissionGranted} events.
     */
    function giveCallPermission(address contractAddress, string calldata functionSig, address accountToPermit) public {
        bytes32 role = keccak256(abi.encodePacked(contractAddress, functionSig));
        grantRole(role, accountToPermit);
        emit PermissionGranted(accountToPermit, contractAddress, functionSig);
    }

    /**
     * @notice Revokes an account's permission to a particular function call
     * @dev this function can be called only from Role Admin or DEFAULT_ADMIN_ROLE
     * 		May emit a {RoleRevoked} event.
     * @param contractAddress address of contract for which call permissions will be revoked
     * @param functionSig signature e.g. "functionName(uint256,bool)"
     * @custom:event Emits {RoleRevoked} and {PermissionRevoked} events.
     */
    function revokeCallPermission(
        address contractAddress,
        string calldata functionSig,
        address accountToRevoke
    ) public {
        bytes32 role = keccak256(abi.encodePacked(contractAddress, functionSig));
        revokeRole(role, accountToRevoke);
        emit PermissionRevoked(accountToRevoke, contractAddress, functionSig);
    }

    /**
     * @notice Verifies if the given account can call a contract's guarded function
     * @dev Since restricted contracts using this function as a permission hook, we can get contracts address with msg.sender
     * @param account for which call permissions will be checked
     * @param functionSig restricted function signature e.g. "functionName(uint256,bool)"
     * @return false if the user account cannot call the particular contract function
     *
     */
    function isAllowedToCall(address account, string calldata functionSig) public view returns (bool) {
        bytes32 role = keccak256(abi.encodePacked(msg.sender, functionSig));

        if (hasRole(role, account)) {
            return true;
        } else {
            role = keccak256(abi.encodePacked(address(0), functionSig));
            return hasRole(role, account);
        }
    }

    /**
     * @notice Verifies if the given account can call a contract's guarded function
     * @dev This function is used as a view function to check permissions rather than contract hook for access restriction check.
     * @param account for which call permissions will be checked against
     * @param contractAddress address of the restricted contract
     * @param functionSig signature of the restricted function e.g. "functionName(uint256,bool)"
     * @return false if the user account cannot call the particular contract function
     */
    function hasPermission(
        address account,
        address contractAddress,
        string calldata functionSig
    ) public view returns (bool) {
        bytes32 role = keccak256(abi.encodePacked(contractAddress, functionSig));
        return hasRole(role, account);
    }
}
