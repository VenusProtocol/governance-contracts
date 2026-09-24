import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { renderPermissionsMd, writePermissionsOutputs } from "../../scripts/acm-permissions/core/output";
import { SnapshotFile } from "../../scripts/acm-permissions/types";

const UNITROLLER = "0xfD36E2c2a6789Db23113685031d7F16329158384";
const VAI_CONTROLLER = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";
const WILDCARD_ADDR = "0x0000000000000000000000000000000000000000";
const ZED = "0x0000000000000000000000000000000000000001";
const AAA = "0x0000000000000000000000000000000000000002";
const NORMAL_TIMELOCK = "0x0000000000000000000000000000000000000003";
const GUARDIAN1 = "0x0000000000000000000000000000000000000004";
const FAST_TRACK = "0x0000000000000000000000000000000000000005";
const GUARDIAN2 = "0x0000000000000000000000000000000000000006";
const GUARDIAN3 = "0x0000000000000000000000000000000000000007";

// Fixture: one "contract" bucket whose permission has two grantees stored in chronological
// (insertion) order Zed-then-Aaa — the display copy must be re-sorted alphabetically (Aaa, Zed)
// without mutating this array; one wildcard entry; one unresolved entry with a transaction.
const file: SnapshotFile = {
  network: "bscmainnet",
  acmAddress: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
  height: 66323914,
  updatedAt: "2026-07-10T00:00:00Z",
  schemaVersion: 1,
  contracts: [
    {
      address: UNITROLLER,
      name: "Unitroller",
      scope: "contract",
      permissions: [
        {
          functionSig: "_setCollateralFactor(address,uint256)",
          roleHash: "0xr1",
          decoded: true,
          grantees: [
            { address: ZED, name: "Zed" },
            { address: AAA, name: "Aaa" },
          ],
        },
      ],
    },
    {
      address: WILDCARD_ADDR,
      name: WILDCARD_ADDR,
      scope: "wildcard",
      permissions: [
        {
          functionSig: "unpause()",
          roleHash: "0xr2",
          decoded: true,
          grantees: [{ address: NORMAL_TIMELOCK, name: "NormalTimelock" }],
        },
      ],
    },
    {
      address: null,
      name: "UNRESOLVED",
      scope: "unresolved",
      permissions: [
        {
          functionSig: null,
          roleHash: "0xdeadbeef",
          decoded: false,
          grantees: [{ address: GUARDIAN1, name: "Guardian 1" }],
          transactions: ["0xtx1"],
        },
      ],
    },
  ],
};

const names: Record<string, string> = {
  [UNITROLLER]: "Unitroller",
  [VAI_CONTROLLER]: "VAIController",
  [FAST_TRACK]: "FastTrackTimelock",
  [GUARDIAN2]: "Guardian 2",
  [GUARDIAN3]: "Guardian 3",
};

const golden = (name: string) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

// A copy of `file` stamped as verified — the base `file` fixture is deliberately left
// un-stamped (verified/verifiedAt absent) so it can also exercise the "not verified" render
// path (see the writePermissionsOutputs tests below — only the persistent verified/verifiedAt
// fields determine the header).
const verifiedFile: SnapshotFile = { ...file, verified: true, verifiedAt: "2026-07-10T00:00:00Z" };

describe("output renderers (golden files)", () => {
  it("renderPermissionsMd matches the golden permissions.md byte-for-byte", () => {
    const rendered = renderPermissionsMd(verifiedFile);
    expect(rendered).to.equal(golden("golden-permissions.md"));
  });

  it("renders the un-verified header when verified/verifiedAt are absent", () => {
    const rendered = renderPermissionsMd(file);
    expect(rendered).to.contain("Verification: ⚠️ not verified");
  });

  it("does not mutate the input file's grantee (chronological) order while rendering", () => {
    const before = JSON.parse(JSON.stringify(verifiedFile));
    renderPermissionsMd(verifiedFile);
    expect(verifiedFile).to.deep.equal(before);
  });
});

describe("writePermissionsOutputs", () => {
  // Scratch base dir under os.tmpdir() so tests NEVER touch the real snapshots/<network>/ tree
  // (a live fetch may have written real data there).
  let baseDir: string;
  let dir: string;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "acm-output-test-"));
    dir = path.join(baseDir, "sepolia");
  });
  afterEach(() => fs.rmSync(baseDir, { recursive: true, force: true }));

  it("writes permissions.md and unresolved-roles.json atomically, and nothing else", () => {
    writePermissionsOutputs("sepolia", file, names, baseDir);

    for (const f of ["permissions.md", "unresolved-roles.json"]) {
      expect(fs.existsSync(path.join(dir, f)), `${f} should exist`).to.equal(true);
      expect(fs.existsSync(path.join(dir, `${f}.tmp`)), `${f}.tmp should not be left behind`).to.equal(false);
    }
    // Run deltas live in git diff / console only — no changes.* files may reappear.
    expect(fs.readdirSync(dir).sort()).to.deep.equal(["permissions.md", "unresolved-roles.json"]);

    // `file` carries no verified/verifiedAt → permissions.md renders the un-verified header
    // (the caller decides verified status — see cli.ts's fetchNetwork/verifyNetwork).
    expect(fs.readFileSync(path.join(dir, "permissions.md"), "utf8")).to.contain("⚠️ not verified");
    expect(JSON.parse(fs.readFileSync(path.join(dir, "unresolved-roles.json"), "utf8"))).to.deep.equal(
      file.contracts.find(c => c.scope === "unresolved")!.permissions,
    );
  });

  it("renders the verified header when the file carries verified/verifiedAt", () => {
    writePermissionsOutputs("sepolia", verifiedFile, names, baseDir);
    expect(fs.readFileSync(path.join(dir, "permissions.md"), "utf8")).to.contain(
      "✅ verified on-chain (as of 2026-07-10)",
    );
  });

  it("skips unresolved-roles.json when there is no unresolved bucket with entries", () => {
    const noUnresolved: SnapshotFile = { ...file, contracts: file.contracts.filter(c => c.scope !== "unresolved") };
    writePermissionsOutputs("sepolia", noUnresolved, names, baseDir);
    expect(fs.existsSync(path.join(dir, "unresolved-roles.json"))).to.equal(false);
  });
});
