// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;

interface ITimelock {
    /**
     * @notice Delay period for the transaction queue
     */
    function delay() external view returns (uint256);

    /**
     * @notice Required period to execute a proposal transaction
     */
    function GRACE_PERIOD() external view returns (uint256);

    /**
     * @notice Method for accepting a proposed admin
     */
    function acceptAdmin() external;

    /**
     * @notice Show mapping of queued transactions
     * @param hash Transaction hash
     */
    function queuedTransactions(bytes32 hash) external view returns (bool);

    /**
     * @notice Called for each action when queuing a proposal
     * @param target Address of the contract with the method to be called
     * @param value Native token amount sent with the transaction
     * @param signature Ssignature of the function to be called
     * @param data Arguments to be passed to the function when called
     * @param eta Timestamp after which the transaction can be executed
     * @return Hash of the queued transaction
     */
    function queueTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external returns (bytes32);

    /**
     * @notice Called to cancel a queued transaction
     * @param target Address of the contract with the method to be called
     * @param value Native token amount sent with the transaction
     * @param signature Ssignature of the function to be called
     * @param data Arguments to be passed to the function when called
     * @param eta Timestamp after which the transaction can be executed
     */
    function cancelTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external;

    /**
     * @notice Called to execute a queued transaction
     * @param target Address of the contract with the method to be called
     * @param value Native token amount sent with the transaction
     * @param signature Ssignature of the function to be called
     * @param data Arguments to be passed to the function when called
     * @param eta Timestamp after which the transaction can be executed
     */
    function executeTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external payable returns (bytes memory);
}
