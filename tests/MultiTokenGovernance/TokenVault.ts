import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

import { AccessControlManager, MockToken, TokenVault } from "../../typechain";

describe("TokenVault", async () => {
  let deployer: SignerWithAddress;
  let signer1: SignerWithAddress;
  let tokenVault: TokenVault;
  let accessControl: AccessControlManager;
  let token: MockToken;
  let amount: BigNumber;

  const tokenVaultFixture = async () => {
    [deployer, signer1] = await ethers.getSigners();
    amount = parseUnits("10", 18);
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControl = await accessControlManagerFactory.deploy();

    const tokenFactory = await ethers.getContractFactory("MockToken");
    token = await tokenFactory.deploy("MockToken", "MT", 18);
    const tokenVaultFactory = await ethers.getContractFactory("TokenVault");
    tokenVault = await upgrades.deployProxy(tokenVaultFactory, [accessControl.address], {
      constructorArgs: [token.address, false, 10512000],
      initializer: "initialize",
      unsafeAllow: ["constructor"],
    });

    // Give permission

    let tx = await accessControl.giveCallPermission(tokenVault.address, "setLockPeriod(uint128)", deployer.address);
    await tx.wait();

    tx = await accessControl.giveCallPermission(tokenVault.address, "pause()", deployer.address);
    await tx.wait();

    tx = await accessControl.giveCallPermission(tokenVault.address, "unpause()", deployer.address);
    await tx.wait();

    await tokenVault.setLockPeriod(300);
    await token.faucet(parseUnits("100", 18));
  };

  beforeEach("Configure Vault", async () => {
    await loadFixture(tokenVaultFixture);
  });

  describe("Deposit", async () => {
    it("User can deposit token", async () => {
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(amount)).to.emit(tokenVault, "Deposit");
      expect(await token.balanceOf(tokenVault.address)).equals(amount);
    });
    it("Reverts if zero amount is given ", async () => {
      await expect(tokenVault.deposit(0)).to.be.revertedWithCustomError(tokenVault, "ZeroAmountNotAllowed");
    });
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.deposit(amount)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Delegate", async () => {
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.delegate(signer1.address)).to.be.revertedWith("Pausable: paused");
    });
    it("Delegate successfully", async () => {
      expect(await tokenVault.delegates(deployer.address)).to.equals(ethers.constants.AddressZero);
      await expect(tokenVault.delegate(signer1.address)).to.emit(tokenVault, "DelegateChangedV2");
      const amount = parseUnits("10", 18);
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(amount)).to.emit(tokenVault, "Deposit");
      expect(await tokenVault.numCheckpoints(signer1.address)).equals(1);
      expect((await tokenVault.checkpoints(signer1.address, 0))[1]).equals(amount);
      let latestBlock = (await ethers.provider.getBlock("latest")).number;
      await mine();
      expect(await tokenVault.getPriorVotes(signer1.address, latestBlock)).equals(amount);
      expect(await tokenVault.getPriorVotes(deployer.address, latestBlock)).equals(0);
      await token.approve(tokenVault.address, amount);

      // Deposit again
      await expect(tokenVault.deposit(amount)).to.emit(tokenVault, "Deposit");
      expect(await tokenVault.numCheckpoints(signer1.address)).equals(2);
      expect((await tokenVault.checkpoints(signer1.address, 1))[1]).equals(amount.mul(2));
      latestBlock = (await ethers.provider.getBlock("latest")).number;
      await mine();
      expect(await tokenVault.getPriorVotes(signer1.address, latestBlock)).equals(amount.mul(2));
      expect(await tokenVault.getPriorVotes(deployer.address, latestBlock)).equals(0);
    });
  });
  describe("Withdraw", async () => {
    it("Withdraw tokens", async () => {
      const amount = parseUnits("10", 18);
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(amount)).to.emit(tokenVault, "Deposit");
      expect(await token.balanceOf(deployer.address)).equals(parseUnits("90", 18));
      await expect(tokenVault.requestWithdrawal(amount)).to.emit(tokenVault, "RequestedWithdrawal");
      await expect(tokenVault.executeWithdrawal()).to.be.revertedWith("nothing to withdraw");
      await mine(300);
      await expect(tokenVault.executeWithdrawal()).to.emit(tokenVault, "ExecutedWithdrawal");
      expect(await token.balanceOf(deployer.address)).equals(parseUnits("100", 18));
      expect(await token.balanceOf(tokenVault.address)).equals(0);
    });
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.requestWithdrawal(amount)).to.be.revertedWith("Pausable: paused");
      await expect(tokenVault.executeWithdrawal()).to.be.revertedWith("Pausable: paused");
    });
    it("Reverts if zero amount is passed for withdrawal", async () => {
      await expect(tokenVault.requestWithdrawal(0)).to.be.revertedWithCustomError(tokenVault, "ZeroAmountNotAllowed");
    });
    it("User cannot withdrawal more than deposit", async () => {
      await expect(tokenVault.requestWithdrawal(amount)).to.be.revertedWithCustomError(tokenVault, "InvalidAmount");
    });
  });
});
