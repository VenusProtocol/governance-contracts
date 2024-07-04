// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import "../Governance/AccessControlledV8.sol";
import "@layerzerolabs/solidity-examples/contracts/lzApp/mocks/LZEndpointMock.sol";

contract MockAccessTest is AccessControlledV8 {
    /**
     * @param accessControlManager Access control manager contract address
     */
    function initialize(address accessControlManager) external initializer {
        __AccessControlled_init_unchained(accessControlManager);
    }
}
