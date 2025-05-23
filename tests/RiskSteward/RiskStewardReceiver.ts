import { Options } from "@layerzerolabs/lz-v2-utilities";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import {
  LZEndpointMock,
  MarketCapsRiskSteward,
  MarketCapsRiskSteward__factory,
  MockComptroller,
  MockCoreComptroller,
  MockRiskOracle,
  MockRiskOracle__factory,
  MockVToken,
  RiskStewardDestinationReceiver,
  RiskStewardDestinationReceiver__factory,
  RiskStewardOwner,
  RiskStewardReceiver,
  RiskStewardReceiver__factory,
} from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;

async function updateFunctionRegistry(stewardOwner: RiskStewardOwner, isDestRegistry: boolean) {
  const functionRegistry = [
    "setRiskParameterConfig(string,address)",
    "toggleConfigActive(string)",
    "pause()",
    "unpause()",
  ];

  if (isDestRegistry) {
    functionRegistry.push("setRemoteDelay(uint256)");
    functionRegistry.push("setGuardian(address)");
  }

  const activeArray = new Array(functionRegistry.length).fill(true);
  await stewardOwner.upsertSignature(functionRegistry, activeArray);
}

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    RiskStewardReceiverFactory: RiskStewardReceiver__factory,
    RiskStewardDestinationFactory: RiskStewardDestinationReceiver__factory,
    MockRiskOracleFactory: MockRiskOracle__factory,
    MarketCapsRiskStewardFactory: MarketCapsRiskSteward__factory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    marketCapsDestRiskSteward: MarketCapsRiskSteward,
    remoteEndpoint: LZEndpointMock,
    localEndpoint: LZEndpointMock,
    riskStewardDestReceiver: RiskStewardDestinationReceiver,
    stewardOwner: RiskStewardOwner,
    destStewardOwner: RiskStewardOwner,
    data: string;
  const localChainId = 1;
  const remoteChainId = 2;
  const addressZero = "0x0000000000000000000000000000000000000000";

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    data = ethers.utils.defaultAbiCoder.encode(["address", "uint16"], [deployer.address, localChainId]);

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

    mockComptroller.supportMarket(mockVToken.address);
    mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);
    MockRiskOracleFactory = await ethers.getContractFactory("MockRiskOracle");
    MarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    mockRiskOracle = (await MockRiskOracleFactory.deploy(
      "MockRiskOracle",
      [deployer.address],
      ["supplyCap", "borrowCap", "RandomUpdateType"],
    )) as MockRiskOracle;

    // Layer zero configuration

    const artifactPath = path.join(
      __dirname,
      "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
    );
    const endpointArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const EndpointFactory = new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer);
    localEndpoint = await EndpointFactory.deploy(localChainId);
    remoteEndpoint = await EndpointFactory.deploy(remoteChainId);

    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    RiskStewardDestinationFactory = await ethers.getContractFactory("RiskStewardDestinationReceiver");
    riskStewardReceiver = await RiskStewardReceiverFactory.deploy(
      mockRiskOracle.address,
      localChainId,
      localEndpoint.address,
      deployer.address,
    );
    riskStewardDestReceiver = await RiskStewardDestinationFactory.deploy(
      remoteEndpoint.address,
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

    // Market Cap Risk Steward on destination chain
    marketCapsDestRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000, DAY_AND_ONE_SECOND],
      {
        constructorArgs: [riskStewardDestReceiver.address, mockCoreComptroller.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setMaxDeltaBps(uint256)",
      deployer.address,
    );

    await riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address);
    await riskStewardReceiver.setRiskParameterConfig("borrowCap", marketCapsRiskSteward.address);

    await riskStewardDestReceiver.setRiskParameterConfig("supplyCap", marketCapsDestRiskSteward.address);
    await riskStewardDestReceiver.setRiskParameterConfig("borrowCap", marketCapsDestRiskSteward.address);

    await localEndpoint.setDestLzEndpoint(riskStewardDestReceiver.address, remoteEndpoint.address);
    await remoteEndpoint.setDestLzEndpoint(riskStewardReceiver.address, localEndpoint.address);

    await riskStewardReceiver.setPeer(remoteChainId, ethers.utils.hexZeroPad(riskStewardDestReceiver.address, 32));
    await riskStewardDestReceiver.setPeer(localChainId, ethers.utils.hexZeroPad(riskStewardReceiver.address, 32));

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

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(addressZero, "setRiskParameterConfig(string,address)", deployer.address);
    await accessControlManager
      .connect(deployer)
      .giveCallPermission(addressZero, "toggleConfigActive(string)", deployer.address);
    await accessControlManager.connect(deployer).giveCallPermission(addressZero, "pause()", deployer.address);
    await accessControlManager.connect(deployer).giveCallPermission(addressZero, "unpause()", deployer.address);

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(addressZero, "setRemoteDelay(uint256)", deployer.address);
    await accessControlManager
      .connect(deployer)
      .giveCallPermission(addressZero, "setGuardian(address)", deployer.address);
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

  describe("Risk steward receiver", () => {
    describe("Access Control", async function () {
      it("should revert if called by non-owner", async function () {
        await expect(
          riskStewardReceiver.connect(signer1).setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address),
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
        await expect(
          marketCapsRiskSteward
            .connect(signer1)
            .processUpdate(1, parseUnits("100", 18), "supplyCap", mockCoreVToken.address),
        ).to.be.rejectedWith("OnlyRiskStewardReceiver()");
      });

      it("should revert if access is not granted for setting max increase bps", async function () {
        await expect(marketCapsRiskSteward.connect(signer1).setMaxDeltaBps(1)).to.be.rejectedWith(
          'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x68B1D87F95878fE05B998F19b66F4baba5De1aed", "setMaxDeltaBps(uint256)")',
        );
      });
    });

    describe("Upgradeable", async function () {
      it("new implementation should updaterisk steward", async function () {
        const riskStewardUpdatedAddress = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
        await upgrades.upgradeProxy(marketCapsRiskSteward, MarketCapsRiskStewardFactory, {
          constructorArgs: [riskStewardUpdatedAddress, mockCoreComptroller.address],
          unsafeAllow: ["state-variable-immutable"],
        });
        expect(await marketCapsRiskSteward.RISK_STEWARD_RECEIVER()).to.equal(riskStewardUpdatedAddress);
      });
    });

    describe("Risk Parameter Config", async function () {
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
          addressZero,
        ]);

        await expect(
          deployer.sendTransaction({
            to: stewardOwner.address,
            data: callData,
          }),
        ).to.be.reverted;
      });

      it("should revert if maxDeltaBps is 0", async function () {
        await expect(marketCapsRiskSteward.setMaxDeltaBps(0)).to.be.rejectedWith("InvalidMaxDeltaBps");
      });

      it("should revert if maxDeltaBps is 10000 or greater", async function () {
        await expect(marketCapsRiskSteward.setMaxDeltaBps(10001)).to.be.rejectedWith("InvalidMaxDeltaBps");
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
    });

    describe("Risk Parameter Update Reverts under incorrect conditions", async function () {
      it("should revert if updateType is unknown", async function () {
        await expect(
          mockRiskOracle.publishRiskParameterUpdate(
            "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
            parseUnitsToHex(10),
            "UnknownUpdateType",
            mockVToken.address,
            "0x",
          ),
        ).to.be.revertedWith("Unauthorized update type.");
      });

      it("should revert if updateType is implemented", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "RandomUpdateType",
          mockVToken.address,
          "0x",
        );
        const callData = riskStewardReceiver.interface.encodeFunctionData("setRiskParameterConfig", [
          "RandomUpdateType",
          marketCapsRiskSteward.address,
        ]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        }),
          await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.rejectedWith("UnsupportedUpdateType");
      });

      it("should revert if updateType is not active", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          data,
        );
        let callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["supplyCap"]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        }),
          await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
            .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
            .withArgs(1, 3);

        callData = riskStewardReceiver.interface.encodeFunctionData("toggleConfigActive", ["borrowCap"]);

        await deployer.sendTransaction({
          to: stewardOwner.address,
          data: callData,
        }),
          await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
            .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
            .withArgs(2, 3);
      });

      it("should revert if the update is expired", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await time.increase(60 * 60 * 24 + 2);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 4);
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 4);
      });

      it("should revert if market is not supported", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreComptroller.address,
          "0x",
        );
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.reverted;

        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockCoreComptroller.address,
          "0x",
        );
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0)).to.be.reverted;
      });

      it("should revert if the update is too frequent", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(12),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 5);

        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(3, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed")
          .withArgs(3);

        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(12),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(4, 5);
      });

      it("should error on invalid update ID", async function () {
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0)).to.be.revertedWith("Invalid update ID.");
      });

      it("should revert if the update has already been applied", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 1);
      });

      it("should revert if the update is out of bounds", async function () {
        // Too low
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(2),
          "supplyCap",
          mockCoreVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 5);

        // Too high
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(20),
          "supplyCap",
          mockCoreVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(2, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(2, 5);

        // Too Low
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(2),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(3, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(3, 5);

        // Too high
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(20),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(4, 5);
      });

      it("should revert if the update id is not the latest", async function () {
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(1, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateFailed")
          .withArgs(1, 4);
      });
    });

    describe("Risk Parameter Updates under correct conditions", async function () {
      it("should process update by id", async function () {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockCoreVToken.address,
          data,
        );
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
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateById(3, "0x", 0))
          .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
          .withArgs(mockVToken.address, parseUnits("10", 18));
        await expect(riskStewardReceiver.processUpdateById(4, "0x", 0))
          .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(mockVToken.address, parseUnits("10", 18));
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      });

      it("should process increase updates by parameter and market", async function () {
        // Core Pool
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockCoreVToken.address,
          data,
        );
        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockCoreVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockCoreVToken.address, "0x", 0);
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
        // Isolated Pool
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, "0x", 0);
        await riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, "0x", 0);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      });
      it("ShouldProcess multiple ids", async function () {
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdatesByIds([1, 2], "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
      });

      it("should process decrease updates by parameter and market", async function () {
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "supplyCap",
          mockVToken.address,
          data,
        );
        await mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnitsToHex(6),
          "borrowCap",
          mockVToken.address,
          data,
        );
        await expect(riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, "0x", 0))
          .to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, "0x", 0),
        ).to.emit(riskStewardReceiver, "RiskParameterUpdateProcessed");
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
      });
    });
  });
  describe("RiskStewardDestinationReceiver", async function () {
    describe("Supply cap update on remote chain", () => {
      it("Should send update to destination and update the status with SEND_TO_CHAIN", async () => {
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, remoteChainId],
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

        // LayerZero options and quote
        const options = Options.newOptions().addExecutorLzReceiveOption(1_000_000, 0).toBytes();
        const [nativeFee] = await riskStewardReceiver.quote(remoteChainId, payload, options, false);

        // Send the update via source chain
        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(remoteChainId, 1);

        // Received on destination
        expect(await riskStewardDestReceiver.processedUpdates(1)).to.equal(1); // RECEIVED

        await time.increase(6 * 3600 + 1); // increase 6 hours and one minute
        await expect(riskStewardDestReceiver.processUpdate(1))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(1);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
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
        const callData = riskStewardDestReceiver.interface.encodeFunctionData("setGuardian", [
          ethers.constants.AddressZero,
        ]);
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
          [deployer.address, remoteChainId],
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
        const [nativeFee] = await riskStewardReceiver.quote(remoteChainId, payload, options, false);

        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("supplyCap", mockVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(remoteChainId, 1);

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
        await expect(riskStewardDestReceiver.processUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(updateId);
        expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("6", 18));
        await expect(riskStewardDestReceiver.connect(deployer).cancelUpdate(123)).to.be.revertedWith(
          "Status not compatible",
        );
      });
    });
    describe("processUpdate", function () {
      const updateId = 1;
      beforeEach(async () => {
        const remoteData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint16"],
          [deployer.address, remoteChainId],
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
        const [nativeFee] = await riskStewardReceiver.quote(remoteChainId, payload, options, false);

        await expect(
          riskStewardReceiver.processUpdateByParameterAndMarket("borrowCap", mockVToken.address, options, 0, {
            value: nativeFee,
          }),
        )
          .to.emit(riskStewardReceiver, "RiskParameterUpdateSend")
          .withArgs(remoteChainId, 1);

        // Received on destination
        expect(await riskStewardDestReceiver.processedUpdates(1)).to.equal(1); // RECEIVED
      });

      it("reverts if delay not surpassed", async function () {
        await expect(riskStewardDestReceiver.processUpdate(updateId)).to.be.revertedWith("Delay has to be surpassed");
      });

      it("processes a valid update after delay", async function () {
        await time.increase(6 * 3600 + 1);

        await expect(riskStewardDestReceiver.processUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateProcessed")
          .withArgs(updateId);

        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(2); // PROCESSED
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

        await expect(riskStewardDestReceiver.processUpdate(updateId))
          .to.emit(riskStewardDestReceiver, "RiskParameterUpdateFailed")
          .withArgs(updateId, 3); // CONFIG_NOT_ACTIVE

        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(3);
      });

      it("emits RiskParameterUpdateFailed if expired", async function () {
        await time.increase(2 * 24 * 3600 + 1); // 2 days + 1s
        await expect(riskStewardDestReceiver.processUpdate(updateId)).to.emit(
          riskStewardDestReceiver,
          "RiskParameterUpdateFailed",
        );
        expect(await riskStewardDestReceiver.processedUpdates(updateId)).to.equal(4); // EXPIRED
      });
    });
  });
});
