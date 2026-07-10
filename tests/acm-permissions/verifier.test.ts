import { expect } from "chai";

import { checkOnChain, verifyAll, verifyDiff } from "../../scripts/acm-permissions/core/verifier";
import { DiffEntry, SnapshotDiff, SnapshotState } from "../../scripts/acm-permissions/types";

const entry = (o: Partial<DiffEntry>): DiffEntry => ({
  roleHash: "0xr1",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  account: "0xA",
  txHash: "0xt",
  ...o,
});
const fakeAcm = (grantedPairs: Set<string>) => ({
  hasPermission: async (a: string, c: string, s: string) => grantedPairs.has(`${a}|${c}|${s}`),
  hasRole: async (r: string, a: string) => grantedPairs.has(`${r}|${a}`),
});

describe("verifier", () => {
  it("routes modern entries to hasPermission and legacy/undecoded to hasRole", async () => {
    const acm = fakeAcm(new Set(["0xA|0xC|pause()", "0xdead|0xA"]));
    expect(await checkOnChain(acm, "ethereum", entry({}))).to.equal(true);
    expect(await checkOnChain(acm, "bscmainnet", entry({ roleHash: "0xdead" }))).to.equal(true);
    expect(await checkOnChain(acm, "bscmainnet", entry({ roleHash: "0xother" }))).to.equal(false);
  });
  it("verifyDiff corrects state to match chain and reports corrections", async () => {
    // chain says: the "added" grant does NOT exist, and the "removed" one still exists
    const acm = fakeAcm(new Set(["0xB|0xC|unpause()"]));
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: ["0xt"],
      },
    };
    const diff: SnapshotDiff = {
      added: [entry({})], // false add → must be removed
      removed: [entry({ roleHash: "0xr2", functionSig: "unpause()", account: "0xB" })],
    }; // false remove → restore
    const corrections = await verifyDiff(acm, "ethereum", diff, state);
    expect(corrections).to.have.length(2);
    expect(state["0xr1"]).to.equal(undefined); // false add corrected away (last grantee removed)
    expect(state["0xr2"].grantees).to.deep.equal(["0xB"]); // false remove restored
    expect(corrections[0]).to.deep.include({ replaySaid: "added", chainSays: "not-granted" });
  });
  it("verifyDiff returns [] when chain agrees", async () => {
    const acm = fakeAcm(new Set(["0xA|0xC|pause()"]));
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    };
    expect(await verifyDiff(acm, "ethereum", { added: [entry({})], removed: [] }, state)).to.deep.equal([]);
  });
  it("verifyAll reports snapshot entries missing on-chain", async () => {
    const acm = fakeAcm(new Set());
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    };
    const bad = await verifyAll(acm, "ethereum", state);
    expect(bad).to.have.length(1);
    expect(bad[0].account).to.equal("0xA");
  });
});
