import chai from "chai";
import { ethers } from "hardhat";

import { fundAccount, impersonateSigner, releaseImpersonation } from "../../../helpers/utils";

const { expect } = chai;

describe("TimelockV8 Tests", () => {
  let deployer;
  let timelockFactory;
  let timelock;
  let testTimelockFactory;
  let testTimelock;

  before(async () => {
    [deployer] = await ethers.getSigners();
    timelockFactory = await ethers.getContractFactory("TimelockV8");
    timelock = await timelockFactory.deploy(deployer.address, 4000);

    testTimelockFactory = await ethers.getContractFactory("TestTimelockV8");
    testTimelock = await testTimelockFactory.deploy(deployer.address, 10);
  });

  it("Production timelock returns constant values", async () => {
    expect(await timelock.GRACE_PERIOD()).to.equal("1209600");
    expect(await timelock.MINIMUM_DELAY()).to.equal("3600");
    expect(await timelock.MAXIMUM_DELAY()).to.equal("2592000");
  });

  it("Production timelock requires setting appropriate delay", async () => {
    await fundAccount(timelock.address);

    const timelockSigner = await impersonateSigner(timelock.address);

    await expect(timelock.connect(timelockSigner).setDelay("5000")).to.emit(timelock, "NewDelay").withArgs("5000");

    await expect(timelock.connect(timelockSigner).setDelay("1000")).to.be.revertedWith(
      "Timelock::setDelay: Delay must exceed minimum delay.",
    );

    await expect(timelock.connect(timelockSigner).setDelay("5000000")).to.be.revertedWith(
      "Timelock::setDelay: Delay must not exceed maximum delay.",
    );

    await releaseImpersonation(timelock.address);
  });

  it("Production timelock does not allow a null address", async () => {
    await expect(timelockFactory.deploy("0x0000000000000000000000000000000000000000", 4000)).to.be.rejectedWith(
      "ZeroAddressNotAllowed()",
    );

    await fundAccount(timelock.address);
    const timelockSigner = await impersonateSigner(timelock.address);

    await expect(
      timelock.connect(timelockSigner).setPendingAdmin("0x0000000000000000000000000000000000000000"),
    ).to.be.rejectedWith("ZeroAddressNotAllowed()");

    await releaseImpersonation(timelock.address);
  });

  it("Test Timelock returns 1 for constants", async () => {
    expect(await testTimelock.GRACE_PERIOD()).to.equal("1");
    expect(await testTimelock.MINIMUM_DELAY()).to.equal("1");
    expect(await testTimelock.MAXIMUM_DELAY()).to.equal("3600");
  });

  it("Test Timelock allows setting low delay", async () => {
    await fundAccount(testTimelock.address);

    const timelockSigner = await impersonateSigner(testTimelock.address);

    expect(await testTimelock.connect(timelockSigner).setDelay("10"))
      .to.emit(testTimelock, "NewDelay")
      .withArgs("10");

    await releaseImpersonation(testTimelock.address);
  });

  it("Test timelock does not allow a null address", async () => {
    await expect(testTimelockFactory.deploy("0x0000000000000000000000000000000000000000", 10)).to.be.rejectedWith(
      "ZeroAddressNotAllowed()",
    );

    const timelockSigner = await impersonateSigner(testTimelock.address);

    await expect(
      testTimelock.connect(timelockSigner).setPendingAdmin("0x0000000000000000000000000000000000000000"),
    ).to.be.rejectedWith("ZeroAddressNotAllowed()");

    await releaseImpersonation(testTimelock.address);
  });
});
