// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

contract TokenVaultStorage {
    /// @notice Info of each user.
    struct UserInfo {
        uint96 amount;
        uint96 pendingWithdrawals;
    }
    // Infomation about a withdrawal request
    struct WithdrawalRequest {
        uint96 amount;
        uint128 lockedUntil;
    }

    /// @notice A checkpoint for marking number of votes from a given block or second
    struct Checkpoint {
        uint32 fromBlockOrSecond;
        uint96 votes;
    }

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the delegation struct used by the contract
    bytes32 public constant DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable token;

    /// @notice A record of each accounts delegate
    mapping(address => address) public delegates;

    /// @notice A record of votes checkpoints for each account, by index
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each account
    mapping(address => uint32) public numCheckpoints;

    /// @notice Tracks pending withdrawals for all users
    uint256 public totalPendingWithdrawals;

    /// @notice Indicate lock period
    uint128 public tokenLockPeriod;

    // Info of requested but not yet executed withdrawals
    mapping(address => WithdrawalRequest[]) internal withdrawalRequests;

    // Info of each user that stakes tokens
    mapping(address => UserInfo) internal userInfos;

    /// @notice A record of states for signing / validating signatures
    mapping(address => uint) public nonces;

    /// @notice Thrown when token is not registered
    error UnregisteredToken(address token);

    /// @notice Thrown when zero amount is passed
    error ZeroAmountNotAllowed();

    /// @notice Thrown when given amount is invalid
    error InvalidAmount();

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;
}