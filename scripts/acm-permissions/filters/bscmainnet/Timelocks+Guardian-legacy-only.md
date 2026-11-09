# Permission filter — bscmainnet

- Grantees: NormalTimelock, FastTrackTimelock, CriticalTimelock, Guardian 1, Guardian 2, Guardian 3
- Only permissions whose signature exists solely in legacy-signatures.json (no package source proves it)
- Snapshot height: 124685378 (updated 2026-09-29T08:33:54.983Z)

## NormalTimelock — 12 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| CentrifugeSource_USDT | cancelDepositRequest(address) | 0x9e432d259d26e86f9caead649175b196ae3d01157175dbfe76934d5c093ce9a6 |
| CentrifugeSource_USDT | cancelRedeemRequest(address) | 0x3ef812eb90d3b7d9df3ba4a0b13a5ee7c77fb07712a9c7356ea0b1be475d2d6f |
| CentrifugeSource_USDT | claimCancelDeposit(address) | 0x2fd2c200b42d639b60d69de0d542231ee316d3164f97a1e46feb734082f4081c |
| CentrifugeSource_USDT | claimCancelRedeem(address) | 0xd7c5e4614271fe2a467abb8c04aa35723391c0ee684962023f4ab9053d488d19 |
| CentrifugeSource_USDT | claimDeposit(address) | 0x4c8a4157811c330a29f0a0d44c0ee3615ad4b37823fdf9cc25528f43d4e3327b |
| CentrifugeSource_USDT | claimRedeem(address) | 0xe0e15dd454af32fd7542b8a01155ead802a052b8b517a3b7e462c0c756a8b043 |
| CentrifugeSource_USDT | requestRedeem(address,uint256) | 0x7aabbcd80000a563bcd35eba1122fdbe8dcf01df8a7c507c3019f10ba0c66d3b |
| CentrifugeSource_USDT | setNavGuardEnabled(address,bool,bool) | 0xfbcf298760370d4250e8440ecffdbfe68e4eb37e90b25571cbf44e5ab03f75c5 |
| CentrifugeSource_USDT | setNavGuardRate(address,uint16,uint16,uint16,uint32,bool,bool) | 0x84afad717483b6b25e8f9718b50321b49c6b0d9134026e890d76dfa161d39e4c |
| CentrifugeSource_USDT | setNavGuardSnapshot(address,uint128,uint64) | 0xf5bd6444215a00011edb767d0cc0930b05fbc583b9d790b163dd9748a5fd2f91 |
| CentrifugeSource_USDT | setSpotAPYBps(address,uint64) | 0xf4e806277f744d9e16d63c406638681af7e5fe7d22250947f4596d918498e241 |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |

## FastTrackTimelock — 1 permission

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |

## CriticalTimelock — 0 permissions

## Guardian 1 — 1 permission

| Contract | Function | Role hash |
| --- | --- | --- |
| InstitutionalVaultControllerProxy | createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string) | 0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919 |

## Guardian 2 — 4 permissions

| Contract | Function | Role hash |
| --- | --- | --- |
| CentrifugeSource_USDT | setNavGuardEnabled(address,bool,bool) | 0xfbcf298760370d4250e8440ecffdbfe68e4eb37e90b25571cbf44e5ab03f75c5 |
| CentrifugeSource_USDT | setNavGuardRate(address,uint16,uint16,uint16,uint32,bool,bool) | 0x84afad717483b6b25e8f9718b50321b49c6b0d9134026e890d76dfa161d39e4c |
| CentrifugeSource_USDT | setNavGuardSnapshot(address,uint128,uint64) | 0xf5bd6444215a00011edb767d0cc0930b05fbc583b9d790b163dd9748a5fd2f91 |
| CentrifugeSource_USDT | setSpotAPYBps(address,uint64) | 0xf4e806277f744d9e16d63c406638681af7e5fe7d22250947f4596d918498e241 |

## Guardian 3 — 0 permissions
