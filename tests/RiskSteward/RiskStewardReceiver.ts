import { MockContract, smock } from "@defi-wonderland/smock";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import { LZ_CHAINID } from "../../helpers/deploy/constants";
import { convertToUnit } from "../../helpers/utils";
import {
  AccessControlManager,
  CriticalParamsRiskSteward,
  GovernorBravoDelegate,
  GovernorBravoDelegate__factory,
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockCoreVToken,
  MockRiskOracle,
  MockVToken,
  OmnichainExecutorOwner,
  OmnichainProposalSender,
  RiskStewardDestinationReceiver,
  RiskStewardOwner,
  RiskStewardReceiver,
  TestTimelockV8__factory,
  TimelockV8,
  XVSVault,
} from "../../typechain";

const { parseUnits, hexValue, defaultAbiCoder, solidityPack } = ethers.utils;
const { AddressZero } = ethers.constants;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const BSC_LZV2_CHAIN_ID = 56;
const ETHEREUM_LZV2_CHAIN_ID = 1;
const ARBITRUM_LZV2_CHAIN_ID = 42161;

const proposalConfigs = {
  // ProposalType.NORMAL
  0: {
    votingDelay: 1,
    votingPeriod: 4,
    proposalThreshold: convertToUnit("150000", 18),
  },
  // ProposalType.FASTTRACK
  1: {
    votingDelay: 1,
    votingPeriod: 8,
    proposalThreshold: convertToUnit("200000", 18),
  },
  // ProposalType.CRITICAL
  2: {
    votingDelay: 1,
    votingPeriod: 16,
    proposalThreshold: convertToUnit("250000", 18),
  },
};

