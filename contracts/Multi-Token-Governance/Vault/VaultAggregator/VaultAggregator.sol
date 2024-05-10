// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { AccessControlledV8 } from "./../../../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IVault } from "./IVault.sol";

contract VaultAggregator is AccessControlledV8 {
    /// @notice Array containing instances of IVault contracts
    IVault[] public vaults;

    /// @notice Default weights, used when weights are not provided, will be access controlled
    uint8[] public defaultWeights;

    /// @notice Maximum number of vaults allowed
    uint8 public maxVaultsAllowed;

    /// @notice Emit when vault is updated
    event UpdateVault(IVault vault, bool isAdded);

    ///@notice Emit when default weights of tokens updated
    event DefaultWeightsUpdated(uint8[] oldWeights, uint8[] newWeights);

    event SetMaxVaults(uint8 oldMaxVaults, uint8 indexed newMaxVaults);

    /// @notice Error is thrown when the size of vaults increases by more than maxVaultsAllowed
    error VaultLimitExceed();

    /// @notice Error is thrown when vault not found
    error VaultNotFound();

    /// @notice Error is thrown when zero is passed as a parameter
    error ZeroValueNotAllowed();

    /// @notice Error is thrown if length is invalid
    error InvalidLength();

    /**
     * @notice Initialize the contract
     * @param _accessControlManager  Address of access control manager
     * @param _maxVaultsAllowed Maximum nuber of vaults allowed
     * @param _vaults Array of vaults to be supported
     */
    function initialize(
        address _accessControlManager,
        uint8 _maxVaultsAllowed,
        IVault[] memory _vaults
    ) external initializer {
        ensureNonzeroAddress(_accessControlManager);
        if (_maxVaultsAllowed == 0) {
            revert ZeroValueNotAllowed();
        }
        maxVaultsAllowed = _maxVaultsAllowed;

        if (_vaults.length > _maxVaultsAllowed) {
            revert VaultLimitExceed();
        }
        for (uint8 i; i < _vaults.length; ) {
            ensureNonzeroAddress(address(_vaults[i]));
            vaults.push(_vaults[i]);
            unchecked {
                ++i;
            }
        }
        __AccessControlled_init(_accessControlManager);
    }

    /**
     * @notice Set maximum number of vaults allowed
     * @param newMaxVaultsAllowed New max number of vaults allowed
     * @custom:event Emit SetMaxVaults with old and new number of vaults allowed
     * @custom:access Controlled by Access Control Manager
     */
    function setMaxVaults(uint8 newMaxVaultsAllowed) external {
        _checkAccessAllowed("setMaxVaults(uint8)");
        if (newMaxVaultsAllowed == 0) {
            revert ZeroValueNotAllowed();
        }
        emit SetMaxVaults(maxVaultsAllowed, newMaxVaultsAllowed);
        maxVaultsAllowed = newMaxVaultsAllowed;
    }

    /**
     * @notice Update vaults
     * @param vault Address of vault to be updated
     * @param isAdded Bool, should be true to add vault
     * @custom:event Emit UpdateVault with vault and its bool value
     * @custom:access Controlled by Access Control Manager
     */
    function updateVault(IVault vault, bool isAdded) external {
        _checkAccessAllowed("updateVault(address,bool)");
        ensureNonzeroAddress(address(vault));

        if (isAdded && vaults.length > maxVaultsAllowed - 1) {
            revert VaultLimitExceed();
        }
        if (isAdded) {
            vaults.push(vault);
        } else {
            uint256 length = vaults.length;
            uint8 index = type(uint8).max;

            for (uint8 i; i < vaults.length; ) {
                if (vaults[i] == vault) {
                    index = i;
                    break;
                }
                unchecked {
                    ++i;
                }
            }
            if (index == type(uint8).max) {
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
    function updateDefaultWeights(uint8[] calldata weights) external {
        _checkAccessAllowed("updateDefaultWeights(uint8[])");
        if (vaults.length != weights.length) {
            revert InvalidLength();
        }
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
        if (weights.length > maxVaultsAllowed) {
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
