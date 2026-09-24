# Permission filter — bscmainnet

- Grantees: NormalTimelock, FastTrackTimelock, CriticalTimelock, Guardian 1, Guardian 2, Guardian 3
- Only permissions whose signature exists solely in legacy-signatures.json (no package source proves it)
- Snapshot height: 109200201 (updated 2026-07-10T16:02:26.546Z)

## NormalTimelock — 4 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |
| Legacy (old BNBPermissions.json) | toggleConfigActive(string) | 0x3887c3a2e59b248cdfaabeaecf032c5f31fcc0fd2a7eda6b0e9998cfd7a48344 |
| Legacy (old BNBPermissions.json) | setMaxDeltaBps(uint256) | 0xbbeba095eacd7efb40f9e544f7a7d471d48820873d799eeba97d5dd77777d63d |
| RiskFundV2 / RiskFundV2_Proxy | sweepTokenFromPool(address,address,address,uint256) | 0x9022c522bb4fd3dcc160058b746c6a15fe416ba099f3658ecef34c307a8222d4 |

## FastTrackTimelock — 4 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |
| Legacy (old BNBPermissions.json) | toggleConfigActive(string) | 0x3887c3a2e59b248cdfaabeaecf032c5f31fcc0fd2a7eda6b0e9998cfd7a48344 |
| Legacy (old BNBPermissions.json) | setMaxDeltaBps(uint256) | 0xbbeba095eacd7efb40f9e544f7a7d471d48820873d799eeba97d5dd77777d63d |
| RiskFundV2 / RiskFundV2_Proxy | sweepTokenFromPool(address,address,address,uint256) | 0x9022c522bb4fd3dcc160058b746c6a15fe416ba099f3658ecef34c307a8222d4 |

## CriticalTimelock — 4 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |
| Legacy (old BNBPermissions.json) | toggleConfigActive(string) | 0x3887c3a2e59b248cdfaabeaecf032c5f31fcc0fd2a7eda6b0e9998cfd7a48344 |
| Legacy (old BNBPermissions.json) | setMaxDeltaBps(uint256) | 0xbbeba095eacd7efb40f9e544f7a7d471d48820873d799eeba97d5dd77777d63d |
| RiskFundV2 / RiskFundV2_Proxy | sweepTokenFromPool(address,address,address,uint256) | 0x9022c522bb4fd3dcc160058b746c6a15fe416ba099f3658ecef34c307a8222d4 |

## Guardian 1 — 2 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |
| Unitroller / Unitroller_Proxy | _setCollateralFactor(address,uint256) | 0x1b1290727d46b476ad4d9739b3a51f0d0eb69415ba69048cbb28ad5464a82c20 |

## Guardian 2 — 0 permissions

## Guardian 3 — 0 permissions
