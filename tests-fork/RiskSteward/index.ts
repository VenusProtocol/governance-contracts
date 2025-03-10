import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import * as hardhat from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { LZ_CHAINID, SUPPORTED_NETWORKS } from "../../helpers/deploy/constants";
import { getOmnichainProposalSender, guardian } from "../../helpers/deploy/deploymentUtils";
import { fundAccount, impersonateSigner, releaseImpersonation, setForkBlock } from "../../helpers/utils";
import {
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockRiskOracle,
  MockVToken,
  OmnichainProposalSender,
  RiskStewardReceiver,
} from "../../typechain";
import { getForkBlock } from "../constants";

const { ethers, upgrades, deployments, artifacts } = hardhat;

const { parseUnits, hexValue, defaultAbiCoder } = ethers.utils;

const parseUnitsToHex = (value: string) => {
  console.log(value.toString());
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value, 18))), 32);
};

const vUSDCStablecoinBaseSepolia = "0xA31D67c056Aadc2501535f2776bF1157904f810e";
const vUSDCStablecoinSupplyCapBaseSepolia = BigNumber.from("150000000000");
const vUSDCStablecoinBorrowCapBaseSepolia = BigNumber.from("130000000000");

const vUSDTStablecoinArbitrumSepolia = "0xdEFbf0F9Ab6CdDd0a1FdDC894b358D0c0a39B052";
const vUSDTStablecoinSupplyCapArbitrumSepolia = BigNumber.from("150000000000");
const vUSDTStablecoinBorrowCapArbitrumSepolia = BigNumber.from("130000000000");

