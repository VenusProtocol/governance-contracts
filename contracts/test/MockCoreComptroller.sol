// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IVToken } from "../interfaces/IVToken.sol";

contract MockCoreComptroller {
    /// @notice Mapping of vToken addresses to their supply caps
    mapping(address => uint256) public supplyCaps;

    /// @notice Mapping of vToken addresses to their borrow caps
    mapping(address => uint256) public borrowCaps;

    /// @notice Array of all vTokens
    IVToken[] public allVTokens;

    /// @notice Mapping of vToken addresses to boolean indicating if they are listed
    mapping(address => bool) public vTokenListed;

    /**
     * @notice Add a new vToken to be tracked
     * @param vToken The vToken to add
     */
    function _supportMarket(address vToken) external {
        require(!vTokenListed[vToken], "vToken already listed");
        vTokenListed[address(vToken)] = true;
        allVTokens.push(IVToken(vToken));
    }

    function supportMarket(address vToken) external {
        require(!vTokenListed[vToken], "vToken already listed");
        vTokenListed[address(vToken)] = true;
        allVTokens.push(IVToken(vToken));
    }

    /**
     * @notice Set the supply cap for a vToken
     * @param vTokens The vToken addresses
     * @param newCaps The new supply caps
     */
    function _setMarketSupplyCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numSupplyCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numSupplyCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            supplyCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    function setMarketSupplyCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numSupplyCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numSupplyCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            supplyCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    /**
     * @notice Set the borrow cap for a vToken
     * @param vTokens The vToken addresses
     * @param newCaps The new borrow caps
     */
    function _setMarketBorrowCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numBorrowCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numBorrowCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            borrowCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    function setMarketBorrowCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numBorrowCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numBorrowCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            borrowCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    /**
     * @notice Get all vTokens
     * @return Array of vToken addresses
     */
    function getAllMarkets() external view returns (IVToken[] memory) {
        return allVTokens;
    }
}
