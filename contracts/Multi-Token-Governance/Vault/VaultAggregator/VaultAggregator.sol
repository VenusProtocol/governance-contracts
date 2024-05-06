// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { AccessControlledV8 } from "./../../../Governance/AccessControlledV8.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IVault } from "./IVault.sol";

contract VaultAggregator is PausableUpgradeable, AccessControlledV8 {
    /// @notice Array containing instances of IVault contracts
    IVault[] public vaults;

    /// @notice Default weights, used when weights are not provided, will be access controlled
    uint8[] public defaultWeights;

    /// @notice Emit when vault is updated
    event UpdateVault(IVault vault, bool isAdded);

    ///@notice Emit when default weights of tokens updated
    event DefaultWeightsUpdated(uint8[] oldWeights, uint8[] newWeights);

    /// @notice Error is thrown when the size of vaults increases by more than 7
    error VaultLimitExceed();

    /// @notice Error is thrown when vault not found
    error VaultNotFound();

    /**
     * @notice Initialize the contract
     * @param _accessControlManager  Address of access control manager
     */
    function initialize(address _accessControlManager) external initializer {
        ensureNonzeroAddress(_accessControlManager);
        __AccessControlled_init(_accessControlManager);
    }

    /**
     * @notice Pause the vault
     * @custom:access Controlled by Access Controlled Manager
     */
    function pause() external {
        _checkAccessAllowed("pause()");
        _pause();
    }

    /**
     * @notice Unpause the vault
     * @custom:access Controlled by Access Controlled Manager
     */
    function unpause() external {
        _checkAccessAllowed("unpause()");
        _unpause();
    }

    /**
     * @notice Update vaults
     * @param vault Address of vault to be updated
     * @param isAdded Bool, should be true to add vault
     * @custom:event Emit UpdateVault with vault and its bool value
     * @custom:access Controlled by Access Control Manager
     */
    function updateVault(IVault vault, bool isAdded) external whenNotPaused {
        _checkAccessAllowed("updateVault(address,bool)");
        if (vaults.length >= 7) {
            revert VaultLimitExceed();
        }
        ensureNonzeroAddress(address(vault));
        if (isAdded) {
            vaults.push(vault);
        } else {
            uint256 length = vaults.length;
            uint8 index;
            for (uint8 i; i < vaults.length; ) {
                if (vaults[i] == vault) {
                    index = i;
                    break;
                }
                unchecked {
                    ++i;
                }
            }
            if (index >= length) {
                revert VaultNotFound();
            }

            if (index != length - 1) {
                vaults[index] = vaults[length - 1];
            }
            vaults.pop();
        }
        emit UpdateVault(vault, isAdded);
    }

    /**
     * @notice Update default weight of tokens
     * @param weights New weights of tokens
     * @custom:event Emit DefaultWeightsUpdated with old and new weights
     * @custom:access Controlled by Access Controlled manager
     */
    function updateDefaultWeights(uint8[] calldata weights) external whenNotPaused {
        _checkAccessAllowed("updateDefaultWeights(uint8[])");
        emit DefaultWeightsUpdated(defaultWeights, weights);
        defaultWeights = weights;
    }

    /**
     * @notice Returns aggregated votes of given account based on given weights
     * @param account Address of account whose votes need to be fetched
     * @param blockNumberOrTimestamp Block number or Timestamp
     * @param weights Weights of supported tokens
     * @return votes Aggregated votes of user
     */
    function getPriorVotes(
        address account,
        uint256 blockNumberOrTimestamp,
        uint8[] memory weights
    ) external view returns (uint96 votes) {
        if (weights.length >= 7) {
            revert VaultLimitExceed();
        }
        if (weights.length == 0) {
            weights = defaultWeights;
        }
        uint8 sum;
        for (uint8 i; i < weights.length; ) {
            sum += weights[i];
            unchecked {
                ++i;
            }
        }
        for (uint8 i; i < weights.length; ) {
            if (weights[i] != 0) {
                uint96 vote = vaults[i].getPriorVotes(account, blockNumberOrTimestamp);
                votes = votes + ((weights[i] * vote) / sum);
            }
            unchecked {
                ++i;
            }
        }
    }
}
