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
    tokenVault = await upgrades.deployProxy(tokenVaultFactory, [accessControl.address, token.address], {
      constructorArgs: [false, 10512000],
      initializer: "initialize",
      unsafeAllow: ["constructor"],
    });

    await tokenVault.setLockPeriod(token.address, 300);
    await token.faucet(parseUnits("100", 18));

    // Give permission
    let tx = await accessControl.giveCallPermission(tokenVault.address, "updateTokens(address,bool)", deployer.address);
    await tx.wait();
    tx = await accessControl.giveCallPermission(tokenVault.address, "setLockPeriod(address,uint128)", deployer.address);
    await tx.wait();

    tx = await accessControl.giveCallPermission(tokenVault.address, "pause()", deployer.address);
    await tx.wait();

    tx = await accessControl.giveCallPermission(tokenVault.address, "unpause()", deployer.address);
    await tx.wait();
  };

  beforeEach("Configure Vault", async () => {
    await loadFixture(tokenVaultFixture);
  });

  describe("Deposit", async () => {
    it("User can deposit registered token", async () => {
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(token.address, amount)).to.emit(tokenVault, "Deposit");
      expect(await token.balanceOf(tokenVault.address)).equals(amount);
    });
    it("Reverts if token is not registered or zero amount is given ", async () => {
      const tokenFactory = await ethers.getContractFactory("MockToken");
      const dummyToken = await tokenFactory.deploy("DUMMY_Token", "DUMMY", 18);
      await expect(tokenVault.deposit(dummyToken.address, amount)).to.be.revertedWithCustomError(
        tokenVault,
        "UnregisteredToken",
      );
      await expect(tokenVault.deposit(token.address, 0)).to.be.revertedWithCustomError(
        tokenVault,
        "ZeroAmountNotAllowed",
      );
    });
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.deposit(token.address, amount)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Delegate", async () => {
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.delegate(signer1.address, token.address)).to.be.revertedWith("Pausable: paused");
    });
    it("Reverts if token is not registered", async () => {
      const tokenFactory = await ethers.getContractFactory("MockToken");
      const dummyToken = await tokenFactory.deploy("DUMMY_Token", "DUMMY", 18);
      await expect(tokenVault.delegate(signer1.address, dummyToken.address)).to.be.revertedWithCustomError(
        tokenVault,
        "UnregisteredToken",
      );
    });
    it("Delegate successfully", async () => {
      expect(await tokenVault.delegates(deployer.address)).to.equals(ethers.constants.AddressZero);
      await expect(tokenVault.delegate(signer1.address, token.address)).to.emit(tokenVault, "DelegateChangedV2");
      const amount = parseUnits("10", 18);
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(token.address, amount)).to.emit(tokenVault, "Deposit");
      expect(await tokenVault.numCheckpoints(token.address, signer1.address)).equals(1);
      expect((await tokenVault.checkpoints(token.address, signer1.address, 0))[1]).equals(amount);
      let latestBlock = (await ethers.provider.getBlock("latest")).number;
      await mine();
      expect(await tokenVault.getPriorVotes(signer1.address, latestBlock, token.address)).equals(amount);
      expect(await tokenVault.getPriorVotes(deployer.address, latestBlock, token.address)).equals(0);
      await token.approve(tokenVault.address, amount);

      // Deposit again
      await expect(tokenVault.deposit(token.address, amount)).to.emit(tokenVault, "Deposit");
      expect(await tokenVault.numCheckpoints(token.address, signer1.address)).equals(2);
      expect((await tokenVault.checkpoints(token.address, signer1.address, 1))[1]).equals(amount.mul(2));
      latestBlock = (await ethers.provider.getBlock("latest")).number;
      await mine();
      expect(await tokenVault.getPriorVotes(signer1.address, latestBlock, token.address)).equals(amount.mul(2));
      expect(await tokenVault.getPriorVotes(deployer.address, latestBlock, token.address)).equals(0);
    });
  });
  describe("Withdraw", async () => {
    it("Withdraw tokens", async () => {
      const amount = parseUnits("10", 18);
      await token.approve(tokenVault.address, amount);
      await expect(tokenVault.deposit(token.address, amount)).to.emit(tokenVault, "Deposit");
      expect(await token.balanceOf(deployer.address)).equals(parseUnits("90", 18));
      await expect(tokenVault.requestWithdrawal(token.address, amount)).to.emit(tokenVault, "RequestedWithdrawal");
      await expect(tokenVault.executeWithdrawal(token.address)).to.be.revertedWith("nothing to withdraw");
      await mine(300);
      await expect(tokenVault.executeWithdrawal(token.address)).to.emit(tokenVault, "ExecutedWithdrawal");
      expect(await token.balanceOf(deployer.address)).equals(parseUnits("100", 18));
      expect(await token.balanceOf(tokenVault.address)).equals(0);
    });
    it("Reverts if vault is paused", async () => {
      await tokenVault.pause();
      await expect(tokenVault.requestWithdrawal(token.address, amount)).to.be.revertedWith("Pausable: paused");
      await expect(tokenVault.executeWithdrawal(token.address)).to.be.revertedWith("Pausable: paused");
    });
    it("Reverts if token is not registered", async () => {
      const tokenFactory = await ethers.getContractFactory("MockToken");
      const dummyToken = await tokenFactory.deploy("DUMMY_Token", "DUMMY", 18);
      await expect(tokenVault.requestWithdrawal(dummyToken.address, amount)).to.be.revertedWithCustomError(
        tokenVault,
        "UnregisteredToken",
      );
      await expect(tokenVault.executeWithdrawal(dummyToken.address)).to.be.revertedWithCustomError(
        tokenVault,
        "UnregisteredToken",
      );
    });
    it("Reverts if zero amount is passed for withdrawal", async () => {
      await expect(tokenVault.requestWithdrawal(token.address, 0)).to.be.revertedWithCustomError(
        tokenVault,
        "ZeroAmountNotAllowed",
      );
    });
    it("User cannot withdrawal more than deposit", async () => {
      await expect(tokenVault.requestWithdrawal(token.address, amount)).to.be.revertedWithCustomError(
        tokenVault,
        "InvalidAmount",
      );
    });
  });
  describe("Update Tokens", async () => {
    it("should update tokens", async () => {
      const tokenFactory = await ethers.getContractFactory("MockToken");
      const newToken = await tokenFactory.deploy("New_Token", "NT", 18);
      await expect(tokenVault.updateTokens(newToken.address, true)).to.emit(tokenVault, "UpdateTokens");
      expect(await tokenVault.tokens(newToken.address)).to.be.true;
      await expect(tokenVault.updateTokens(newToken.address, false)).to.emit(tokenVault, "UpdateTokens");
      expect(await tokenVault.tokens(newToken.address)).to.be.false;
    });
    it("should revert if tokens are updated by unauthorised user", async () => {
      const tokenFactory = await ethers.getContractFactory("MockToken");
      const newToken = await tokenFactory.deploy("New_Token", "NT", 18);
      await expect(tokenVault.connect(signer1).updateTokens(newToken.address, true)).to.be.revertedWithCustomError(
        tokenVault,
        "Unauthorized",
      );
    });
  });
});
