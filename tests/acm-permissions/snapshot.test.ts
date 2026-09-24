import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { WILDCARD } from "../../scripts/acm-permissions/config";
import { HashTable } from "../../scripts/acm-permissions/core/decoder";
import {
  fileToState,
  loadSnapshotFile,
  reannotateUndecoded,
  saveSnapshotFile,
  stateToFile,
} from "../../scripts/acm-permissions/core/snapshot";
import { RoleState, SnapshotFile, SnapshotMeta, SnapshotState } from "../../scripts/acm-permissions/types";

const meta: SnapshotMeta = {
  network: "bscmainnet",
  acmAddress: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
  height: 123,
  updatedAt: "2026-07-10T00:00:00Z",
};
const C = "0xfD36E2c2a6789Db23113685031d7F16329158384",
  A = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";

const state: SnapshotState = {
  "0xr1": {
    roleHash: "0xr1",
    contractAddress: C,
    functionSig: "pause()",
    decoded: true,
    grantees: [A],
    transactions: ["0xt1"],
  },
  "0xr2": {
    roleHash: "0xr2",
    contractAddress: WILDCARD,
    functionSig: "unpause()",
    decoded: true,
    grantees: [A],
    transactions: ["0xt2"],
  },
  "0xr3": {
    roleHash: "0xr3",
    contractAddress: null,
    functionSig: null,
    decoded: false,
    grantees: [A],
    transactions: ["0xt3"],
  },
};

describe("snapshot store", () => {
  it("groups by contract with scopes and resolves names", () => {
    const f = stateToFile(state, meta, { [C]: "Unitroller", [A]: "NormalTimelock" });
    expect(f.schemaVersion).to.equal(1);
    const scopes = f.contracts.map(c => c.scope).sort();
    expect(scopes).to.deep.equal(["contract", "unresolved", "wildcard"]);
    const uni = f.contracts.find(c => c.name === "Unitroller")!;
    expect(uni.permissions[0].grantees[0]).to.deep.equal({ address: A, name: "NormalTimelock" });
    const unres = f.contracts.find(c => c.scope === "unresolved")!;
    expect(unres.address).to.equal(null);
    expect(unres.permissions[0].transactions).to.deep.equal(["0xt3"]);
  });
  it("round-trips file → state losslessly", () => {
    const f = stateToFile(state, meta, {});
    expect(fileToState(f)).to.deep.equal(state);
  });
  it("preserves chronological grantee order when name order differs (lossless round-trip)", () => {
    // Insertion (chronological) order Z-then-A, but names sort A-then-Z: order must survive.
    const Z = "0x0000000000000000000000000000000000000002"; // named "Zed", granted first
    const B = "0x0000000000000000000000000000000000000003"; // named "Aaa", granted second
    const multi: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: C,
        functionSig: "pause()",
        decoded: true,
        grantees: [Z, B],
        transactions: ["0xt1", "0xt2"],
      },
    };
    const f = stateToFile(multi, meta, { [Z]: "Zed", [B]: "Aaa" });
    expect(f.contracts[0].permissions[0].grantees.map(g => g.name)).to.deep.equal(["Zed", "Aaa"]);
    expect(fileToState(f)).to.deep.equal(multi);
  });
});

describe("reannotateUndecoded", () => {
  const undecodedRole: RoleState = {
    roleHash: "0xr3",
    contractAddress: null,
    functionSig: null,
    decoded: false,
    grantees: [A],
    transactions: ["0xt3"],
  };

  it("fills in contractAddress/functionSig when the hash table now has a hit", () => {
    const s: SnapshotState = { r3: { ...undecodedRole } };
    const table: HashTable = { "0xr3": { contractAddress: C, functionSig: "pause()" } };
    reannotateUndecoded(s, table);
    expect(s.r3).to.deep.equal({ ...undecodedRole, contractAddress: C, functionSig: "pause()", decoded: true });
  });

  it("leaves already-decoded roles untouched", () => {
    const s: SnapshotState = { r1: { ...state["0xr1"] } };
    const table: HashTable = { "0xr1": { contractAddress: A, functionSig: "somethingElse()" } };
    reannotateUndecoded(s, table);
    expect(s.r1).to.deep.equal(state["0xr1"]);
  });

  it("leaves undecoded roles untouched when there is no hash-table hit", () => {
    const s: SnapshotState = { r3: { ...undecodedRole } };
    reannotateUndecoded(s, {});
    expect(s.r3).to.deep.equal(undecodedRole);
  });

  it("is a no-op when table is null (non-legacy networks)", () => {
    const s: SnapshotState = { r3: { ...undecodedRole } };
    reannotateUndecoded(s, null);
    expect(s.r3).to.deep.equal(undecodedRole);
  });
});

describe("snapshot file store (load/save)", () => {
  // Scratch base dir under os.tmpdir() so tests NEVER touch the real snapshots/<network>/ tree
  // (a live fetch may have written real data there).
  let baseDir: string;
  let dir: string;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "acm-snapshot-test-"));
    dir = path.join(baseDir, "sepolia");
  });
  afterEach(() => fs.rmSync(baseDir, { recursive: true, force: true }));

  it("returns null when no snapshot exists yet", () => {
    expect(loadSnapshotFile("sepolia", baseDir)).to.equal(null);
  });

  it("saves atomically (no leftover .tmp) and loads back the same file", () => {
    const f = stateToFile(state, { ...meta, network: "sepolia" }, {});
    saveSnapshotFile("sepolia", f, baseDir);
    expect(fs.existsSync(`${dir}/permissions.json.tmp`)).to.equal(false);
    expect(loadSnapshotFile("sepolia", baseDir)).to.deep.equal(f);
  });

  it("throws a descriptive error for a corrupt/invalid snapshot file", () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/permissions.json`, "{ not json");
    expect(() => loadSnapshotFile("sepolia", baseDir)).to.throw(/corrupt snapshot for sepolia/);

    fs.writeFileSync(`${dir}/permissions.json`, JSON.stringify({ schemaVersion: 2, height: 1, contracts: [] }));
    expect(() => loadSnapshotFile("sepolia", baseDir)).to.throw(/corrupt snapshot for sepolia/);

    fs.writeFileSync(
      `${dir}/permissions.json`,
      JSON.stringify({ schemaVersion: 1, height: "not-a-number", contracts: [] } as unknown as SnapshotFile),
    );
    expect(() => loadSnapshotFile("sepolia", baseDir)).to.throw(/corrupt snapshot for sepolia/);
  });
});
