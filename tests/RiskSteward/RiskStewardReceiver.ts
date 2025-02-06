import { MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import { LZ_CHAINID } from "../../helpers/deploy/constants";
import { convertToUnit } from "../../helpers/utils";
import { SUPPORTED_NETWORKS } from "../../helpers/deploy/constants";

import {
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockRiskOracle,
  MockVToken,
  RiskStewardReceiver,
  GovernorBravoDelegate__factory,
  GovernorBravoDelegate,
  OmnichainProposalSender,
  OmnichainExecutorOwner,
  XVSVault
} from "../../typechain";

const { parseUnits, hexValue, defaultAbiCoder, solidityPack } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const HARDHAT_LAYER_ZERO_CHAIN_ID = LZ_CHAINID.hardhat;
const ETHEREUM_LAYER_ZERO_CHAIN_ID = LZ_CHAINID.ethereum;
const ARBITRUM_LAYER_ZERO_CHAIN_ID = LZ_CHAINID.arbitrumone;

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

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    MockRiskOracleFactory: ContractFactory,
    MockMarketCapsRiskStewardFactory: ContractFactory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockEthereumVToken: MockVToken,
    mockArbitrumVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    governorBravoDelegate: MockContract<GovernorBravoDelegate>,
    omnichainProposalSender: OmnichainProposalSender,
    ethereumOmnichainExecutorOwner: OmnichainExecutorOwner,
    arbitrumOmnichainExecutorOwner: OmnichainExecutorOwner;

  const publishRiskParameterUpdate = async (updates: { updateType: 'supplyCap' | 'borrowCap', market: string, value: number, destinationChainId: number }[]) => {
    const updatesByDestinationChainId = {};
    for (const { updateType, market, value, destinationChainId } of updates) {
      const update: [string, string, string, string, string] = [
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(value),
        updateType,
        market,
        defaultAbiCoder.encode(["address", "uint16"], ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", destinationChainId])]

      await mockRiskOracle.publishRiskParameterUpdate(...update);

      if (updatesByDestinationChainId[destinationChainId]) {
        updatesByDestinationChainId[destinationChainId].push(update);
      } else if (destinationChainId !== HARDHAT_LAYER_ZERO_CHAIN_ID) {
        updatesByDestinationChainId[destinationChainId] = [update]
      }
    }
    const payloadsByDestinationChainId = {};
    const proposalId = await omnichainProposalSender.proposalCount();

    Object.entries(updatesByDestinationChainId).forEach(([key, value]: [number, [string, string, string, string, string][]]) => {
      const addresses: string[] = [];
      const values: number[] = [];
      const signatures: string[] = [];
      const calldatas: string[] = [];
      const proposalType = 1;

      value.forEach(update => {
        addresses.push("0x1234567890123456789012345678901234567890");
        values.push(0);
        signatures.push("processUpdate(string,bytes,string,address,bytes)");
        calldatas.push(defaultAbiCoder.encode(["string", "bytes", "string", "address", "bytes"], update));
      })
      calldatas.reverse();
      const payload = defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]", "uint8"],
        [addresses, values, signatures, calldatas, proposalType]
      )
      const payloadWithId = defaultAbiCoder.encode(["bytes", "uint256"], [payload, proposalId]);
      const remoteAdapterParam = solidityPack(["uint16", "uint256"], [1, 300000]);
      const remoteCalldata = defaultAbiCoder.encode(["uint16", "bytes", "bytes", "address"], [key, payloadWithId, remoteAdapterParam, ethers.constants.AddressZero]);
      payloadsByDestinationChainId[key] = remoteCalldata;
    })

    return payloadsByDestinationChainId
  }

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");

    const accessControlManager = await accessControlManagerFactory.deploy();

    // Set up mock comptroller and markets
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    // Core Pool Comptroller
    const MockCoreComptrollerFactory = await ethers.getContractFactory("MockCoreComptroller");
    mockCoreComptroller = await MockCoreComptrollerFactory.deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    mockCoreComptroller._supportMarket(mockCoreVToken.address);
    mockCoreComptroller._setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    mockCoreComptroller._setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);

    // IL Comptroller
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");
    mockComptroller = await MockComptrollerFactory.deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    mockEthereumVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    mockArbitrumVToken = await MockVTokenFactory.deploy(mockComptroller.address);

    mockComptroller.supportMarket(mockVToken.address);
    mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);
    MockRiskOracleFactory = await ethers.getContractFactory("MockRiskOracle");
    MockMarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    mockRiskOracle = await MockRiskOracleFactory.deploy(
      "MockRiskOracle",
      [deployer.address],
      ["supplyCap", "borrowCap", "randomUpdateType"],
    );

    const xvsVault = await smock.fake<XVSVault>("MockXVSVault");

    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");

    const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
    governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
    await governorBravoDelegate.setVariable("initialProposalId", 1);
    await governorBravoDelegate.setVariable("proposalCount", 1);
    await governorBravoDelegate.setVariable("proposalMaxOperations", 10);
    await governorBravoDelegate.setVariable("proposalConfigs", proposalConfigs);
    await governorBravoDelegate.setVariable("xvsVault", xvsVault.address);

    xvsVault.getPriorVotes.returns(convertToUnit("250000", 18));

    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const OmnichainProposalSenderFactory = await ethers.getContractFactory("OmnichainProposalSender");
    const localEndpoint = await LZEndpointMock.deploy(HARDHAT_LAYER_ZERO_CHAIN_ID);
    omnichainProposalSender = await OmnichainProposalSenderFactory.deploy(localEndpoint.address, accessControlManager.address);

    const OmnichainGovernanceExecutorFactory = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const ethereumRemoteEndpoint = await LZEndpointMock.deploy(ETHEREUM_LAYER_ZERO_CHAIN_ID);
    const arbitrumRemoteEndpoint = await LZEndpointMock.deploy(ARBITRUM_LAYER_ZERO_CHAIN_ID);
    const ethereumOmnichainGovernanceExecutor = await OmnichainGovernanceExecutorFactory.deploy(ethereumRemoteEndpoint.address, deployer.address, HARDHAT_LAYER_ZERO_CHAIN_ID);
    const arbitrumOmnichainGovernanceExecutor = await OmnichainGovernanceExecutorFactory.deploy(arbitrumRemoteEndpoint.address, deployer.address, HARDHAT_LAYER_ZERO_CHAIN_ID);

    const OmnichainProposalExecutorOwner = await ethers.getContractFactory("OmnichainExecutorOwner");
    ethereumOmnichainExecutorOwner = await upgrades.deployProxy(OmnichainProposalExecutorOwner, [accessControlManager.address], {
      constructorArgs: [ethereumOmnichainGovernanceExecutor.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    arbitrumOmnichainExecutorOwner = await upgrades.deployProxy(OmnichainProposalExecutorOwner, [accessControlManager.address], {
      constructorArgs: [arbitrumOmnichainGovernanceExecutor.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });


    const ethereumRemotePath = ethers.utils.solidityPack(["address"], [ethereumOmnichainGovernanceExecutor.address]);
    const arbitrumRemotePath = ethers.utils.solidityPack(["address"], [arbitrumOmnichainGovernanceExecutor.address]);
    const localPath = ethers.utils.solidityPack(["address"], [omnichainProposalSender.address]);


    await accessControlManager
      .connect(deployer)
      .giveCallPermission(omnichainProposalSender.address, "setTrustedRemoteAddress(uint16,bytes)", deployer.address);

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(ethereumOmnichainExecutorOwner.address, "setTrustedRemoteAddress(uint16,bytes)", deployer.address);

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(arbitrumOmnichainExecutorOwner.address, "setTrustedRemoteAddress(uint16,bytes)", deployer.address);

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(deployer.address, "removeTrustedRemote(uint16)", deployer.address);

    await omnichainProposalSender.setTrustedRemoteAddress(LZ_CHAINID.ethereum, ethereumRemotePath);
    await omnichainProposalSender.setTrustedRemoteAddress(LZ_CHAINID.arbitrumone, arbitrumRemotePath);

    await ethereumOmnichainGovernanceExecutor.connect(deployer).setTrustedRemoteAddress(HARDHAT_LAYER_ZERO_CHAIN_ID, localPath);
    await arbitrumOmnichainGovernanceExecutor.connect(deployer).setTrustedRemoteAddress(HARDHAT_LAYER_ZERO_CHAIN_ID, localPath);

    riskStewardReceiver = await upgrades.deployProxy(RiskStewardReceiverFactory, [accessControlManager.address], {
      constructorArgs: [mockRiskOracle.address, governorBravoDelegate.address, omnichainProposalSender.address, HARDHAT_LAYER_ZERO_CHAIN_ID],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    marketCapsRiskSteward = await upgrades.deployProxy(
      MockMarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000, 5],
      {
        constructorArgs: [riskStewardReceiver.address, HARDHAT_LAYER_ZERO_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "toggleConfigActive(string)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "pause()", deployer.address);

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "unpause()", deployer.address);

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "setDestinationChainRiskStewardRemoteReceiver(uint16,address)", deployer.address);

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "deleteDestinationChainRiskStewardRemoteReceiver(uint16)", deployer.address);

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setMaxDeltaBps(uint256)",
      deployer.address,
    );

    await riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND);
    await riskStewardReceiver.setRiskParameterConfig("borrowCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND);
    await riskStewardReceiver.setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.ethereum, "0x1234567890123456789012345678901234567890");
    await riskStewardReceiver.setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.arbitrumone, "0x1234567890123456789012345678901234567890");
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Access Control", async function () {
    it("should revert if access is not granted for setting risk parameter config", async function () {
      await expect(
        riskStewardReceiver.connect(signer1).setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, 1),
      ).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "setRiskParameterConfig(string,address,uint256)")`,
      );
    });

    it("should revert if access is not granted for toggling config active", async function () {
      await expect(riskStewardReceiver.connect(signer1).toggleConfigActive("supplyCap")).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "toggleConfigActive(string)")`, ``
      );
    });

    it("should revert if access is not granted for pausing", async function () {
      await expect(riskStewardReceiver.connect(signer1).pause()).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "pause()")`,
      );
    });

    it("should revert if access is not granted for unpausing", async function () {
      await expect(riskStewardReceiver.connect(signer1).unpause()).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "unpause()")`,
      );
    });

    it("should revert if access is not granted for processing update", async function () {
      await expect(
        marketCapsRiskSteward.connect(signer1).processUpdate({
          timestamp: 100,
          newValue: "0x",
          previousValue: "0x",
          referenceId: "1",
          updateType: "supplyCap",
          updateId: 1,
          additionalData: "0x",
          market: mockCoreVToken.address,
        }),
      ).to.be.rejectedWith("OnlyRiskStewardReceiver()");
    });

    it("should revert if access is not granted for setting max increase bps", async function () {
      await expect(marketCapsRiskSteward.connect(signer1).setMaxDeltaBps(1)).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${marketCapsRiskSteward.address}", "setMaxDeltaBps(uint256)")`,
      );
    });

    it("should revert if access is not granted for setting allowed destination chain receivers", async function () {
      await expect(riskStewardReceiver.connect(signer1).setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet, "0x1234567890123456789012345678901234567890")).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "setDestinationChainRiskStewardRemoteReceiver(uint16,address)")`,
      );
    });

    it("should revert if access is not granted for deleting allowed destination chain receivers", async function () {
      await expect(riskStewardReceiver.connect(signer1).deleteDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet)).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardReceiver.address}", "deleteDestinationChainRiskStewardRemoteReceiver(uint16)")`,
      );
    });
  });

  describe("Upgradeable", async function () {
    it("new implementation should update risk oracle", async function () {
      const mockRiskOracle = (await MockRiskOracleFactory.deploy(
        "Mock Risk Oracle",
        [deployer.address],
        ["supplyCap", "borrowCap"],
      )) as MockRiskOracle;
      await upgrades.upgradeProxy(riskStewardReceiver, RiskStewardReceiverFactory, {
        constructorArgs: [mockRiskOracle.address, governorBravoDelegate.address, omnichainProposalSender.address, HARDHAT_LAYER_ZERO_CHAIN_ID],
        unsafeAllow: ["state-variable-immutable"],
      });
      expect(await riskStewardReceiver.RISK_ORACLE()).to.equal(mockRiskOracle.address);
    });
  });

  describe("Risk Parameter Config", async function () {
    it("should get original risk parameter configs", async function () {
      expect(await riskStewardReceiver.riskParameterConfigs("supplyCap")).to.deep.equal([
        true,
        BigNumber.from(DAY_AND_ONE_SECOND),
        marketCapsRiskSteward.address,
      ]);
      expect(await riskStewardReceiver.riskParameterConfigs("borrowCap")).to.deep.equal([
        true,
        BigNumber.from(DAY_AND_ONE_SECOND),
        marketCapsRiskSteward.address,
      ]);
    });

    it("should pause risk parameter configs", async function () {
      await riskStewardReceiver.toggleConfigActive("supplyCap");
      expect((await riskStewardReceiver.riskParameterConfigs("supplyCap")).active).to.equal(false);
    });

    it("should revert if pausing unsupported update type", async function () {
      await expect(riskStewardReceiver.toggleConfigActive("Supply")).to.be.rejectedWith("UnsupportedUpdateType");
    });

    it("should update risk parameter configs", async function () {
      await riskStewardReceiver.setRiskParameterConfig(
        "supplyCap",
        marketCapsRiskSteward.address,
        DAY_AND_ONE_SECOND + 1,
      );
      expect(await riskStewardReceiver.riskParameterConfigs("supplyCap")).to.deep.equal([
        true,
        BigNumber.from(DAY_AND_ONE_SECOND + 1),
        marketCapsRiskSteward.address,
      ]);
    });

    it("should emit RiskParameterConfigSet event", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND + 1),
      ).to.emit(riskStewardReceiver, "RiskParameterConfigSet");
    });

    it("should revert if empty updateType is set", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND + 1),
      ).to.be.rejectedWith("UnsupportedUpdateType");
    });

    it("should revert if debounce is 0", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, 0),
      ).to.be.rejectedWith("InvalidDebounce");
    });

    it("should not support zero risk steward address", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("supplyCap", ethers.constants.AddressZero, DAY_AND_ONE_SECOND + 1),
      ).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should revert if debounce is less than UPDATE_EXPIRATION_TIME", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND - 1),
      ).to.be.rejectedWith("InvalidDebounce");
    });

    it("should revert if maxDeltaBps is 0", async function () {
      await expect(marketCapsRiskSteward.setMaxDeltaBps(0)).to.be.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should revert if maxDeltaBps is 10000 or greater", async function () {
      await expect(marketCapsRiskSteward.setMaxDeltaBps(10001)).to.be.rejectedWith("InvalidMaxDeltaBps");
    });

    it("should set allowed destination chain receivers", async function () {
      expect(await riskStewardReceiver.setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet, '0x1234567890123456789012345678901234567890')).to.emit("DestinationChainRiskStewardRemoteReceiverSet").withArgs(LZ_CHAINID.basemainnet, ethers.constants.AddressZero, '0x1234567890123456789012345678901234567890');
      expect(await riskStewardReceiver.destinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet)).to.equal('0x1234567890123456789012345678901234567890');
    })

    it("should revert if receiver address is 0", async function () {
      await expect(riskStewardReceiver.setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet, ethers.constants.AddressZero)).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should only delete destination chain receivers if it exists", async function () {
      await expect(riskStewardReceiver.deleteDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet)).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should delete destination chain receivers", async function () {
      await riskStewardReceiver.setDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet, '0x1234567890123456789012345678901234567890');
      expect(await riskStewardReceiver.deleteDestinationChainRiskStewardRemoteReceiver(LZ_CHAINID.basemainnet)).to.emit("DestinationChainRiskStewardRemoteReceiverSet").withArgs(LZ_CHAINID.basemainnet, '0x1234567890123456789012345678901234567890', ethers.constants.AddressZero);
    });

  });

  describe("Risk Steward Pause", async function () {
    it("should toggle paused state", async function () {
      await riskStewardReceiver.pause();
      expect(await riskStewardReceiver.paused()).to.equal(true);
    });

    it("should revert if contract is paused", async function () {
      await riskStewardReceiver.pause();
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("Pausable: paused");
    });

    it("should revert if contract is paused", async function () {
      await riskStewardReceiver.pause();
      await expect(
        riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address),
      ).to.be.rejectedWith("Pausable: paused");
    });
  });

  describe("Risk Parameter Update Reverts under incorrect conditions", async function () {

    it("should error if updateType is not implemented", async function () {
      await publishRiskParameterUpdate([{ updateType: 'randomUpdateType' as any, market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 3);
      expect(await riskStewardReceiver.processedUpdates(1)).to.equal(3);
    });

    it("should error if updateType is not active", async function () {
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.toggleConfigActive("supplyCap");
      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 3);

      await riskStewardReceiver.toggleConfigActive("borrowCap");
      await expect(riskStewardReceiver.processUpdateById(2)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(2, 3);
    });

    it("should error if the update is expired", async function () {
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await time.increase(60 * 60 * 24 + 1);
      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 4);
      await expect(riskStewardReceiver.processUpdateById(2)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(2, 4);
    });

    it("should revert if market is not supported", async function () {
      // Wrong address
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreComptroller.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 6);
      // Wrong address
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreComptroller.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await expect(riskStewardReceiver.processUpdateById(2)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(2, 6);
    });

    it("should error if the update is too frequent", async function () {
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.processUpdateById(1);
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 12, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await expect(riskStewardReceiver.processUpdateById(2)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(2, 6);

      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await riskStewardReceiver.processUpdateById(3);
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 12, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await expect(riskStewardReceiver.processUpdateById(4)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(4, 6);
    });

    it("should revert on invalid update ID", async function () {
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith('Invalid update ID.');
    });

    it("should revert if the update has already been applied", async function () {
      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await riskStewardReceiver.processUpdateById(1);
      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 1);
    });

    it("should revert if the update is out of bounds", async function () {
      // Too low
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 2, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await expect(riskStewardReceiver.processUpdateById(1)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 6);

      // Too high
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 20, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(2)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(2, 6);

      // Too Low
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockVToken.address, value: 2, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(3)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(3, 6);

      // Too high
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockVToken.address, value: 20, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(4)).to.emit(riskStewardReceiver, "UpdateFailed").withArgs(4, 6);
    });
  });

  describe("Risk Parameter Updates on Source chain under correct conditions", async function () {
    it("should process update by id", async function () {
      // Core Pool
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(await riskStewardReceiver.processUpdateById(1))
        .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
        .withArgs(mockCoreVToken.address, parseUnits("10", 18));
      await expect(await riskStewardReceiver.processUpdateById(2))
        .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
        .withArgs(mockCoreVToken.address, parseUnits("10", 18));
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await expect(riskStewardReceiver.processUpdateById(3))
        .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
        .withArgs(mockVToken.address, parseUnits("10", 18));
      await expect(riskStewardReceiver.processUpdateById(4))
        .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
        .withArgs(mockVToken.address, parseUnits("10", 18));
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
    });

    it("should process increase updates by parameter and market", async function () {
      // Core Pool
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockCoreVToken.address);
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address);
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
    });

    it("should process decrease updates by parameter and market", async function () {
      // Core Pool
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockCoreVToken.address, value: 6, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockCoreVToken.address, value: 6, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockCoreVToken.address);
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("6", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("6", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

      await publishRiskParameterUpdate([{ updateType: 'supplyCap', market: mockVToken.address, value: 6, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])
      await publishRiskParameterUpdate([{ updateType: 'borrowCap', market: mockVToken.address, value: 6, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }])

      await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address);
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
    });
  });

  describe("Risk Parameter Updates on Destination chain under correct conditions", async function () {

    it("should process update by a single id", async function () {
      const destinationChainUpdates = await publishRiskParameterUpdate([
        { updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID }
      ])
      await expect(riskStewardReceiver.processUpdateById(1))
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(1);

      // Check proposal created
      const proposal = await governorBravoDelegate.proposals(2);
      expect(proposal.id).to.equal(2);
      expect(proposal.proposer).to.equal(riskStewardReceiver.address);
      expect(proposal.proposalType).to.equal(1);
      const actions = await governorBravoDelegate.getActions(2);

      expect(actions.targets).to.deep.equal([omnichainProposalSender.address]);
      expect(actions.signatures).to.deep.equal(['execute(uint16,bytes,bytes,address)']);
      expect(actions.calldatas[0]).to.deep.equal(destinationChainUpdates[ETHEREUM_LAYER_ZERO_CHAIN_ID]);
    });

    it("should execute source update and reduce remote updates to a single proposal", async function () {
      const destinationChainUpdates = await publishRiskParameterUpdate([
        { updateType: 'supplyCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        // local
        { updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }
      ])


      await expect(riskStewardReceiver.processUpdatesByIds([1, 2, 3, 4, 5, 6]))
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(1)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(2)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(3)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(4)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed").withArgs(5)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed").withArgs(6);
      // Check proposal created
      const proposal = await governorBravoDelegate.proposals(2);
      expect(proposal.id).to.equal(2);
      expect(proposal.proposer).to.equal(riskStewardReceiver.address);
      expect(proposal.proposalType).to.equal(1);
      const actions = await governorBravoDelegate.getActions(2);

      expect(actions.calldatas[0]).to.deep.equal(destinationChainUpdates[ETHEREUM_LAYER_ZERO_CHAIN_ID]);
      expect(actions.calldatas[1]).to.deep.equal(destinationChainUpdates[ARBITRUM_LAYER_ZERO_CHAIN_ID]);
    });

    it("should execute source update and reduce remote updates to a single proposal event when out of order", async function () {
      const destinationChainUpdates = await publishRiskParameterUpdate([
        { updateType: 'borrowCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
      ])

      await expect(riskStewardReceiver.processUpdatesByIds([1, 2, 3, 4, 5, 6]))
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed").withArgs(1)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(2)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed").withArgs(3)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(4)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(5)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(6)
      // Check proposal created
      const proposal = await governorBravoDelegate.proposals(2);
      expect(proposal.id).to.equal(2);
      expect(proposal.proposer).to.equal(riskStewardReceiver.address);
      expect(proposal.proposalType).to.equal(1);
      const actions = await governorBravoDelegate.getActions(2);

      expect(actions.calldatas[0]).to.deep.equal(destinationChainUpdates[ETHEREUM_LAYER_ZERO_CHAIN_ID]);
      expect(actions.calldatas[1]).to.deep.equal(destinationChainUpdates[ARBITRUM_LAYER_ZERO_CHAIN_ID]);
    })

    it("should execute source update and reduce remote updates to a single proposal event when out of order skipping invalid updates", async function () {

      await publishRiskParameterUpdate([
        { updateType: 'borrowCap', market: mockVToken.address, value: 1, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }, // too low
        { updateType: 'supplyCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockVToken.address, value: 10, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockCoreVToken.address, value: 100, destinationChainId: HARDHAT_LAYER_ZERO_CHAIN_ID }, // too high
        { updateType: 'borrowCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID }, // not latest update
        { updateType: 'borrowCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'supplyCap', market: mockArbitrumVToken.address, value: 10, destinationChainId: ARBITRUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'borrowCap', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID },
        { updateType: 'randomUpdateType', market: mockEthereumVToken.address, value: 10, destinationChainId: ETHEREUM_LAYER_ZERO_CHAIN_ID }, // invalid update type
        { updateType: 'borrowCap', market: mockCoreVToken.address, value: 10, destinationChainId: 90 }, // invalid destination chain id
      ])

      await expect(riskStewardReceiver.processUpdatesByIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
        .to.emit(riskStewardReceiver, "UpdateFailed").withArgs(1, 6)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(2)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed").withArgs(3)
        .to.emit(riskStewardReceiver, "UpdateFailed").withArgs(4, 6)
        .to.emit(riskStewardReceiver, "UpdateFailed").withArgs(5, 4)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(6)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(7)
        .to.emit(riskStewardReceiver, "RiskParameterUpdateProposed").withArgs(8)
        .to.emit(riskStewardReceiver, "UpdateFailed").withArgs(9, 3)
        .to.emit(riskStewardReceiver, "UpdateFailed").withArgs(10, 7)
    })
  })
});
