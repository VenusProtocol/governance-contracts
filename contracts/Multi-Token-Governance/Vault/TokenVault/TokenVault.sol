// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import { AccessControlledV8 } from "../../../Governance/AccessControlledV8.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { TimeManagerV8 } from "@venusprotocol/solidity-utilities/contracts/TimeManagerV8.sol";
import { TokenVaultStorage } from "./TokenVaultStorage.sol";

/**
 * @title Token Vault
 * @author Venus
 * @notice Token vault is a generic vault that can support multiple token. User can lock their supported token in the TokenVault to receive voting rights in Venus governance.
 */
contract TokenVault is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    TimeManagerV8,
    AccessControlledV8,
    TokenVaultStorage
{
    /// @notice Event emitted when deposit
    event Deposit(address indexed user, uint256 indexed amount);

    /// @notice Event emitted when execute withrawal
    event ExecutedWithdrawal(address indexed user, uint256 indexed amount);

    /// @notice Event emitted when request withrawal
    event RequestedWithdrawal(address indexed user, uint256 indexed amount);

    /// @notice An event thats emitted when an account changes its delegate
    event DelegateChangedV2(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /// @notice An event thats emitted when a delegate account's vote balance changes
    event DelegateVotesChangedV2(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /// @notice Event Emitted when lock period of token is set
    event SetLockPeriod(uint128 indexed oldLockPeriod, uint128 indexed newLockPeriod);

    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _token, bool _timeBased, uint256 _blocksPerYear) TimeManagerV8(_timeBased, _blocksPerYear) {
        ensureNonzeroAddress(_token);
        token = _token;
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param _accessControlManager  Address of access control manager
     */
    function initialize(address _accessControlManager) external initializer {
        ensureNonzeroAddress(_accessControlManager);
        __AccessControlled_init(_accessControlManager);
    }

    /**
     * @notice Sets Lock period of particular token
     * @param _lockPeriod  Minimum time between withdrawal request and its execution
     * @custom:event Emit SetLockPeriod with token and its lock period
     * @custom:access Controlled by Access Control Manager
     */
    function setLockPeriod(uint128 _lockPeriod) external {
        _checkAccessAllowed("setLockPeriod(uint128)");
        emit SetLockPeriod(tokenLockPeriod, _lockPeriod);
        tokenLockPeriod = _lockPeriod;
    }

    /**
     * @notice Deposit token to TokenVault
     * @param _amount Amount of token to be deposited
     * @custom:event Emit Deposit with msg.sender, token and amount
     * @custom:error ZeroAmountNotAllowed is thrown when zero amount is passed
     */
    function deposit(uint96 _amount) external nonReentrant whenNotPaused {
        if (_amount == 0) {
            revert ZeroAmountNotAllowed();
        }
        UserInfo storage user = userInfos[msg.sender];
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), _amount);
        userInfos[msg.sender].amount = user.amount + _amount;
        _moveDelegates(address(0), delegates[msg.sender], _amount);
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Execute withdrawal of given token
     * @custom:event Emit ExecutedWithdrawal with msg.sender, token and withdrawal amount
     */
    function executeWithdrawal() external nonReentrant whenNotPaused {
        UserInfo storage user = userInfos[msg.sender];
        WithdrawalRequest[] storage requests = withdrawalRequests[msg.sender];

        uint96 withdrawalAmount = popEligibleWithdrawalRequests(user, requests);
        require(withdrawalAmount > 0, "nothing to withdraw");

        user.amount = user.amount - withdrawalAmount;
        IERC20Upgradeable(token).safeTransfer(address(msg.sender), withdrawalAmount);
        totalPendingWithdrawals = totalPendingWithdrawals - withdrawalAmount;
        emit ExecutedWithdrawal(msg.sender, withdrawalAmount);
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
     * @notice Request withdrawal to TokenVault for token allocation
     * @param _amount The amount to withdraw from the vault
     * @custom:event Emit RequestedWithdrawal with msg.sender, token and withdrawal amount
     * @custom:error ZeroAmountNotAllowed is thrown when zero amount is passed
     * @custom:error InvalidAmount is thrown when given amount and pending withdrawals are greater than deposited amount.
     */
    function requestWithdrawal(uint96 _amount) external nonReentrant whenNotPaused {
        if (_amount == 0) {
            revert ZeroAmountNotAllowed();
        }
        UserInfo storage user = userInfos[msg.sender];
        WithdrawalRequest[] storage requests = withdrawalRequests[msg.sender];

        if (user.amount < user.pendingWithdrawals + _amount) {
            revert InvalidAmount();
        }
        uint256 lockedUntil = tokenLockPeriod + block.timestamp;

        pushWithdrawalRequest(user, requests, _amount, lockedUntil);
        totalPendingWithdrawals = totalPendingWithdrawals + _amount;

        // Update Delegate Amount
        _moveDelegates(delegates[msg.sender], address(0), _amount);

        emit RequestedWithdrawal(msg.sender, _amount);
    }

    /**
     * @notice Get unlocked withdrawal amount
     * @param _user The User Address
     * @return withdrawalAmount Amount that the user can withdraw
     */
    function getEligibleWithdrawalAmount(address _user) external view returns (uint256 withdrawalAmount) {
        WithdrawalRequest[] storage requests = withdrawalRequests[_user];
        // Since the requests are sorted by their unlock time, we can take
        // the entries from the end of the array and stop at the first
        // not-yet-eligible one
        for (uint256 i = requests.length; i > 0 && isUnlocked(requests[i - 1]); --i) {
            withdrawalAmount = withdrawalAmount + requests[i - 1].amount;
        }
        return withdrawalAmount;
    }

    /**
     * @notice Get requested amount
     * @param _user The User Address
     * @return Total amount of requested but not yet executed withdrawals (including both executable and locked ones)
     */
    function getRequestedAmount(address _user) external view returns (uint256) {
        UserInfo storage user = userInfos[_user];
        return user.pendingWithdrawals;
    }

    /**
     * @notice Returns the array of withdrawal requests that have not been executed yet
     * @param _user The User Address
     * @return An array of withdrawal requests
     */
    function getWithdrawalRequests(address _user) external view returns (WithdrawalRequest[] memory) {
        return withdrawalRequests[_user];
    }

    /**
     * @notice Determine the token stake balance for an account
     * @param _account The address of the account to check
     * @param _blockNumberOrSecond The block number or second to get the vote balance at
     * @return The balance that user staked
     */
    function getPriorVotes(address _account, uint256 _blockNumberOrSecond) external view returns (uint96) {
        require(_blockNumberOrSecond < getBlockNumberOrTimestamp(), "Not yet determined");

        uint32 nCheckpoints = numCheckpoints[_account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[_account][nCheckpoints - 1].fromBlockOrSecond <= _blockNumberOrSecond) {
            return checkpoints[_account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (checkpoints[_account][0].fromBlockOrSecond > _blockNumberOrSecond) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[_account][center];
            if (cp.fromBlockOrSecond == _blockNumberOrSecond) {
                return cp.votes;
            } else if (cp.fromBlockOrSecond < _blockNumberOrSecond) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[_account][lower].votes;
    }

    /**
     * @notice Get user info
     * @param _user User address
     * @return amount Deposited amount
     * @return pendingWithdrawals Requested but not yet executed withdrawals
     */
    function getUserInfo(address _user) external view returns (uint256 amount, uint256 pendingWithdrawals) {
        UserInfo storage user = userInfos[_user];
        amount = user.amount;
        pendingWithdrawals = user.pendingWithdrawals;
    }

    /**
     * @notice Delegate votes from `msg.sender` to `delegatee`
     * @param _delegatee The address to delegate votes to
     */
    function delegate(address _delegatee) external whenNotPaused {
        return _delegate(msg.sender, _delegatee);
    }

    /**
     * @notice Delegates votes from signatory to `delegatee`
     * @param _delegatee The address to delegate votes to
     * @param _nonce The contract state required to match the signature
     * @param _expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function delegateBySig(
        address _delegatee,
        uint256 _nonce,
        uint256 _expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes("TokenVault")), block.chainid, address(this))
        );
        bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, _delegatee, _nonce, _expiry));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ECDSA.recover(digest, v, r, s);
        require(_nonce == nonces[signatory]++, "Invalid nonce");
        require(block.timestamp <= _expiry, "Signature expired");
        return _delegate(signatory, _delegatee);
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param _account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address _account) external view returns (uint256) {
        uint32 nCheckpoints = numCheckpoints[_account];
        return nCheckpoints > 0 ? checkpoints[_account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Pushes withdrawal request to the requests array and updates
     *   the pending withdrawals amount. The requests are always sorted
     *   by unlock time (descending) so that the earliest to execute requests
     *   are always at the end of the array
     * @param _user The user struct storage pointer
     * @param _requests The user's requests array storage pointer
     * @param _amount The amount being requested
     */
    function pushWithdrawalRequest(
        UserInfo storage _user,
        WithdrawalRequest[] storage _requests,
        uint96 _amount,
        uint256 _lockedUntil
    ) internal {
        uint256 i = _requests.length;
        _requests.push(WithdrawalRequest(0, 0));
        // Keep it sorted so that the first to get unlocked request is always at the end
        for (; i > 0 && _requests[i - 1].lockedUntil <= _lockedUntil; ) {
            _requests[i] = _requests[i - 1];
            unchecked {
                --i;
            }
        }
        _requests[i] = WithdrawalRequest(_amount, uint128(_lockedUntil));
        _user.pendingWithdrawals = _user.pendingWithdrawals + _amount;
    }

    /**
     * @notice Pops the requests with unlock time < now from the requests
     *   array and deducts the computed amount from the user's pending
     *   withdrawals counter. Assumes that the requests array is sorted
     *   by unclock time (descending).
     * @dev This function **removes** the eligible requests from the requests
     *   array. If this function is called, the withdrawal should actually
     *   happen (or the transaction should be reverted).
     * @param _user The user struct storage pointer
     * @param _requests The user's requests array storage pointer
     * @return withdrawalAmount The amount eligible for withdrawal
     */
    function popEligibleWithdrawalRequests(
        UserInfo storage _user,
        WithdrawalRequest[] storage _requests
    ) internal returns (uint96 withdrawalAmount) {
        // Since the requests are sorted by their unlock time, we can just
        // pop them from the array and stop at the first not-yet-eligible one
        for (uint256 i = _requests.length; i > 0 && isUnlocked(_requests[i - 1]); ) {
            withdrawalAmount = withdrawalAmount + (_requests[i - 1].amount);

            _requests.pop();
            unchecked {
                --i;
            }
        }
        _user.pendingWithdrawals = _user.pendingWithdrawals - withdrawalAmount;
        return withdrawalAmount;
    }

    /**
     * @dev Delegate user votes
     * @param _delegator Address of delegator
     * @param _delegatee Address of delegatee
     * @custom:event Emit DelegateChangedV2 with current delegate, new delegatee and token
     */
    function _delegate(address _delegator, address _delegatee) internal {
        address currentDelegate = delegates[_delegator];
        uint96 delegatorBalance = getStakeAmount(_delegator);
        delegates[_delegator] = _delegatee;

        emit DelegateChangedV2(_delegator, currentDelegate, _delegatee);

        _moveDelegates(currentDelegate, _delegatee, delegatorBalance);
    }

    /**
     * @dev Internal function to moves voting power from one representative to another based on the given parameters
     * @param _srcRep The address of the current representative whose voting power is being transferred
     * @param _dstRep The address of the new representative who will receive the transferred voting power
     * @param _amount The amount of voting power to be transferred
     */
    function _moveDelegates(address _srcRep, address _dstRep, uint96 _amount) internal {
        if (_srcRep != _dstRep && _amount > 0) {
            if (_srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[_srcRep];
                uint96 srcRepOld = srcRepNum > 0 ? checkpoints[_srcRep][srcRepNum - 1].votes : 0;
                uint96 srcRepNew = srcRepOld - _amount;
                _writeCheckpoint(_srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (_dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[_dstRep];
                uint96 dstRepOld = dstRepNum > 0 ? checkpoints[_dstRep][dstRepNum - 1].votes : 0;
                uint96 dstRepNew = dstRepOld + _amount;
                _writeCheckpoint(_dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    /**
     * @dev Updates the voting checkpoint for a delegatee with the given parameters
     * If there are existing checkpoints for the delegatee at the current block number or timestamp,
     * the function updates the votes in the most recent checkpoint
     * Otherwise, it creates a new checkpoint with the current block number or timestamp and the new votes
     * @param delegatee The address of the delegatee whose voting checkpoint is being updated
     * @param nCheckpoints The number of existing voting checkpoints for the delegatee
     * @param oldVotes The previous number of votes held by the delegatee
     * @param newVotes The new number of votes to be assigned to the delegatee
     * @custom:event Emits a DelegateVotesChangedV2 event to signal the change in voting power for the delegatee
     */
    function _writeCheckpoint(address delegatee, uint32 nCheckpoints, uint256 oldVotes, uint96 newVotes) internal {
        uint32 blockNumberOrSecond = uint32(getBlockNumberOrTimestamp());

        if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlockOrSecond == blockNumberOrSecond) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(blockNumberOrSecond, newVotes);
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }

        emit DelegateVotesChangedV2(delegatee, oldVotes, newVotes);
    }

    /**
     * @dev Returns before and after upgrade pending withdrawal amount
     * @param _requests The user's requests array storage pointer
     * @return withdrawalAmount The amount eligible for withdrawal
     */
    function getRequestedWithdrawalAmount(
        WithdrawalRequest[] storage _requests
    ) internal view returns (uint256 withdrawalAmount) {
        for (uint256 i = _requests.length; i > 0; --i) {
            withdrawalAmount = withdrawalAmount + (_requests[i - 1].amount);
        }
        return withdrawalAmount;
    }

    /**
     * @notice Get the token stake balance of an account (excluding the pending withdrawals)
     * @param _account The address of the account to check
     * @return The balance that user staked
     */
    function getStakeAmount(address _account) internal view returns (uint96) {
        UserInfo storage user = userInfos[_account];
        return user.amount - (user.pendingWithdrawals);
    }

    /**
     * @dev Checks if the request is eligible for withdrawal.
     * @param _request The request struct storage pointer
     * @return True if the request is eligible for withdrawal, false otherwise
     */
    function isUnlocked(WithdrawalRequest storage _request) private view returns (bool) {
        return _request.lockedUntil <= block.timestamp;
    }
}