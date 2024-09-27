// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IAccessControlManagerV8 } from "../Governance/IAccessControlManagerV8.sol";

/**
 * @title ACMCommandsAggregator
 * @author Venus
 * @notice This contract is a helper to aggregate multiple grant and revoke permissions in batches and execute them in one go.
 */
contract ACMCommandsAggregator {
    /*
     * @notice Struct to store permission details
     */
    struct Permission {
        /*
         * @notice Address of the contract
         */
        address contractAddress;
        /*
         * @notice Function signature
         */
        string functionSig;
        /*
         * @notice Address of the account
         */
        address account;
    }

    /*
     * @notice Default admin role
     */
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @notice Access control manager contract
     */
    IAccessControlManagerV8 public immutable ACM;

    /*
     * @notice 2D array to store grant permissions in batches
     */
    Permission[][] public grantPermissions;

    /*
     * @notice 2D array to store revoke permissions in batches
     */
    Permission[][] public revokePermissions;

    /*
     * @notice Event emitted when grant permissions are added
     */
    event GrantPermissionsAdded(uint256 index);

    /*
     * @notice Event emitted when revoke permissions are added
     */
    event RevokePermissionsAdded(uint256 index);

    /*
     * @notice Event emitted when grant permissions are executed
     */
    event GrantPermissionsExecuted(uint256 index);

    /*
     * @notice Event emitted when revoke permissions are executed
     */
    event RevokePermissionsExecuted(uint256 index);

    /*
     * @notice Error to be thrown when permissions are empty
     */
    error EmptyPermissions();

    /*
     * @notice Error to be thrown when invalid access control manager
     */
    error InvalidACM();

    /*
     * @notice Constructor to set the access control manager
     * @param _acm Address of the access control manager
     */
    constructor(IAccessControlManagerV8 _acm) {
        if (address(_acm) == address(0)) {
            revert InvalidACM();
        }

        ACM = _acm;
    }

    /*
     * @notice Function to add grant permissions
     * @param _permissions Array of permissions
     * @custom:event Emits GrantPermissionsAdded event
     */
    function addGrantPermissions(Permission[] memory _permissions) external {
        if (_permissions.length == 0) {
            revert EmptyPermissions();
        }

        uint256 index = grantPermissions.length;
        grantPermissions.push();

        for (uint256 i; i < _permissions.length; ++i) {
            grantPermissions[index].push(
                Permission(_permissions[i].contractAddress, _permissions[i].functionSig, _permissions[i].account)
            );
        }

        emit GrantPermissionsAdded(index);
    }

    /*
     * @notice Function to add revoke permissions
     * @param _permissions Array of permissions
     * @custom:event Emits RevokePermissionsAdded event
     */
    function addRevokePermissions(Permission[] memory _permissions) external {
        if (_permissions.length == 0) {
            revert EmptyPermissions();
        }

        uint256 index = revokePermissions.length;
        revokePermissions.push();

        for (uint256 i; i < _permissions.length; ++i) {
            revokePermissions[index].push(
                Permission(_permissions[i].contractAddress, _permissions[i].functionSig, _permissions[i].account)
            );
        }

        emit RevokePermissionsAdded(index);
    }

    /*
     * @notice Function to execute grant permissions
     * @param index Index of the permissions array
     * @custom:event Emits GrantPermissionsExecuted event
     */
    function executeGrantPermissions(uint256 index) external {
        uint256 length = grantPermissions[index].length;
        for (uint256 i; i < length; ++i) {
            Permission memory permission = grantPermissions[index][i];
            ACM.giveCallPermission(permission.contractAddress, permission.functionSig, permission.account);
        }

        ACM.renounceRole(DEFAULT_ADMIN_ROLE, address(this));
        emit GrantPermissionsExecuted(index);
    }

    /*
     * @notice Function to execute revoke permissions
     * @param index Index of the permissions array
     * @custom:event Emits RevokePermissionsExecuted event
     */
    function executeRevokePermissions(uint256 index) external {
        uint256 length = revokePermissions[index].length;
        for (uint256 i; i < length; ++i) {
            Permission memory permission = revokePermissions[index][i];
            ACM.revokeCallPermission(permission.contractAddress, permission.functionSig, permission.account);
        }

        ACM.renounceRole(DEFAULT_ADMIN_ROLE, address(this));
        emit RevokePermissionsExecuted(index);
    }
}
