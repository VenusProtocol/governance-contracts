// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;

import "../Governance/AccessControlled.sol";

contract MockAccessTest is AccessControlled {
    /**
     * @param accessControlManager Access control manager contract address
     */
    function initialize(address accessControlManager) external initializer {
        __AccessControlled_init_unchained(accessControlManager);
    }
}
