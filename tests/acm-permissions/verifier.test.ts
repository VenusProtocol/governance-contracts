import { expect } from "chai";

import { checkOnChain, verifyAll, verifyAllAndFix, verifyDiff } from "../../scripts/acm-permissions/core/verifier";
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
  it("verifyAllAndFix removes chain-denied grantees from state and keeps confirmed ones", async () => {
    // chain confirms only 0xB; 0xA must be dropped, and the role survives with 0xB alone
    const acm = fakeAcm(new Set(["0xB|0xC|pause()"]));
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA", "0xB"],
        transactions: [],
      },
      "0xr2": {
        roleHash: "0xr2",
        contractAddress: "0xC",
        functionSig: "unpause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    };
    const fixed = await verifyAllAndFix(acm, "ethereum", state);
    expect(fixed.map(e => `${e.roleHash}|${e.account}`).sort()).to.deep.equal(["0xr1|0xA", "0xr2|0xA"]);
    expect(state["0xr1"].grantees).to.deep.equal(["0xB"]);
    expect(state["0xr2"]).to.equal(undefined); // last grantee removed → role deleted
  });
});
