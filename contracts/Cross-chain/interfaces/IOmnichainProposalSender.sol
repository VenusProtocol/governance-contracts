// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IOmnichainProposalSender {
    function trustedRemoteLookup(uint16 layerZeroChainId) external returns (bytes memory);

    function proposalCount() external returns (uint256);

    function estimateFees(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bool useZro_,
        bytes calldata adapterParams_
    ) external view returns (uint256, uint256);

    function removeTrustedRemote(uint16 remoteChainId_) external;

    function execute(
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        address zroPaymentAddress_
    ) external payable;

    function retryExecute(
        uint256 pId_,
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        address zroPaymentAddress_,
        uint256 originalValue_
    ) external payable;

    function fallbackWithdraw(
        address to_,
        uint256 pId_,
        uint16 remoteChainId_,
        bytes calldata payload_,
        bytes calldata adapterParams_,
        uint256 originalValue_
    ) external;

    function setTrustedRemoteAddress(uint16 remoteChainId_, bytes calldata newRemoteAddress_) external;

    function setConfig(uint16 version_, uint16 chainId_, uint256 configType_, bytes calldata config_) external;

    function setSendVersion(uint16 version_) external;

    function getConfig(uint16 version_, uint16 chainId_, uint256 configType_) external view returns (bytes memory);
}
