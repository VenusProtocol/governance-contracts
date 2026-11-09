import { expect } from "chai";
import { ethers } from "ethers";

import { STARTING_BLOCKS, acmAddress, isLegacyAcm, rpcUrl } from "../../scripts/acm-permissions/config";
import { NETWORKS } from "../../scripts/acm-permissions/types";

describe("acm-permissions config", () => {
  it("has 16 networks, no hardhat", () => {
    expect(NETWORKS).to.have.length(16);
    expect(NETWORKS).to.not.include("hardhat");
  });
  it("has a starting block and RPC for every network", () => {
    for (const n of NETWORKS) {
      expect(STARTING_BLOCKS[n], n).to.be.a("number").greaterThan(0);
      expect(rpcUrl(n), n).to.match(/^https?:\/\//);
    }
  });
  it("resolves a checksummed ACM address for every network", () => {
    for (const n of NETWORKS) {
      const a = acmAddress(n);
      expect(a, n).to.equal(ethers.utils.getAddress(a));
    }
  });
  it("flags only bscmainnet as legacy", () => {
    expect(isLegacyAcm("bscmainnet")).to.equal(true);
    expect(isLegacyAcm("ethereum")).to.equal(false);
  });
});
