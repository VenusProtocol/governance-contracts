import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import {
  DestinationStewardReceiver,
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockVToken,
  RiskOracle,
  RiskStewardReceiver,
} from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const SIX_HOURS = 60 * 60 * 6;

const BSC_LZV2_CHAIN_ID = 30102;
const ETHEREUM_LZV2_CHAIN_ID = 30101;

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    unauthorizedSigner: SignerWithAddress,
    executor: SignerWithAddress,
    riskOracle: RiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    destinationRiskStewardReceiver: DestinationStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    DestinationStewardReceiverFactory: ContractFactory,
    RiskOracleFactory: ContractFactory,
    MarketCapsRiskStewardFactory: ContractFactory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    destinationMarketCapsRiskSteward: MarketCapsRiskSteward;

  const deployAndConfigureBridge = async (localEndpointV2: any, remoteEndpointV2: any) => {
    // Bridge connection
    await localEndpointV2.setDestLzEndpoint(destinationRiskStewardReceiver.address, remoteEndpointV2.address);
    await remoteEndpointV2.setDestLzEndpoint(riskStewardReceiver.address, localEndpointV2.address);

    await riskStewardReceiver.setPeer(
      ETHEREUM_LZV2_CHAIN_ID,
      ethers.utils.hexZeroPad(destinationRiskStewardReceiver.address, 32),
    );
    await destinationRiskStewardReceiver.setPeer(
      BSC_LZV2_CHAIN_ID,
      ethers.utils.hexZeroPad(riskStewardReceiver.address, 32),
    );
  };

  const setupPermissionsAndConfigs = async (accessControlManager: any) => {
    await accessControlManager.giveCallPermission(riskOracle.address, "addAuthorizedSender(address)", deployer.address);
    await accessControlManager.giveCallPermission(riskOracle.address, "addUpdateType(string)", deployer.address);

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setWhitelistedExecutor(address,bool)",
      deployer.address,
    );

    // Destination receiver permissions
    await accessControlManager.giveCallPermission(
      destinationRiskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      destinationRiskStewardReceiver.address,
      "setWhitelistedExecutor(address,bool)",
      deployer.address,
    );

    await riskOracle.addAuthorizedSender(deployer.address);
    await riskOracle.addUpdateType("supplyCap");
    await riskOracle.addUpdateType("borrowCap");

    await riskStewardReceiver.setRiskParameterConfig(
      "supplyCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );
    await riskStewardReceiver.setRiskParameterConfig(
      "borrowCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );

    await riskStewardReceiver.setWhitelistedExecutor(executor.address, true);

    // Destination chain config and executor
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "borrowCap",
      destinationMarketCapsRiskSteward.address,
      SIX_HOURS,
    );
    await destinationRiskStewardReceiver.setWhitelistedExecutor(executor.address, true);
  };

  const riskStewardFixture = async () => {
    [deployer, unauthorizedSigner, executor] = await ethers.getSigners();

    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    const accessControlManager = await accessControlManagerFactory.deploy();

    // Core receiver factories
    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    DestinationStewardReceiverFactory = await ethers.getContractFactory("DestinationStewardReceiver");

    // Set up mock comptroller and markets
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    const MockCoreComptrollerFactory = await ethers.getContractFactory("MockCoreComptroller");
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");

    // Core markets
    mockCoreComptroller = await MockCoreComptrollerFactory.deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(mockCoreVToken.address);
    await mockCoreComptroller.setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller.setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);

    // Isolated markets
    mockComptroller = await MockComptrollerFactory.deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockComptroller.supportMarket(mockVToken.address);
    await mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    await mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);

    // Risk oracle
    RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
    riskOracle = await upgrades.deployProxy(RiskOracleFactory, [accessControlManager.address], {
      constructorArgs: [],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    // LayerZero endpoint mocks
    const artifactPath = path.join(
      __dirname,
      "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
    );
    const endpointArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const EndpointFactory = new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer);

    const localEndpointV2 = await EndpointFactory.deploy(BSC_LZV2_CHAIN_ID);
    const remoteEndpointV2 = await EndpointFactory.deploy(ETHEREUM_LZV2_CHAIN_ID);

    // Receivers
    riskStewardReceiver = await upgrades.deployProxy(
      RiskStewardReceiverFactory,
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [riskOracle.address, localEndpointV2.address, BSC_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    // fund riskStewardReceiver for bridge fees
    await deployer.sendTransaction({
      to: riskStewardReceiver.address,
      value: ethers.utils.parseEther("2.0"),
    });

    destinationRiskStewardReceiver = await upgrades.deployProxy(
      DestinationStewardReceiverFactory,
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [remoteEndpointV2.address, ETHEREUM_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    // Bridge wiring
    await deployAndConfigureBridge(localEndpointV2, remoteEndpointV2);

    // Market caps stewards
    const deltaBps50 = 5000; // 50%
    MarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    marketCapsRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address, deltaBps50],
      {
        constructorArgs: [riskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    destinationMarketCapsRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address, deltaBps50],
      {
        constructorArgs: [destinationRiskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await setupPermissionsAndConfigs(accessControlManager);
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Risk Parameter Updates E2E", async function () {
    it("should process SuppllyCap Update", async function () {
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await riskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "supplyCap",
        mockCoreVToken.address,
        "0x",
        0,
      );

      await expect(await riskStewardReceiver.processUpdate(1))
        .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
        .withArgs(mockCoreVToken.address, parseUnits("10", 18));

      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
    });

    it("should register and then execute BorrowCap update when change exceeds safe delta and decreases value", async function () {
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await riskOracle.publishRiskParameterUpdate(
        "ipfs://QmBorrowCapHighDeltaDecrease",
        parseUnitsToHex(3),
        "borrowCap",
        mockCoreVToken.address,
        "0x",
        0,
      );

      // Not safe for direct execution, so this should only register the update
      await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

      // Move forward in time past the timelock
      await time.increase(SIX_HOURS + 1);

      await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
        .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
        .withArgs(mockCoreVToken.address, parseUnits("3", 18));

      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("3", 18));
    });

    it("should send remote BorrowCap update to destination chain", async function () {
      // Initial local caps on core market
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      await riskOracle.publishRiskParameterUpdate(
        "ipfs://QmBorrowCapRemoteUpdate",
        parseUnitsToHex(12),
        "borrowCap",
        mockCoreVToken.address,
        "0x",
        ETHEREUM_LZV2_CHAIN_ID,
      );

      // For remote updates, the receiver should forward the update and not touch local caps
      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(riskStewardReceiver, "UpdateSentToDestination")
        .withArgs(1, ETHEREUM_LZV2_CHAIN_ID, "borrowCap", mockCoreVToken.address);

      // Local caps remain unchanged on the origin chain
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

      // Destination receiver should have the bridged update registered
      const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate("borrowCap", mockCoreVToken.address);
      expect(destUpdate.update.updateId).to.equal(1);

      // Move time forward on destination past the remote delay
      await time.increase(SIX_HOURS + 1);

      await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
        .to.emit(destinationMarketCapsRiskSteward, "BorrowCapUpdated")
        .withArgs(mockCoreVToken.address, parseUnits("12", 18));

      // After destination execution, caps should reflect the new remote value
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("12", 18));
    });
  });
});
