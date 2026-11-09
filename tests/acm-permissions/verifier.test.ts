import { expect } from "chai";

import {
  CallOverrides,
  checkOnChain,
  verifyAll,
  verifyAllAndFix,
  verifyDiff,
} from "../../scripts/acm-permissions/core/verifier";
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
// Records the RAW argument list of every read. Recording arity rather than just the overrides
// value is deliberate: ethers only treats a trailing argument as overrides when
// `typeof it === "object"`, so passing an explicit `undefined` leaves a third/fourth argument in
// place and blows the arity check on a real contract. A fake that declares an optional trailing
// parameter swallows that difference silently — asserting `args.length` is what catches it.
const recordingAcm = () => {
  const calls: { fn: "hasPermission" | "hasRole"; args: unknown[] }[] = [];
  return {
    calls,
    arities: () => calls.map(c => c.args.length),
    overrides: () => calls.map(c => c.args[c.args.length - 1] as CallOverrides | undefined),
    acm: {
      hasPermission: async (...args: unknown[]) => {
        calls.push({ fn: "hasPermission", args });
        return true;
      },
      hasRole: async (...args: unknown[]) => {
        calls.push({ fn: "hasRole", args });
        return true;
      },
    },
  };
};

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

  // A diff describes state as of the block the replay stopped at, so the reads that confirm it
  // must be pinned to that same block — otherwise anything granted or revoked afterwards reads
  // back as a correction and gets written into a snapshot stamped with the earlier height.
  describe("blockTag pinning", () => {
    const state = (): SnapshotState => ({
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    });

    it("verifyDiff pins both directions to the given block", async () => {
      const r = recordingAcm();
      await verifyDiff(
        r.acm,
        "ethereum",
        { added: [entry({})], removed: [entry({ roleHash: "0xr2", account: "0xB" })] },
        state(),
        { blockTag: 12345 },
      );
      expect(r.calls).to.have.length(2);
      expect(r.overrides()).to.deep.equal([{ blockTag: 12345 }, { blockTag: 12345 }]);
      // hasPermission(account, contract, sig) + overrides
      expect(r.arities()).to.deep.equal([4, 4]);
    });

    it("verifyAll pins to the given block, and legacy hasRole reads carry it too", async () => {
      const r = recordingAcm();
      await verifyAll(r.acm, "bscmainnet", state(), { blockTag: 999 });
      expect(r.calls.map(c => c.fn)).to.deep.equal(["hasRole"]);
      expect(r.overrides()).to.deep.equal([{ blockTag: 999 }]);
      expect(r.arities()).to.deep.equal([3]); // hasRole(role, account) + overrides
    });

    // Regression: passing `undefined` here instead of omitting the argument makes ethers count
    // it as a real parameter and throw "too many arguments" on every unpinned read — which is
    // every read `acm:verify` makes.
    it("omits the overrides argument entirely when no block is given", async () => {
      const modern = recordingAcm();
      await verifyDiff(modern.acm, "ethereum", { added: [entry({})], removed: [] }, state());
      expect(modern.arities()).to.deep.equal([3]); // exactly hasPermission's three inputs
      expect(modern.calls[0].args).to.deep.equal(["0xA", "0xC", "pause()"]);

      const legacy = recordingAcm();
      await verifyAll(legacy.acm, "bscmainnet", state());
      expect(legacy.arities()).to.deep.equal([2]); // exactly hasRole's two inputs
      expect(legacy.calls[0].args).to.deep.equal(["0xr1", "0xA"]);
    });
  });
});
