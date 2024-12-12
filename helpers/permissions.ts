import { ethers } from "hardhat";

export enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}

const accounts = [AccountType.NORMAL_TIMELOCK]
  .concat(AccountType.CRITICAL_TIMELOCK)
  .concat(AccountType.FAST_TRACK_TIMELOCK);

export const getResilientOraclePermissions = (resilientOracle: string): string[][] => {
  return [
    ...accounts.map(timelock => [resilientOracle, "pause()", timelock]),
    ...accounts.map(timelock => [resilientOracle, "unpause()", timelock]),
    ...accounts.map(timelock => [resilientOracle, "setTokenConfig(TokenConfig)", timelock]),
    [resilientOracle, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    [resilientOracle, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getChainlinkOraclePermissions = (chainlinkOracle: string): string[][] => {
  return [
    ...accounts.map(timelock => [chainlinkOracle, "setTokenConfig(TokenConfig)", timelock]),
    ...accounts.map(timelock => [chainlinkOracle, "setDirectPrice(address,uint256)", timelock]),
  ];
};

export const getRedstoneOraclePermissions = (redstoneOracle: string): string[][] => {
  return [
    ...accounts.map(timelock => [redstoneOracle, "setTokenConfig(TokenConfig)", timelock]),
    ...accounts.map(timelock => [redstoneOracle, "setDirectPrice(address,uint256)", timelock]),
  ];
};

export const getBoundValidatorPermissions = (boundValidator: string): string[][] => {
  return [[boundValidator, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK]];
};

export const getSFrxETHOraclePermissions = (sFrxETHOracle: string): string[][] => {
  return [...accounts.map(timelock => [sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", timelock])];
};

export const getBinanceOraclePermissions = (binanceOracle: string): string[][] => {
  return [
    ...accounts.map(timelock => [binanceOracle, "setMaxStalePeriod(string,uint256)", timelock]),
    ...accounts.map(timelock => [binanceOracle, "setSymbolOverride(string,string)", timelock]),
  ];
};

export const getXVSPermissions = (xvs: string): string[][] => {
  return [
    ...accounts.map(timelock => [xvs, "migrateMinterTokens(address,address)", timelock]),
    ...accounts.map(timelock => [xvs, "setMintCap(address,uint256)", timelock]),
    ...accounts.map(timelock => [xvs, "updateBlacklist(address,bool)", timelock]),
    ...accounts.map(timelock => [xvs, "pause()", timelock]),
    ...accounts.map(timelock => [xvs, "unpause()", timelock]),
  ];
};

export const getXVSBridgeAdminPermissions = (xvsBridgeAdmin: string): string[][] => {
  return [
    ...accounts.map(timelock => [xvsBridgeAdmin, "setSendVersion(uint16)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setReceiveVersion(uint16)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setMaxSingleTransactionLimit(uint16,uint256)", timelock]),
    [xvsBridgeAdmin, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    ...accounts.map(timelock => [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setMaxSingleReceiveTransactionLimit(uint16,uint256)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setMaxDailyReceiveLimit(uint16,uint256)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "pause()", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "unpause()", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "removeTrustedRemote(uint16)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", timelock]),
    [xvsBridgeAdmin, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    ...accounts.map(timelock => [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setWhitelist(address,bool)", timelock]),
    ...accounts.map(timelock => [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", timelock]),
    [xvsBridgeAdmin, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    ...accounts.map(timelock => [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", timelock]),
    [xvsBridgeAdmin, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    [xvsBridgeAdmin, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getXVSVaultPermissions = (xvsVault: string): string[][] => {
  return [
    [xvsVault, "pause()", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "resume()", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "pause()", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "resume()", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "setWithdrawalLockingPeriod(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getPoolRegistryPermissions = (poolRegistry: string): string[][] => {
  return [
    [poolRegistry, "addPool(string,address,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getPrimePermissions = (prime: string): string[][] => {
  return [
    ...accounts.map(timelock => [prime, "updateAlpha(uint128,uint128)", timelock]),
    ...accounts.map(timelock => [prime, "updateMultipliers(address,uint256,uint256)", timelock]),
    ...accounts.map(timelock => [prime, "setStakedAt(address[],uint256[])", timelock]),
    ...accounts.map(timelock => [prime, "addMarket(address,address,uint256,uint256)", timelock]),
    ...accounts.map(timelock => [prime, "setLimit(uint256,uint256)", timelock]),
    ...accounts.map(timelock => [prime, "setMaxLoopsLimit(uint256)", timelock]),
    ...accounts.map(timelock => [prime, "issue(bool,address[])", timelock]),
    ...accounts.map(timelock => [prime, "burn(address)", timelock]),
    ...accounts.map(timelock => [prime, "togglePause()", timelock]),
  ];
};

export const getPrimeLiquidityProviderPermissions = (primeLiquidityProvider: string): string[][] => {
  return [
    ...accounts.map(timelock => [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", timelock]),
    ...accounts.map(timelock => [
      primeLiquidityProvider,
      "setMaxTokensDistributionSpeed(address[],uint256[])",
      timelock,
    ]),
    ...accounts.map(timelock => [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", timelock]),
    ...accounts.map(timelock => [primeLiquidityProvider, "pauseFundsTransfer()", timelock]),
    ...accounts.map(timelock => [primeLiquidityProvider, "resumeFundsTransfer()", timelock]),
  ];
};

export const getProtocolShareReservePermissions = (protocolShareReserve: string): string[][] => {
  return [
    ...accounts.map(timelock => [
      protocolShareReserve,
      "addOrUpdateDistributionConfigs(DistributionConfig[])",
      timelock,
    ]),
    ...accounts.map(timelock => [protocolShareReserve, "removeDistributionConfig(Schema,address)", timelock]),
  ];
};

export const getConverterNetworkPermissions = (converterNetwork: string): string[][] => {
  return [
    ...accounts.map(timelock => [converterNetwork, "addTokenConverter(address)", timelock]),
    ...accounts.map(timelock => [converterNetwork, "removeTokenConverter(address)", timelock]),
  ];
};

export const getComptrollerPermissions = (): string[][] => {
  return [
    ...accounts.map(timelock => [
      ethers.constants.AddressZero,
      "setCollateralFactor(address,uint256,uint256)",
      timelock,
    ]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "unlistMarket(address)", timelock]),
    [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getVTokenPermissions = (): string[][] => {
  return [
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setReserveFactor(uint256)", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setInterestRateModel(address)", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", timelock]),
    [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getRewardDistributorPermissionsTimebased = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", AccountType.NORMAL_TIMELOCK],
    [
      ethers.constants.AddressZero,
      "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
      AccountType.NORMAL_TIMELOCK,
    ],
  ];
};

export const getRewardDistributorPermissionsBlockbased = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setLastRewardingBlocks(address[],uint32[],uint32[])", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getIRMPermissions = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

export const getConverterPermissions = (): string[][] => {
  return [
    ...accounts.map(timelock => [ethers.constants.AddressZero, "pauseConversion()", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "resumeConversion()", timelock]),
    ...accounts.map(timelock => [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", timelock]),
    ...accounts.map(timelock => [
      ethers.constants.AddressZero,
      "setConversionConfig(address,address,ConversionConfig)",
      timelock,
    ]),
  ];
};

export const getXVSVaultTreasuryPermissions = (xvsVaultTreasury: string): string[][] => {
  return [...accounts.map(timelock => [xvsVaultTreasury, "fundXVSVault(uint256)", timelock])];
};

export const getOmniChainExecutorOwnerPermissions = (omniChainExecutor: string, guardian: string): string[][] => {
  return [
    [omniChainExecutor, "setSrcChainId(uint16)", AccountType.NORMAL_TIMELOCK],
    [omniChainExecutor, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    [omniChainExecutor, "setSrcChainId(uint16)", guardian],
    [omniChainExecutor, "transferBridgeOwnership(address)", guardian],
  ];
};

export const getXVSBridgeAdminRevokePermissions = (xvsBridgeAdmin: string, guardian: string): string[][] => {
  return [
    [xvsBridgeAdmin, "setSendVersion(uint16)", guardian],
    [xvsBridgeAdmin, "setReceiveVersion(uint16)", guardian],
    [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", guardian],
    [xvsBridgeAdmin, "setOracle(address)", guardian],
    [xvsBridgeAdmin, "removeTrustedRemote(uint16)", guardian],
    [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", guardian],
    [xvsBridgeAdmin, "setPrecrime(address)", guardian],
    [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setWhitelist(address,bool)", guardian],
    [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", guardian],
    [xvsBridgeAdmin, "sweepToken(address,address,uint256)", guardian],
    [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", guardian],
    [xvsBridgeAdmin, "setTrustedRemoteAddress(uint16,bytes)", guardian],
    [xvsBridgeAdmin, "transferBridgeOwnership(address)", guardian],
  ];
};

export const getXVSVaultTreasuryRevokePermissions = (xvsVaultTreasury: string, guardian: string): string[][] => {
  return [[xvsVaultTreasury, "fundXVSVault(uint256)", guardian]];
};

export const getPrimeRevokePermissions = (prime: string, guardian: string): string[][] => {
  return [
    [prime, "updateAlpha(uint128,uint128)", guardian],
    [prime, "updateMultipliers(address,uint256,uint256)", guardian],
    [prime, "setStakedAt(address[],uint256[])", guardian],
    [prime, "addMarket(address,address,uint256,uint256)", guardian],
    [prime, "setLimit(uint256,uint256)", guardian],
    [prime, "setMaxLoopsLimit(uint256)", guardian],
    [prime, "issue(bool,address[])", guardian],
    [prime, "burn(address)", guardian],
  ];
};

export const getPrimeLiquidityProviderRevokePermissions = (
  primeLiquidityProvider: string,
  guardian: string,
): string[][] => {
  return [
    [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", guardian],
    [primeLiquidityProvider, "setMaxTokensDistributionSpeed(address[],uint256[])", guardian],
    [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", guardian],
  ];
};

export const getResilientOracleRevokePermissions = (resilientOracle: string, guardian: string): string[][] => {
  return [
    [resilientOracle, "setOracle(address,address,uint8)", guardian],
    [resilientOracle, "enableOracle(address,uint8,bool)", guardian],
  ];
};

export const getBoundValidatorRevokePermissions = (boundValidator: string, guardian: string): string[][] => {
  return [[boundValidator, "setValidateConfig(ValidateConfig)", guardian]];
};

export const getXVSVaultRevokePermissions = (xvsVault: string, guardian: string): string[][] => {
  return [
    [xvsVault, "add(address,uint256,address,uint256,uint256)", guardian],
    [xvsVault, "set(address,uint256,uint256)", guardian],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", guardian],
    [xvsVault, "setWithdrawalLockingPeriod(address,uint256,uint256)", guardian],
  ];
};

export const getRewardDistributorRevokePermissions = (
  guardian: string,
  lastRewardingBlockTimestamp: boolean,
): string[][] => {
  const permissions = [
    [ethers.constants.AddressZero, "setLastRewardingBlock(address[],uint32[],uint32[])", guardian],
    [ethers.constants.AddressZero, "setLastRewardingBlocks(address[],uint32[],uint32[])", guardian],
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", guardian],
  ];
  if (lastRewardingBlockTimestamp) {
    permissions.push([
      ethers.constants.AddressZero,
      "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
      guardian,
    ]);
  }
  return permissions;
};

export const getIRMRevokePermissions = (guardian: string): string[][] => {
  return [[ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", guardian]];
};

export const getPoolRegistryRevokePermissionsForWildcard = (guardian: string): string[][] => {
  return [
    [ethers.constants.AddressZero, "addPool(string,address,uint256,uint256,uint256)", guardian],
    [ethers.constants.AddressZero, "addMarket(AddMarketInput)", guardian],
    [ethers.constants.AddressZero, "setPoolName(address,string)", guardian],
    [ethers.constants.AddressZero, "updatePoolMetadata(address,VenusPoolMetaData)", guardian],
  ];
};

export const getPoolRegistryRevokePermissions = (poolRegistry: string, guardian: string): string[][] => {
  return [
    [poolRegistry, "addPool(string,address,uint256,uint256,uint256)", guardian],
    [poolRegistry, "addMarket(AddMarketInput)", guardian],
    [poolRegistry, "setPoolName(address,string)", guardian],
    [poolRegistry, "updatePoolMetadata(address,VenusPoolMetaData)", guardian],
  ];
};

export const getComptrollerRevokePermissions = (guardian: string): string[][] => {
  return [
    [ethers.constants.AddressZero, "setCloseFactor(uint256)", guardian],
    [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", guardian],
    [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", guardian],
    [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", guardian],
  ];
};

export const getVTokenRevokePermissions = (guardian: string): string[][] => {
  return [
    [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", guardian],
    [ethers.constants.AddressZero, "setReserveFactor(uint256)", guardian],
    [ethers.constants.AddressZero, "setInterestRateModel(address)", guardian],
    [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", guardian],
  ];
};

export const getConverterNetworkRevokePermissions = (converterNetwork: string, guardian: string): string[][] => {
  return [
    [converterNetwork, "addTokenConverter(address)", guardian],
    [converterNetwork, "removeTokenConverter(address)", guardian],
  ];
};

export const getSFrxETHOracleRevokePermissions = (sFrxETHOracle: string, guardian: string): string[][] => {
  return [[sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", guardian]];
};

export const getConvertersRevokePermissions = (converters: string[], guardian: string): string[][] => {
  return [
    ...converters.map(converter => [converter, "setMinAmountToConvert(uint256)", guardian]),
    ...converters.map(converter => [converter, "setConversionConfig(address,address,ConversionConfig)", guardian]),
  ];
};

export const getOmniChainExecutorOwnerRevokePermissions = (omniChainExecutor: string, guardian: string): string[][] => {
  return [
    [omniChainExecutor, "setTrustedRemoteAddress(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setTimelockPendingAdmin(address,uint8)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setGuardian(address)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setTrustedRemoteAddress(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setTimelockPendingAdmin(address,uint8)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setGuardian(address)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setSendVersion(uint16)", guardian],
    [omniChainExecutor, "setPrecrime(address)", guardian],
    [omniChainExecutor, "setMinDstGas(uint16,uint16,uint256)", guardian],
    [omniChainExecutor, "setPayloadSizeLimit(uint16,uint256)", guardian],
  ];
};
