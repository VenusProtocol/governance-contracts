// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Test } from "forge-std/Test.sol";

import { AccessControlManager } from "../../contracts/Governance/AccessControlManager.sol";

/// @notice A permission is granted for one function on one contract, and `isAllowedToCall` reads the
///  contract from `msg.sender`, so every check here is made pranked as the contract being guarded.
contract AccessControlManagerTest is Test {
    AccessControlManager internal acm;

    function setUp() public {
        acm = new AccessControlManager();
    }

    function testFuzz_permissionIsScopedToTheGrantedContract(
        address target,
        address otherContract,
        address account,
        string calldata signature
    ) public {
        // address(0) is the wildcard, covered below.
        vm.assume(target != address(0) && otherContract != target);

        acm.giveCallPermission(target, signature, account);

        vm.prank(target);
        assertTrue(acm.isAllowedToCall(account, signature));

        vm.prank(otherContract);
        assertFalse(acm.isAllowedToCall(account, signature));
    }

    function testFuzz_wildcardPermitsTheFunctionOnEveryContract(
        address anyContract,
        address account,
        string calldata signature
    ) public {
        acm.giveCallPermission(address(0), signature, account);

        vm.prank(anyContract);
        assertTrue(acm.isAllowedToCall(account, signature));
    }

    function testFuzz_revokedPermissionNoLongerAllows(
        address target,
        address account,
        string calldata signature
    ) public {
        acm.giveCallPermission(target, signature, account);
        acm.revokeCallPermission(target, signature, account);

        vm.prank(target);
        assertFalse(acm.isAllowedToCall(account, signature));
    }

    function testFuzz_onlyTheAdminCanGrant(address caller, address target, string calldata signature) public {
        vm.assume(caller != address(this));

        bytes memory missingAdminRole = bytes(
            string.concat(
                "AccessControl: account ",
                Strings.toHexString(caller),
                " is missing role ",
                Strings.toHexString(uint256(acm.DEFAULT_ADMIN_ROLE()), 32)
            )
        );
        vm.expectRevert(missingAdminRole);
        vm.prank(caller);
        acm.giveCallPermission(target, signature, caller);
    }
}