async function updateFunctionRegistry(stewardOwner: RiskStewardOwner, isDestRegistry: boolean) {
  const functionRegistry = [
    "setRiskParameterConfig(string,address)",
    "toggleConfigActive(string)",
    "setRemoteRiskStewardReceiver(uint32,address)",
    "deleteRemoteRiskStewardReceiver(uint32)",
    "pause()",
    "unpause()",
  ];

  if (isDestRegistry) {
    functionRegistry.push("setRemoteDelay(uint256)");
    functionRegistry.push("setGuardian(address)");
    functionRegistry.push("processUpdate(uint256,bytes,string,address,uint256)");
  } else {
    functionRegistry.push("setDestChainIdMappings(uint32[],uint16[])");
  }

  const activeArray = new Array(functionRegistry.length).fill(true);
  await stewardOwner.upsertSignature(functionRegistry, activeArray);
}

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    MarketCapsRiskStewardFactory: ContractFactory,
    mockCoreVToken: MockCoreVToken,
    mockVToken: MockVToken,
    mockEthereumVToken: MockVToken,
    mockArbitrumVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    criticalParamsRiskSteward: CriticalParamsRiskSteward,
    governorBravoDelegate: MockContract<GovernorBravoDelegate>,
    omnichainProposalSender: OmnichainProposalSender,
    ethereumOmnichainExecutorOwner: OmnichainExecutorOwner,
    arbitrumOmnichainExecutorOwner: OmnichainExecutorOwner,
    riskStewardDestReceiver: RiskStewardDestinationReceiver,
    marketCapsDestRiskSteward: MarketCapsRiskSteward,
    stewardOwner: RiskStewardOwner,
    destStewardOwner: RiskStewardOwner,
    CriticalParamsRiskStewardFactory: ContractFactory,
    xvsVault: XVSVault,
    fastrackTimelock: TimelockV8,
    accessControlManager: AccessControlManager;

  const publishRiskParameterUpdate = async (
    updates: { updateType: string; market: string; value: number; destinationChainId: number }[],
  ) => {
    const updatesByDestinationChainId = {};
    for (const { updateType, market, value, destinationChainId } of updates) {
      const update: [string, string, string, string, string] = [
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(value),
        updateType,
        market,
        defaultAbiCoder.encode(["address", "uint32"], [AddressZero, destinationChainId]),
      ];
      await mockRiskOracle.publishRiskParameterUpdate(...update);
      const destinationChainIdV1 = await riskStewardReceiver.lzV2ToV1ChainId(destinationChainId);

      if (updatesByDestinationChainId[destinationChainIdV1]) {
        updatesByDestinationChainId[destinationChainIdV1].push(update);
      } else if (destinationChainId !== BSC_LZV2_CHAIN_ID) {
        updatesByDestinationChainId[destinationChainIdV1] = [update];
      }
    }
    const payloadsByDestinationChainId = {};
    const proposalId = await omnichainProposalSender.proposalCount();

    for (const [key, value] of Object.entries<[string, string, string, string, string][]>(
      updatesByDestinationChainId,
    )) {
      const addresses: string[] = [];
      const values: number[] = [];
      const signatures: string[] = [];
      const calldatas: string[] = [];
      const proposalType = 1;

      for (const update of value) {
        const latestUpdate = await mockRiskOracle.getLatestUpdateByParameterAndMarket(update[2], update[3]);
        addresses.push("0x1234567890123456789012345678901234567890");
        values.push(0);
        signatures.push("processUpdate(uint256,bytes,string,address,bytes,uint256)");
        calldatas.push(
          defaultAbiCoder.encode(
            ["uint256", "bytes", "string", "address", "bytes", "uint256"],
            [latestUpdate.updateId, update[1], update[2], update[3], update[4], latestUpdate.timestamp],
          ),
        );
      }
      calldatas.reverse();

      const payload = defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]", "uint8"],
        [addresses, values, signatures, calldatas, proposalType],
      );
      const payloadWithId = defaultAbiCoder.encode(["bytes", "uint256"], [payload, proposalId]);
      const remoteAdapterParam = solidityPack(["uint16", "uint256"], [1, 300000]);
      const remoteCalldata = defaultAbiCoder.encode(
        ["uint16", "bytes", "bytes", "address"],
        [key, payloadWithId, remoteAdapterParam, AddressZero],
      );
      payloadsByDestinationChainId[key] = remoteCalldata;
    }

    return payloadsByDestinationChainId;
  };

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await accessControlManagerFactory.deploy();

    // Set up mock comptroller and markets
    // Core Pool Comptroller
    const MockCoreComptrollerFactory = await ethers.getContractFactory("MockCoreComptroller");
    mockCoreComptroller = await MockCoreComptrollerFactory.deploy();
    const MockCoreVTokenFactory = await ethers.getContractFactory("MockCoreVToken");
    mockCoreVToken = await MockCoreVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreVToken._setReserveFactor(parseUnits("0.2", 18));
    await mockCoreComptroller._supportMarket(mockCoreVToken.address);
    await mockCoreComptroller._setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller._setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller._setCollateralFactor(mockCoreVToken.address, parseUnits("0.6", 18));

    // IL Comptroller
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");
    mockComptroller = await MockComptrollerFactory.deploy();
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockVToken.setReserveFactor(parseUnits("0.25", 18));
    mockEthereumVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    mockArbitrumVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockComptroller.supportMarket(mockVToken.address);
    await mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    await mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);
    await mockComptroller.setCollateralFactor(mockVToken.address, parseUnits("0.7", 18), parseUnits("0.85", 18));

    xvsVault = await smock.fake<XVSVault>("MockXVSVault");
    const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
    governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
    const fastrackTimelockFactoey = await smock.mock<TestTimelockV8__factory>("TestTimelockV8");
    fastrackTimelock = await fastrackTimelockFactoey.deploy(governorBravoDelegate.address, 100);
    await governorBravoDelegate.setVariable("initialProposalId", 1);
    await governorBravoDelegate.setVariable("proposalCount", 1);
    await governorBravoDelegate.setVariable("proposalMaxOperations", 10);
    await governorBravoDelegate.setVariable("proposalConfigs", proposalConfigs);
    await governorBravoDelegate.setVariable("xvsVault", xvsVault.address);
    await governorBravoDelegate.setVariable("_accessControlManager", accessControlManager.address);
    await governorBravoDelegate.setVariable("proposalTimelocks", {
      1: fastrackTimelock.address,
    });

    // layerZeroV1
    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const localEndpoint = await LZEndpointMock.deploy(LZ_CHAINID.bscmainnet);
    const OmnichainProposalSenderFactory = await ethers.getContractFactory("OmnichainProposalSender");
    omnichainProposalSender = await OmnichainProposalSenderFactory.deploy(
      localEndpoint.address,
      accessControlManager.address,
    );
    const OmnichainGovernanceExecutorFactory = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const ethereumRemoteEndpoint = await LZEndpointMock.deploy(LZ_CHAINID.ethereum);
    const arbitrumRemoteEndpoint = await LZEndpointMock.deploy(LZ_CHAINID.arbitrumone);
    const ethereumOmnichainGovernanceExecutor = await OmnichainGovernanceExecutorFactory.deploy(
      ethereumRemoteEndpoint.address,
      deployer.address,
      LZ_CHAINID.bscmainnet,
    );
    const arbitrumOmnichainGovernanceExecutor = await OmnichainGovernanceExecutorFactory.deploy(
      arbitrumRemoteEndpoint.address,
      deployer.address,
      LZ_CHAINID.bscmainnet,
    );
    const OmnichainProposalExecutorOwner = await ethers.getContractFactory("OmnichainExecutorOwner");
    ethereumOmnichainExecutorOwner = await upgrades.deployProxy(
      OmnichainProposalExecutorOwner,
      [accessControlManager.address],
      {
        constructorArgs: [ethereumOmnichainGovernanceExecutor.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );
    arbitrumOmnichainExecutorOwner = await upgrades.deployProxy(
      OmnichainProposalExecutorOwner,
      [accessControlManager.address],
      {
        constructorArgs: [arbitrumOmnichainGovernanceExecutor.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    const ethereumRemotePath = ethers.utils.solidityPack(["address"], [ethereumOmnichainGovernanceExecutor.address]);
    const arbitrumRemotePath = ethers.utils.solidityPack(["address"], [arbitrumOmnichainGovernanceExecutor.address]);
    const localPath = ethers.utils.solidityPack(["address"], [omnichainProposalSender.address]);

    await accessControlManager.giveCallPermission(
      omnichainProposalSender.address,
      "setTrustedRemoteAddress(uint16,bytes)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      ethereumOmnichainExecutorOwner.address,
      "setTrustedRemoteAddress(uint16,bytes)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      arbitrumOmnichainExecutorOwner.address,
      "setTrustedRemoteAddress(uint16,bytes)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(deployer.address, "removeTrustedRemote(uint16)", deployer.address);

    await omnichainProposalSender.setTrustedRemoteAddress(LZ_CHAINID.ethereum, ethereumRemotePath);
    await omnichainProposalSender.setTrustedRemoteAddress(LZ_CHAINID.arbitrumone, arbitrumRemotePath);

    await ethereumOmnichainGovernanceExecutor.setTrustedRemoteAddress(LZ_CHAINID.bscmainnet, localPath);
    await arbitrumOmnichainGovernanceExecutor.setTrustedRemoteAddress(LZ_CHAINID.bscmainnet, localPath);

    const MockRiskOracleFactory = await ethers.getContractFactory("MockRiskOracle");
    const RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    const RiskStewardDestinationFactory = await ethers.getContractFactory("RiskStewardDestinationReceiver");
    MarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    CriticalParamsRiskStewardFactory = await ethers.getContractFactory("CriticalParamsRiskSteward");

    mockRiskOracle = await MockRiskOracleFactory.deploy(
      "MockRiskOracle",
      [deployer.address],
      ["supplyCap", "borrowCap", "collateralFactor", "reserveFactor", "randomUpdateType"],
    );

    // Layer zero V2 configuration
    const artifactPath = path.join(
      __dirname,
      "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
    );
    const endpointArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const EndpointFactory = new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer);

    const localEndpointV2 = await EndpointFactory.deploy(BSC_LZV2_CHAIN_ID);
    const remoteEndpointV2 = await EndpointFactory.deploy(ETHEREUM_LZV2_CHAIN_ID);

    riskStewardReceiver = await RiskStewardReceiverFactory.deploy(
      mockRiskOracle.address,
      BSC_LZV2_CHAIN_ID,
      localEndpointV2.address,
      deployer.address,
      governorBravoDelegate.address,
      omnichainProposalSender.address,
    );

    riskStewardDestReceiver = await RiskStewardDestinationFactory.deploy(
      remoteEndpointV2.address,
      deployer.address,
      deployer.address,
    );

    marketCapsRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000, DAY_AND_ONE_SECOND],
      {
        constructorArgs: [riskStewardReceiver.address, mockCoreComptroller.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    criticalParamsRiskSteward = await upgrades.deployProxy(
      CriticalParamsRiskStewardFactory,
      [accessControlManager.address, 5000, DAY_AND_ONE_SECOND],
      {
        constructorArgs: [riskStewardReceiver.address, mockCoreComptroller.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    // Market Cap Risk Steward on destination chain
    marketCapsDestRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000, DAY_AND_ONE_SECOND],
      {
        constructorArgs: [riskStewardDestReceiver.address, mockCoreComptroller.address], // using same comptroller at remote as well.
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address);
    await riskStewardReceiver.setRiskParameterConfig("borrowCap", marketCapsRiskSteward.address);
    await riskStewardReceiver.setRiskParameterConfig("collateralFactor", criticalParamsRiskSteward.address);
    await riskStewardReceiver.setRiskParameterConfig("reserveFactor", criticalParamsRiskSteward.address);
    await riskStewardReceiver.setDestChainIdMappings(
      [BSC_LZV2_CHAIN_ID, ETHEREUM_LZV2_CHAIN_ID, ARBITRUM_LZV2_CHAIN_ID],
      [LZ_CHAINID.bscmainnet, LZ_CHAINID.ethereum, LZ_CHAINID.arbitrumone],
    );
    await riskStewardReceiver.setRemoteRiskStewardReceiver(
      ETHEREUM_LZV2_CHAIN_ID,
      "0x1234567890123456789012345678901234567890",
    );
    await riskStewardReceiver.setRemoteRiskStewardReceiver(
      ARBITRUM_LZV2_CHAIN_ID,
      "0x1234567890123456789012345678901234567890",
    );
    await riskStewardDestReceiver.setRiskParameterConfig("supplyCap", marketCapsDestRiskSteward.address);
    await riskStewardDestReceiver.setRiskParameterConfig("borrowCap", marketCapsDestRiskSteward.address);

    await localEndpointV2.setDestLzEndpoint(riskStewardDestReceiver.address, remoteEndpointV2.address);
    await remoteEndpointV2.setDestLzEndpoint(riskStewardReceiver.address, localEndpointV2.address);

    await riskStewardReceiver.setPeer(
      ETHEREUM_LZV2_CHAIN_ID,
      ethers.utils.hexZeroPad(riskStewardDestReceiver.address, 32),
    );
    await riskStewardDestReceiver.setPeer(BSC_LZV2_CHAIN_ID, ethers.utils.hexZeroPad(riskStewardReceiver.address, 32));

    // whitelist riskStewardReceiver to popose proposal as fastrack type
    await accessControlManager.giveCallPermission(
      AddressZero,
      "whitelistProposer(address,ProposalType)",
      deployer.address,
    );
    await governorBravoDelegate.whitelistProposer(riskStewardReceiver.address, 1);

    // registerUpdateSelector on criticalParamsRiskSteward
    await accessControlManager.giveCallPermission(
      AddressZero,
      "registerUpdateSelector(string,ComptrollerType,string,string,bool)",
      deployer.address,
    );
    await criticalParamsRiskSteward.registerUpdateSelector(
      "reserveFactor",
      1,
      "setReserveFactor(uint256)",
      "reserveFactorMantissa()",
      false,
    );
    await criticalParamsRiskSteward.registerUpdateSelector(
      "reserveFactor",
      0,
      "_setReserveFactor(uint256)",
      "reserveFactorMantissa()",
      false,
    );

    const RiskStewardOwner = await ethers.getContractFactory("RiskStewardOwner");
    stewardOwner = await upgrades.deployProxy(RiskStewardOwner, [accessControlManager.address], {
      constructorArgs: [riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });
    destStewardOwner = await upgrades.deployProxy(RiskStewardOwner, [accessControlManager.address], {
      constructorArgs: [riskStewardDestReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });
    await riskStewardReceiver.transferOwnership(stewardOwner.address);
    await riskStewardDestReceiver.transferOwnership(destStewardOwner.address);
    await updateFunctionRegistry(stewardOwner, false);
    await updateFunctionRegistry(destStewardOwner, true);

    await accessControlManager.giveCallPermission(
      AddressZero,
      "setRiskParameterConfig(string,address)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(AddressZero, "toggleConfigActive(string)", deployer.address);
    await accessControlManager.giveCallPermission(AddressZero, "pause()", deployer.address);
    await accessControlManager.giveCallPermission(AddressZero, "unpause()", deployer.address);
    await accessControlManager.giveCallPermission(
      AddressZero,
      "setRemoteRiskStewardReceiver(uint32,address)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      AddressZero,
      "deleteRemoteRiskStewardReceiver(uint32)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      AddressZero,
      "setDestChainIdMappings(uint32[],uint16[])",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(AddressZero, "setRemoteDelay(uint256)", deployer.address);
    await accessControlManager.giveCallPermission(AddressZero, "setGuardian(address)", deployer.address);

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setMaxDeltaBps(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setDebouncePeriod(uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      criticalParamsRiskSteward.address,
      "setMaxDeltaBps(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      criticalParamsRiskSteward.address,
      "setDebouncePeriod(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      AddressZero,
      "processUpdate(uint256,bytes,string,address)",
      fastrackTimelock.address,
    );
    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "processUpdate(uint256,bytes,string,address)",
      riskStewardReceiver.address,
    );
    await accessControlManager.giveCallPermission(
      marketCapsDestRiskSteward.address,
      "processUpdate(uint256,bytes,string,address)",
      riskStewardDestReceiver.address,
    );
    await accessControlManager.giveCallPermission(
      riskStewardDestReceiver.address,
      "processUpdate(uint256,bytes,string,address,uint256)",
      fastrackTimelock.address,
    );
    // give this permission for testing
    await accessControlManager.giveCallPermission(
      destStewardOwner.address,
      "processUpdate(uint256,bytes,string,address,uint256)",
      deployer.address,
    );
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Risk Steward Owner", async () => {
    it("Reverts if any user other than owner try to add function in function registry", async function () {
      await expect(stewardOwner.connect(signer1).upsertSignature(["toggleConfig(string)"], [true])).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("Function registry should not emit event if nonexistant function is removed", async function () {
      await expect(stewardOwner.connect(deployer).upsertSignature(["toggleConfig(string)"], [false])).to.not.emit(
        stewardOwner,
        "FunctionRegistryChanged",
      );
    });

    it("Function registry should not emit event if function is added twice", async function () {
      await expect(stewardOwner.connect(deployer).upsertSignature(["pause()"], [true])).to.not.emit(
        stewardOwner,
        "FunctionRegistryChanged",
      );
    });
  });

  describe("RiskStewardReceiver", async function () {
    describe("Access Control", async function () {
      it("should revert if called by non-owner", async function () {
        await expect(
          riskStewardReceiver.connect(signer1).setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address),
        ).to.be.rejectedWith("Ownable: caller is not the owner");
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          riskStewardReceiver
            .connect(signer1)
            .setRemoteRiskStewardReceiver(ETHEREUM_LZV2_CHAIN_ID, riskStewardDestReceiver.address),
        ).to.be.rejectedWith("Ownable: caller is not the owner");
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          riskStewardReceiver.connect(signer1).deleteRemoteRiskStewardReceiver(ETHEREUM_LZV2_CHAIN_ID),
        ).to.be.rejectedWith("Ownable: caller is not the owner");
      });

      it("should revert if called by non-owner", async function () {
        await expect(riskStewardReceiver.connect(signer1).toggleConfigActive("supplyCap")).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should revert if called by non-owner", async function () {
        await expect(riskStewardReceiver.connect(signer1).pause()).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should revert if called by non-owner", async function () {
        await expect(riskStewardReceiver.connect(signer1).unpause()).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should revert if called by non-owner", async function () {
        await expect(riskStewardReceiver.connect(signer1).setDestChainIdMappings([1], [2])).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("should revert if access is not granted for setting max increase bps", async function () {
        await expect(marketCapsRiskSteward.connect(signer1).setMaxDeltaBps(1))
          .to.be.revertedWithCustomError(marketCapsRiskSteward, "Unauthorized")
          .withArgs(signer1.address, marketCapsRiskSteward.address, "setMaxDeltaBps(uint256)");
      });
    });

    describe("Risk Parameter Config and setters", async function () {
      it("should get original risk parameter configs", async function () {
        expect(await riskStewardReceiver.riskParameterConfigs("supplyCap")).to.deep.equal([
          true,
          marketCapsRiskSteward.address,
        ]);
        expect(await riskStewardReceiver.riskParameterConfigs("borrowCap")).to.deep.equal([
          true,
          marketCapsRiskSteward.address,
        ]);
      });

      it("should pause risk parameter configs", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["supplyCap"]);
        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "ToggleConfigActive");
        expect((await riskStewardReceiver.riskParameterConfigs("supplyCap")).active).to.equal(false);
      });

      it("should revert if pausing unsupported update type", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["Supply"]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should update risk parameter configs", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRiskParameterConfig", [
          "supplyCap",
          deployer.address,
        ]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        });
        expect(await riskStewardReceiver.riskParameterConfigs("supplyCap")).to.deep.equal([true, deployer.address]);
      });

      it("should emit RiskParameterConfigSet event", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRiskParameterConfig", [
          "supplyCap",
          deployer.address,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "RiskParameterConfigSet");
      });

      it("should revert if empty updateType is set", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRiskParameterConfig", [
          "",
          deployer.address,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should not support zero risk steward address", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRiskParameterConfig", [
          "supplyCap",
          AddressZero,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should set allowed destination chain receivers", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRemoteRiskStewardReceiver", [
          LZ_CHAINID.basemainnet,
          "0x1234567890123456789012345678901234567890",
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        )
          .to.emit(riskStewardReceiver, "RemoteRiskStewardReceiverUpdated")
          .withArgs(LZ_CHAINID.basemainnet, AddressZero, "0x1234567890123456789012345678901234567890");

        expect(await riskStewardReceiver.remoteRiskStewardReceiver(LZ_CHAINID.basemainnet)).to.equal(
          "0x1234567890123456789012345678901234567890",
        );
      });

      it("should revert if receiver address is 0", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRemoteRiskStewardReceiver", [
          LZ_CHAINID.basemainnet,
          AddressZero,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should only delete destination chain receivers if it exists", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("deleteRemoteRiskStewardReceiver", [
          LZ_CHAINID.basemainnet,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should delete destination chain receivers", async function () {
        let callData = riskStewardReceiver.interface.encodeFunctionData("setRemoteRiskStewardReceiver", [
          LZ_CHAINID.basemainnet,
          "0x1234567890123456789012345678901234567890",
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        )
          .to.emit(riskStewardReceiver, "RemoteRiskStewardReceiverUpdated")
          .withArgs(LZ_CHAINID.basemainnet, AddressZero, "0x1234567890123456789012345678901234567890");

        callData = riskStewardReceiver.interface.encodeFunctionData("deleteRemoteRiskStewardReceiver", [
          LZ_CHAINID.basemainnet,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        )
          .to.emit(riskStewardReceiver, "RemoteRiskStewardReceiverUpdated")
          .withArgs(LZ_CHAINID.basemainnet, "0x1234567890123456789012345678901234567890", AddressZero);
      });

      it("should revert if maxDeltaBps is 0", async function () {
        await expect(marketCapsRiskSteward.setMaxDeltaBps(0)).to.be.rejectedWith("InvalidMaxDeltaBps");
      });

      it("should revert if maxDeltaBps is 10000 or greater", async function () {
        await expect(marketCapsRiskSteward.setMaxDeltaBps(10001)).to.be.rejectedWith("InvalidMaxDeltaBps");
      });

      it("should revert if v1ChainId length not equals to v2ChainID", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("setDestChainIdMappings", [[1], [102, 103]]);
        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });
    });

    describe("Risk Steward Pause", async function () {
      it("should toggle paused state", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("pause", []);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "Paused");

        expect(await riskStewardReceiver.paused()).to.equal(true);
      });

      it("should revert if contract is paused", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("pause", []);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "Paused");
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.rejectedWith("Pausable: paused");
      });

      it("should revert if contract is paused", async function () {
        const callData = riskStewardReceiver.interface.encodeFunctionData("pause", []);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "Paused");
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, "0x", 0),
        ).to.be.rejectedWith("Pausable: paused");
      });

      it("should unpause the contract", async function () {
        // Pause first
        let callData = riskStewardReceiver.interface.encodeFunctionData("pause", []);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "Paused");

        expect(await riskStewardReceiver.paused()).to.equal(true);

        // Unpause
        callData = riskStewardReceiver.interface.encodeFunctionData("unpause", []);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardReceiver, "Unpaused");

        expect(await riskStewardReceiver.paused()).to.equal(false);
      });
    });

    describe("Risk Parameter Update Reverts under incorrect conditions", async function () {
      it("should error if updateType is not active", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        let callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["supplyCap"]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        });
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 3);

        callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["borrowCap"]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        });
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 3);
      });

      it("should error if the update is expired", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await time.increase(60 * 60 * 24 + 1);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 4);
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 4);
      });

      it("should error if market is not supported", async function () {
        // Wrong address
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreComptroller.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 5);
        // Wrong address
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreComptroller.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 5);
      });

      it("should error if the update is too frequent", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await riskStewardReceiver.processUpdateById(1, "0x", 0);
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 12,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 5);

        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await riskStewardReceiver.processUpdateById(3, "0x", 0);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 12,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(4, 5);
      });

      it("should error if update is already proposed", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockVToken.address,
            value: 0.7,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 6);
      });

      it("should revert on invalid update ID", async function () {
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.rejectedWith("Invalid update ID.");
      });

      it("should revert if the update has already been applied", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await riskStewardReceiver.processUpdateById(1, "0x", 0);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 1);
      });

      it("should revert if the update is out of bounds", async function () {
        // Too low
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 2,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 5);

        // Too high
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 20,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 5);

        // Too Low
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockVToken.address,
            value: 2,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(3, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(3, 5);

        // Too high
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockVToken.address,
            value: 20,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(4, 5);
      });

      it("should revert if the update is out of bounds (criticalParams)", async function () {
        // Too low
        await publishRiskParameterUpdate([
          {
            updateType: "reserveFactor",
            market: mockCoreVToken.address,
            value: 0,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await riskStewardReceiver.processUpdateById(1, "0x", 0);
        xvsVault.getPriorVotes.returns(convertToUnit("600001", 18));
        await mine();
        await governorBravoDelegate.castVote(2, 1);
        await mine(8);
        await governorBravoDelegate.queue(2);
        await mine(300);
        await expect(governorBravoDelegate.execute(2)).to.be.reverted;
      });

      it("should revert if the update id is not the latest", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 2,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 2,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 4);
      });

      it("should revert if the remote destination receiver is not set", async function () {
        const remoteChainId = 2;
        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockCoreVToken.address,
            value: 0.75,
            destinationChainId: remoteChainId,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 7);
      });

      it("should error if update is already sent to destination", async () => {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
        ]);
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, ETHEREUM_LZV2_CHAIN_ID],
        );
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes", "string", "address", "bytes", "uint256"],
          [
            1,
            parseUnitsToHex(6),
            "supplyCap",
            mockVToken.address,
            remoteData,
            (await ethers.provider.getBlock("latest")).timestamp,
          ],
        );

        // LayerZero options and quote
        const options = Options.newOptions().addExecutorLzReceiveOption(1_000_000, 0).toBytes();
        const [nativeFee] = await riskStewardReceiver.quote(ETHEREUM_LZV2_CHAIN_ID, payload, options, false);

        // Send the update via source chain
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(ETHEREUM_LZV2_CHAIN_ID, 1);

        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 2);
      });

      it("should error if lzSend fails", async () => {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
        ]);

        // LayerZero wrong options and quote
        const options = "0x";
        const nativeFee = 5000000;

        // Send the update via source chain
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, options, 0, {
            value: nativeFee,
          }),
        ).to.emit(riskStewardReceiver, "RemoteRiskParameterUpdateFailed");
      });

      it("should revert if mapping of v1ChainId not set", async function () {
        const randomChain = 121;
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRemoteRiskStewardReceiver", [
          randomChain,
          "0x1234567890123456789012345678901234567890",
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        );

        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockCoreVToken.address,
            value: 0.7,
            destinationChainId: randomChain,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.rejectedWith("invalid lzV1DestChainId");
      });
    });

    describe("Risk Parameter Updates on Source chain under correct conditions", async function () {
      it("should process update by id: MarketCap update on BNB chain", async function () {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(await riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
          .withArgs(mockCoreVToken.address, parseUnits("10", 18));
        await expect(await riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(mockCoreVToken.address, parseUnits("10", 18));
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        // Isolated Pool
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.processUpdateById(3, "0x", 0))
          .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
          .withArgs(mockVToken.address, parseUnits("10", 18));
        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(mockVToken.address, parseUnits("10", 18));
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      });

      it("should process increase updates by parameter and market: MarketCap update on BNB chain", async function () {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockCoreVToken.address, "0x", 0);
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        // Isolated Pool
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockVToken.address,
            value: 10,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, "0x", 0);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      });

      it("should process decrease updates by parameter and market: MarketCap update on BNB chain", async function () {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 6,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockCoreVToken.address,
            value: 6,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockCoreVToken.address, "0x", 0);
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("6", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("6", 18));
        // Isolated Pool
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockVToken.address,
            value: 6,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await publishRiskParameterUpdate([
          {
            updateType: "borrowCap",
            market: mockVToken.address,
            value: 6,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, "0x", 0);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
      });

      it("should process update by id: reserveFactor proposal on BNB chain (isolated)", async function () {
        expect(await mockVToken.reserveFactorMantissa()).to.equal(parseUnits("0.25", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "reserveFactor",
            market: mockVToken.address,
            value: 0.3,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        xvsVault.getPriorVotes.returns(convertToUnit("600001", 18));
        await mine();
        await governorBravoDelegate.castVote(2, 1);
        await mine(8);
        await governorBravoDelegate.queue(2);
        await mine(300);
        await governorBravoDelegate.execute(2);
        expect(await mockVToken.reserveFactorMantissa()).to.equal(parseUnits("0.3", 18));
      });

      it("should process update by id: reserveFactor proposal on BNB chain(Core pool)", async function () {
        expect(await mockCoreVToken.reserveFactorMantissa()).to.equal(parseUnits("0.2", 18));

        await publishRiskParameterUpdate([
          {
            updateType: "reserveFactor",
            market: mockCoreVToken.address,
            value: 0.25,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        xvsVault.getPriorVotes.returns(convertToUnit("600001", 18));
        await mine();
        await governorBravoDelegate.castVote(2, 1);
        await mine(8);
        await governorBravoDelegate.queue(2);
        await mine(300);
        await governorBravoDelegate.execute(2);
        expect(await mockVToken.reserveFactorMantissa()).to.equal(parseUnits("0.25", 18));
      });

      it("should process update by id: collateralFactor proposal on BNB chain (isolated)", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockVToken.address,
            value: 0.8,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        xvsVault.getPriorVotes.returns(convertToUnit("600001", 18));
        await mine();
        await governorBravoDelegate.castVote(2, 1);
        await mine(8);
        await governorBravoDelegate.queue(2);
        await mine(300);
        await governorBravoDelegate.execute(2);
        const market = await mockComptroller.markets(mockVToken.address);
        expect(market.collateralFactorMantissa).to.equal(parseUnits("0.8", 18));
      });

      it("should process update by id: collateralFactor proposal on BNB chain", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockCoreVToken.address,
            value: 0.7,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        xvsVault.getPriorVotes.returns(convertToUnit("600001", 18));
        await mine();
        await governorBravoDelegate.castVote(2, 1);
        await mine(8);
        await governorBravoDelegate.queue(2);
        await mine(300);
        await governorBravoDelegate.execute(2);
        const market = await mockCoreComptroller.markets(mockCoreVToken.address);
        expect(market.collateralFactorMantissa).to.equal(parseUnits("0.7", 18));
      });
    });

    describe("Risk Parameter Updates on Destination chain under correct conditions", async function () {
      it("Should send update to destination: MarketCap update on Remote chain", async () => {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        await publishRiskParameterUpdate([
          {
            updateType: "supplyCap",
            market: mockCoreVToken.address,
            value: 10,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
        ]);
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, ETHEREUM_LZV2_CHAIN_ID],
        );
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes", "string", "address", "bytes", "uint256"],
          [
            1,
            parseUnitsToHex(6),
            "supplyCap",
            mockVToken.address,
            remoteData,
            (await ethers.provider.getBlock("latest")).timestamp,
          ],
        );

        // LayerZero options and quote
        const options = Options.newOptions().addExecutorLzReceiveOption(1_000_000, 0).toBytes();
        const [nativeFee] = await riskStewardReceiver.quote(ETHEREUM_LZV2_CHAIN_ID, payload, options, false);

        // Send the update via source chain
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(ETHEREUM_LZV2_CHAIN_ID, 1);

        // Received on destination
        expect(await riskStewardDestReceiver.processedUpdates(1)).to.equal(1); // RECEIVED

        await time.increase(6 * 3600 + 1); // increase 6 hours and one minute
        await expect(riskStewardDestReceiver.processStoredUpdate(1))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      });

      it("should propose omnichain proposal update: collateralFactor update on remote chain", async function () {
        const destinationChainUpdates = await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockVToken.address,
            value: 0.75,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
        ]);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        const actions = await governorBravoDelegate.getActions(2);

        expect(actions.targets).to.deep.equal([omnichainProposalSender.address]);
        expect(actions.signatures).to.deep.equal(["execute(uint16,bytes,bytes,address)"]);
        expect(actions.calldatas[0]).to.deep.equal(destinationChainUpdates[LZ_CHAINID.ethereum]);
      });

      it("should reduce remote updates to a single proposal including BSC chain commands", async function () {
        const destinationChainUpdates = await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockEthereumVToken.address,
            value: 0.6,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
          {
            updateType: "reserveFactor",
            market: mockEthereumVToken.address,
            value: 0.3,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
          {
            updateType: "collateralFactor",
            market: mockArbitrumVToken.address,
            value: 0.6,
            destinationChainId: ARBITRUM_LZV2_CHAIN_ID,
          },
          {
            updateType: "reserveFactor",
            market: mockArbitrumVToken.address,
            value: 0.3,
            destinationChainId: ARBITRUM_LZV2_CHAIN_ID,
          },
          // local
          {
            updateType: "collateralFactor",
            market: mockVToken.address,
            value: 0.5,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
          {
            updateType: "reserveFactor",
            market: mockVToken.address,
            value: 0.3,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
        ]);

        await expect(riskStewardReceiver.proposeUpdatesByIds([1, 2, 3, 4, 5, 6]))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(2)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(3)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(4)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(5)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(6);

        // Check proposal created
        const proposal = await governorBravoDelegate.proposals(2);
        expect(proposal.id).to.equal(2);
        expect(proposal.proposer).to.equal(riskStewardReceiver.address);
        expect(proposal.proposalType).to.equal(1);
        const actions = await governorBravoDelegate.getActions(2);
        expect(actions.calldatas[2]).to.deep.equal(destinationChainUpdates[LZ_CHAINID.ethereum]);
        expect(actions.calldatas[3]).to.deep.equal(destinationChainUpdates[LZ_CHAINID.arbitrumone]);
      });

      it("should reduce updates to a single proposal including MarketCap and skipping invalid updates", async function () {
        await publishRiskParameterUpdate([
          {
            updateType: "collateralFactor",
            market: mockEthereumVToken.address,
            value: 0.65,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
          {
            updateType: "reserveFactor",
            market: mockEthereumVToken.address,
            value: 0.35,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
          // MarketCap update
          {
            updateType: "supplyCap",
            market: mockEthereumVToken.address,
            value: 10,
            destinationChainId: ETHEREUM_LZV2_CHAIN_ID,
          },
          // local
          {
            updateType: "collateralFactor",
            market: mockVToken.address,
            value: 0.75,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
          {
            updateType: "reserveFactor",
            market: mockVToken.address,
            value: 0.35,
            destinationChainId: BSC_LZV2_CHAIN_ID,
          },
          { updateType: "collateralFactor", market: mockCoreVToken.address, value: 0.75, destinationChainId: 90 }, // invalid destination chain id
        ]);

        await expect(riskStewardReceiver.proposeUpdatesByIds([1, 2, 3, 4, 5, 6]))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(1)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(2)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(3)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(4)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed")
          .withArgs(5)
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(6, 7);
      });
    });
  });

  describe("MarketCapsRiskSteward", async function () {
    it("should emit MaxDeltaBpsUpdated when updating maxDeltaBps", async function () {
      await expect(marketCapsRiskSteward.setMaxDeltaBps(7500))
        .to.emit(marketCapsRiskSteward, "MaxDeltaBpsUpdated")
        .withArgs(5000, 7500);
    });

    it("should revert if max delta bps is set to 0", async function () {
      await expect(marketCapsRiskSteward.setMaxDeltaBps(0)).to.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should revert if max delta bps is larger than maxBps", async function () {
      await expect(marketCapsRiskSteward.setMaxDeltaBps(10001)).to.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should emit DebouncePeriodUpdated when updating setDebouncePeriod", async function () {
      await expect(marketCapsRiskSteward.setDebouncePeriod(90000))
        .to.emit(marketCapsRiskSteward, "DebouncePeriodUpdated")
        .withArgs(DAY_AND_ONE_SECOND, 90000);
    });

    it("should revert if debounce period is set to 0", async function () {
      await expect(marketCapsRiskSteward.setDebouncePeriod(0)).to.rejectedWith("InvalidDebouncePeriod");
    });

    it("should revert if debounce period is less than or equal to update expiration time", async function () {
      await expect(
        marketCapsRiskSteward.setDebouncePeriod(await riskStewardReceiver.UPDATE_EXPIRATION_TIME()),
      ).to.rejectedWith("InvalidDebouncePeriod");

      await expect(
        marketCapsRiskSteward.setDebouncePeriod((await riskStewardReceiver.UPDATE_EXPIRATION_TIME()).sub(1)),
      ).to.rejectedWith("InvalidDebouncePeriod");
    });

    it("should not be able to renounce ownership", async function () {
      await expect(marketCapsRiskSteward.renounceOwnership()).to.revertedWith("renounceOwnership() is not allowed");
    });
  });

  describe("CriticalParamsRiskSteward", async function () {
    it("should emit MaxDeltaBpsUpdated when updating maxDeltaBps", async function () {
      await expect(criticalParamsRiskSteward.setMaxDeltaBps(7500))
        .to.emit(criticalParamsRiskSteward, "MaxDeltaBpsUpdated")
        .withArgs(5000, 7500);
    });

    it("should revert if max delta bps is set to 0", async function () {
      await expect(criticalParamsRiskSteward.setMaxDeltaBps(0)).to.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should revert if max delta bps is larger than maxBps", async function () {
      await expect(criticalParamsRiskSteward.setMaxDeltaBps(10001)).to.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should emit DebouncePeriodUpdated when updating setDebouncePeriod", async function () {
      await expect(criticalParamsRiskSteward.setDebouncePeriod(90000))
        .to.emit(criticalParamsRiskSteward, "DebouncePeriodUpdated")
        .withArgs(DAY_AND_ONE_SECOND, 90000);
    });

    it("should revert if debounce period is set to 0", async function () {
      await expect(criticalParamsRiskSteward.setDebouncePeriod(0)).to.rejectedWith("InvalidDebouncePeriod");
    });

    it("should revert if debounce period is less than or equal to update expiration time", async function () {
      await expect(
        criticalParamsRiskSteward.setDebouncePeriod(await riskStewardReceiver.UPDATE_EXPIRATION_TIME()),
      ).to.rejectedWith("InvalidDebouncePeriod");

      await expect(
        criticalParamsRiskSteward.setDebouncePeriod((await riskStewardReceiver.UPDATE_EXPIRATION_TIME()).sub(1)),
      ).to.rejectedWith("InvalidDebouncePeriod");
    });

    it("should not be able to renounce ownership", async function () {
      await expect(criticalParamsRiskSteward.renounceOwnership()).to.revertedWith("renounceOwnership() is not allowed");
    });
  });

  describe("RiskStewardDestinationReceiver", async function () {
    describe("pause and ownable", function () {
      it("should revert if contract is paused", async function () {
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("pause", []);

        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardDestReceiver, "Paused");
        await expect(riskStewardDestReceiver.processStoredUpdate(1)).to.be.rejectedWith("Pausable: paused");
      });

      it("should revert if caller is non owner", async function () {
        const newValue = parseUnitsToHex(6);
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        await expect(
          riskStewardDestReceiver.processUpdate(1, newValue, "borrowCap", mockVToken.address, timestamp),
        ).to.be.rejectedWith("Ownable: caller is not the owner");
      });
    });

    describe("Constructor", function () {
      it("sets initial values correctly", async function () {
        expect(await riskStewardDestReceiver.guardian()).to.equal(deployer.address);
        expect(await riskStewardDestReceiver.remoteDelay()).to.equal(6 * 3600);
      });
    });

    describe("setRemoteDelay", function () {
      it("allows only owner to set delay", async function () {
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("setRemoteDelay", [10000]);

        await expect(
          signer1.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;

        await expect(riskStewardDestReceiver.connect(signer1).setRemoteDelay(10000)).to.be.reverted;

        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        )
          .to.emit(riskStewardDestReceiver, "SetRemoteDelay")
          .withArgs(6 * 3600, 10000);

        expect(await riskStewardDestReceiver.remoteDelay()).to.equal(10000);
      });

      it("reverts if delay is zero", async function () {
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("setRemoteDelay", [0]);
        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });
    });

    describe("setGuardian", function () {
      it("allows only owner or guardian", async function () {
        let callData = riskStewardDestReceiver.interface.encodeFunctionData("setGuardian", [signer1.address]);
        await expect(
          signer1.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;

        await expect(
          riskStewardDestReceiver.connect(signer1).setGuardian(signer1.address),
        ).to.be.revertedWithCustomError(riskStewardDestReceiver, "Unauthorized");

        callData = riskStewardDestReceiver.interface.encodeFunctionData("setGuardian", [signer1.address]);
        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        )
          .to.emit(riskStewardDestReceiver, "SetGuardian")
          .withArgs(deployer.address, signer1.address);

        await riskStewardDestReceiver.connect(signer1).setGuardian(deployer.address); // now new guardian can set
      });

      it("reverts if zero address", async function () {
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("setGuardian", [AddressZero]);
        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });
    });

    describe("cancelUpdate", function () {
      const updateId = 1;
      beforeEach(async () => {
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, ETHEREUM_LZV2_CHAIN_ID],
        );
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes", "string", "address", "bytes", "uint256"],
          [
            1,
            parseUnitsToHex(6),
            "supplyCap",
            mockVToken.address,
            remoteData,
            (await ethers.provider.getBlock("latest")).timestamp,
          ],
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "supplyCap",
          mockVToken.address,
          remoteData,
        );

        const options = Options.newOptions().addExecutorLzReceiveOption(1_000_000, 0).toBytes();
        const [nativeFee] = await riskStewardReceiver.quote(ETHEREUM_LZV2_CHAIN_ID, payload, options, false);

        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(ETHEREUM_LZV2_CHAIN_ID, 1);

        // Received on destination
        expect(await riskStewardDestReceiver.processedUpdates(1)).to.equal(1); // RECEIVED
      });

      it("allows guardian to cancel only RECEIVED updates", async function () {
        await expect(riskStewardDestReceiver.connect(signer1).cancelUpdate(updateId)).to.be.revertedWithCustomError(
          riskStewardDestReceiver,
          "Unauthorized",
        );
        await expect(riskStewardDestReceiver.connect(deployer).cancelUpdate(123)).to.be.revertedWith(
          "Status not compatible",
        );

        await expect(riskStewardDestReceiver.connect(deployer).cancelUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "CancelUpdate")
          .withArgs(updateId);
        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(5); // CANCELLED
      });
      it("Should not cancel update if update is already processed", async function () {
        await time.increase(6 * 3600 + 1); // increase 6 hours and one minute
        await expect(riskStewardDestReceiver.processStoredUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(updateId);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
        await expect(riskStewardDestReceiver.connect(deployer).cancelUpdate(123)).to.be.revertedWith(
          "Status not compatible",
        );
      });
    });

    describe("processStoredUpdate", function () {
      const updateId = 1;
      beforeEach(async () => {
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, ETHEREUM_LZV2_CHAIN_ID],
        );
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "bytes", "string", "address", "bytes", "uint256"],
          [
            1,
            parseUnitsToHex(6),
            "borrowCap",
            mockVToken.address,
            remoteData,
            (await ethers.provider.getBlock("latest")).timestamp,
          ],
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "borrowCap",
          mockVToken.address,
          remoteData,
        );

        const options = Options.newOptions().addExecutorLzReceiveOption(1_000_000, 0).toBytes();
        const [nativeFee] = await riskStewardReceiver.quote(ETHEREUM_LZV2_CHAIN_ID, payload, options, false);

        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(ETHEREUM_LZV2_CHAIN_ID, 1);

        // Received on destination
        expect(await riskStewardDestReceiver.processedUpdates(1)).to.equal(1); // RECEIVED
      });

      it("reverts if update not stored at destination", async function () {
        await expect(riskStewardDestReceiver.processStoredUpdate(2)).to.be.rejectedWith("UpdateNotReceived");
      });

      it("reverts if delay not surpassed", async function () {
        await expect(riskStewardDestReceiver.processStoredUpdate(updateId)).to.be.revertedWith(
          "Delay has to be surpassed",
        );
      });

      it("processes a valid update after delay", async function () {
        await time.increase(6 * 3600 + 1);

        await expect(riskStewardDestReceiver.processStoredUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(updateId);

        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(2); // PROCESSED
      });

      it("reverts if update already processed", async function () {
        await time.increase(6 * 3600 + 1);

        await expect(riskStewardDestReceiver.processStoredUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(updateId);

        await expect(riskStewardDestReceiver.processStoredUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateFailed")
          .withArgs(updateId, 2);
      });

      it("emits RiskParameterUpdateFailed for config inactive", async function () {
        expect((await riskStewardDestReceiver.riskParameterConfigs("borrowCap")).active).to.be.true;
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("toggleConfigActive", ["borrowCap"]);

        await expect(
          deployer.sendTransaction({
            to: destStewardOwner.address,
            data: callData,
          }),
        ).to.emit(riskStewardDestReceiver, "ToggleConfigActive");

        expect((await riskStewardDestReceiver.riskParameterConfigs("borrowCap")).active).to.be.false;

        await time.increase(6 * 3600 + 1);

        await expect(riskStewardDestReceiver.processStoredUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateFailed")
          .withArgs(updateId, 3); // CONFIG_NOT_ACTIVE

        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(3);
      });

      it("emits RiskParameterUpdateFailed if expired", async function () {
        await time.increase(2 * 24 * 3600 + 1); // 2 days + 1s
        await expect(riskStewardDestReceiver.processStoredUpdate(updateId)).to.emit(
          riskStewardDestReceiver,
          "RiskParameterUpdateFailed",
        );
        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(4); // EXPIRED
      });
    });

    describe("processUpdate", function () {
      it("should process a valid update", async function () {
        const newValue = parseUnitsToHex(6);
        const timestamp = (await ethers.provider.getBlock("latest")).timestamp;
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("processUpdate", [
          1,
          newValue,
          "borrowCap",
          mockVToken.address,
          timestamp,
        ]);

        await deployer.sendTransaction({
          to: destStewardOwner.address,
          data: callData,
        });
      });
    });
  });
});
