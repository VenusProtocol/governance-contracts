// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IAccessControlManagerV8
 * @author Venus
 * @notice Interface implemented by the `AccessControlManagerV8` contract.
 */
interface IAccessControlManagerV8 is IAccessControl {
    function giveCallPermission(address contractAddress, string calldata functionSig, address accountToPermit) external;

    function revokeCallPermission(
        address contractAddress,
        string calldata functionSig,
        address accountToRevoke
    ) external;

    function isAllowedToCall(address account, string calldata functionSig) external view returns (bool);

    function hasPermission(
        address account,
        address contractAddress,
        string calldata functionSig
    ) external view returns (bool);
}