const vWETHStablecoinSepolia = "0xc2931B1fEa69b6D6dA65a50363A8D75d285e4da9";
const vWETHStablecoinSupplyCapSepolia = BigNumber.from("5500000000000000000000");
const vWETHStablecoinBorrowCapSepolia = BigNumber.from("4600000000000000000000");

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    MockRiskOracleFactory: ContractFactory,
    MockMarketCapsRiskStewardFactory: ContractFactory,
    vFDUSD: MockVToken,
    vFDUSDBorrowCap: BigNumber,
    vFDUSDSupplyCap: BigNumber,
    ilStablecoinComptroller: MockComptroller,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward;

  const riskStewardFixture = async () => {
    const { deploy } = deployments;
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];

    const networkName = process.env.FORKED_NETWORK as SUPPORTED_NETWORKS;

    const accessControlManager = await ethers.getContract("AccessControlManager");
    const corePoolComptroller = await ethers.getContract("Unitroller");

    const governorBravo = await ethers.getContract("GovernorBravoDelegator");
    const omnichainProposalSender = await ethers.getContract("OmnichainProposalSender");
    const layerZeroChainId = LZ_CHAINID[networkName];

    const defaultProxyAdmin = await artifacts.readArtifact(
      "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
    );

    mockRiskOracle = await deployments.deploy("MockRiskOracle", {
      from: deployer.address,
      args: ["Mock Risk Oracle", [deployer.address], ["supplyCap", "borrowCap"]],
      log: true,
      autoMine: true,
    });
    mockRiskOracle = await ethers.getContract("MockRiskOracle");

    await deploy("TestRiskStewardReceiver", {
      contract: "RiskStewardReceiver",
      from: deployer.address,
      log: true,
      deterministicDeployment: false,
      args: [mockRiskOracle.address, governorBravo.address, omnichainProposalSender.address, layerZeroChainId],
      proxy: {
        owner: await guardian(networkName),
        proxyContract: "OptimizedTransparentUpgradeableProxy",
        execute: {
          methodName: "initialize",
          args: [accessControlManager.address],
        },
        viaAdminContract: {
          name: "DefaultProxyAdmin",
          artifact: defaultProxyAdmin,
        },
      },
    });

    riskStewardReceiver = await ethers.getContract("TestRiskStewardReceiver");
    // borrow cap 4400000000000000000000000
    // supply cap 5500000000000000000000000
    vFDUSD = await ethers.getContract("vFDUSD");
    vFDUSDSupplyCap = await corePoolComptroller.supplyCaps(vFDUSD.address);
    vFDUSDBorrowCap = await corePoolComptroller.borrowCaps(vFDUSD.address);

    const marketCapsRiskSteward = await deploy("TestMarketCapsRiskSteward", {
      contract: "MarketCapsRiskSteward",
      from: deployer.address,
      log: true,
      deterministicDeployment: false,
      args: [corePoolComptroller.address, riskStewardReceiver.address, layerZeroChainId],
      proxy: {
        owner: await guardian(networkName),
        proxyContract: "OptimizedTransparentUpgradeableProxy",
        execute: {
          methodName: "initialize",
          args: [accessControlManager.address, 5000],
        },
        viaAdminContract: {
          name: "DefaultProxyAdmin",
          artifact: defaultProxyAdmin,
        },
      },
    });
    const normalTimelock = await ethers.getContract("NormalTimelock");

    const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
    await fundAccount(normalTimelock.address);

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        riskStewardReceiver.address,
        "setRiskParameterConfig(string,address,uint256)",
        deployer.address,
      );

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        marketCapsRiskSteward.address,
        "processUpdate(RiskParameterUpdate)",
        riskStewardReceiver.address,
      );

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(marketCapsRiskSteward.address, "setMaxIncreaseBps(uint256)", deployer.address);

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        corePoolComptroller.address,
        "_setMarketSupplyCaps(address[],uint256[])",
        marketCapsRiskSteward.address,
      );

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        corePoolComptroller.address,
        "_setMarketBorrowCaps(address[],uint256[])",
        marketCapsRiskSteward.address,
      );

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        "0x0000000000000000000000000000000000000000",
        "setMarketSupplyCaps(address[],uint256[])",
        marketCapsRiskSteward.address,
      );

    await accessControlManager
      .connect(normalTimelockSigner)
      .giveCallPermission(
        "0x0000000000000000000000000000000000000000",
        "setMarketBorrowCaps(address[],uint256[])",
        marketCapsRiskSteward.address,
      );

    await releaseImpersonation(normalTimelock.address);

    await riskStewardReceiver.setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, 5);
    await riskStewardReceiver.setRiskParameterConfig("borrowCap", marketCapsRiskSteward.address, 5);
  };

  before(async function () {
    await setForkBlock(getForkBlock());
  });

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);

    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vFDUSDSupplyCap.div(4).add(vFDUSDSupplyCap).toString()),
      "supplyCap",
      vFDUSD.address,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["bsctestnet"]],
      ),
    );

    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vFDUSDBorrowCap.div(4).add(vFDUSDBorrowCap).toString()),
      "borrowCap",
      vFDUSD.address,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["bsctestnet"]],
      ),
    );

    // Base sepolia
    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vUSDCStablecoinSupplyCapBaseSepolia.div(4).add(vUSDCStablecoinSupplyCapBaseSepolia).toString()),
      "supplyCap",
      vUSDCStablecoinBaseSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["basesepolia"]],
      ),
    );

    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vUSDCStablecoinBorrowCapBaseSepolia.div(4).add(vUSDCStablecoinBorrowCapBaseSepolia).toString()),
      "borrowCap",
      vUSDCStablecoinBaseSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["basesepolia"]],
      ),
    );
    // Arbitrum sepolia
    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(
        vUSDTStablecoinSupplyCapArbitrumSepolia.div(4).add(vUSDTStablecoinSupplyCapArbitrumSepolia).toString(),
      ),
      "supplyCap",
      vUSDTStablecoinArbitrumSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["arbitrumsepolia"]],
      ),
    );

    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(
        vUSDTStablecoinBorrowCapArbitrumSepolia.div(4).add(vUSDTStablecoinBorrowCapArbitrumSepolia).toString(),
      ),
      "borrowCap",
      vUSDTStablecoinArbitrumSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["arbitrumsepolia"]],
      ),
    );
    //Sepolia
    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vWETHStablecoinSupplyCapSepolia.div(4).add(vWETHStablecoinSupplyCapSepolia).toString()),
      "supplyCap",
      vWETHStablecoinSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["sepolia"]],
      ),
    );
    await mockRiskOracle.publishRiskParameterUpdate(
      "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
      parseUnitsToHex(vWETHStablecoinBorrowCapSepolia.div(4).add(vWETHStablecoinBorrowCapSepolia).toString()),
      "borrowCap",
      vWETHStablecoinSepolia,
      defaultAbiCoder.encode(
        ["address", "uint16"],
        ["0xcF27439fA231af9931ee40c4f27Bb77B83826F3C", LZ_CHAINID["sepolia"]],
      ),
    );
  });

  describe("Create Risk Parameter Update Proposals", async function () {
    it("should create a proposal grouping cross chain risk parameter updates", async function () {
      await riskStewardReceiver.processUpdatesByIds([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe("Risk Parameter Config", async function () {});

  describe("Risk Steward Pause", async function () {});

  describe("Risk Parameter Update Reverts under incorrect conditions", async function () {});

  describe("Risk Parameter Updates under correct conditions", async function () {});
});
