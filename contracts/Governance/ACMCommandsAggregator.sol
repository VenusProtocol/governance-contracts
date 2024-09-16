// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IAccessControlManagerV8 } from "../Governance/IAccessControlManagerV8.sol";

contract ACMCommandsAggregator {
    /*
     * @notice Enum to differentiate between giving and revoking permissions
     */
    enum PermissionType {
        GIVE,
        REVOKE
    }

    /*
     * @notice Struct to store permission details
     */
    struct Permission {
        /*
         * @notice Type of permission
         */
        PermissionType permissionType;
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

    /**
     * @notice Access control manager contract
     */
    IAccessControlManagerV8 public immutable ACM;

    /*
     * @notice 2D array to store permissions in batches
     */
    Permission[][] public permissions;

    /*
     * @notice Event emitted when permissions are added
     */
    event PermissionsAdded(uint256 index);

    /*
     * @notice Event emitted when permissions are executed
     */
    event PermissionsExecuted(uint256 index);

    /*
     * @notice Error to be thrown when permissions are empty
     */
    error EmptyPermissions();

    /*
     * @notice Constructor to set the access control manager
     * @param _acm Address of the access control manager
     */
    constructor(IAccessControlManagerV8 _acm) {
        ACM = _acm;
    }

    /*
     * @notice Function to add permissions
     * @param _permissions Array of permissions
     */
    function addPermissions(Permission[] memory _permissions) external {
        if (_permissions.length == 0) {
            revert EmptyPermissions();
        }

        uint256 index = permissions.length;
        permissions.push();

        for (uint256 i = 0; i < _permissions.length; i++) {
            permissions[index].push(
                Permission(
                    _permissions[i].permissionType,
                    _permissions[i].contractAddress,
                    _permissions[i].functionSig,
                    _permissions[i].account
                )
            );
        }

        emit PermissionsAdded(index);
    }

    /*
     * @notice Function to execute permissions
     * @param index Index of the permissions array
     */
    function executePermissions(uint256 index) external {
        uint256 length = permissions[index].length;
        for (uint256 i = 0; i < length; i++) {
            if (permissions[index][i].permissionType == PermissionType.GIVE) {
                ACM.giveCallPermission(
                    permissions[index][i].contractAddress,
                    permissions[index][i].functionSig,
                    permissions[index][i].account
                );
            } else {
                ACM.revokeCallPermission(
                    permissions[index][i].contractAddress,
                    permissions[index][i].functionSig,
                    permissions[index][i].account
                );
            }
        }

        emit PermissionsExecuted(index);
    }
}
