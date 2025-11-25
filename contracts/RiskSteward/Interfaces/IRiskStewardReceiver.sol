// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IRiskStewardReceiver {
    // View functions
    function riskParameterConfigs(bytes32) external view returns (bool active, uint256 debounce, uint256 timelock, address riskSteward);

    function updateTypeLabels(bytes32) external view returns (string memory);

    function resolvedBoundary() external view returns (uint256);

    function lastProcessedUpdate(bytes32, address market) external view returns (uint256);

    function whitelistedApprovers(address) external view returns (bool);

    // State-changing functions
    function initialize(address accessControlManager_) external;

    function pause() external;

    function unpause() external;

    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce, uint256 timelock) external;

    function setConfigActive(string calldata updateType, bool active) external;

    function setApprover(address approver, bool approved) external;

    function approveUpdate(uint256 updateId) external;

    function registerUpdate(uint256 updateId) external;

    function executeUpdate(uint256 updateId) external;

    function rejectUpdate(uint256 updateId) external;

    function markUpdateExpired(uint256 updateId) external;

    function getExecutableUpdates() external view returns (uint256[] memory executableUpdates);

    function getExpiredUpdates() external view returns (uint256[] memory expiredUpdates);

    function executeAllExecutableUpdates() external returns (uint256 executedCount);

    function markAllExpiredUpdates() external returns (uint256 markedCount);
}
