import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { refreshNetwork } from "../../scripts/acm-permissions/cli";
import { GUARDIANS } from "../../scripts/acm-permissions/config";
import { roleHash } from "../../scripts/acm-permissions/core/decoder";
import { loadKnownAddresses, loadNameMap, loadSignatures } from "../../scripts/acm-permissions/core/registry";
import { saveSnapshotFile } from "../../scripts/acm-permissions/core/snapshot";
import { SnapshotFile } from "../../scripts/acm-permissions/types";

// These tests read the REAL committed registry (registry/legacy-contracts.json,
// registry/signatures.json, registry/contracts/<network>.json) read-only — never mutated — and
// derive their fixtures from whatever is currently registered, so they stay valid as the
// registry grows (e.g. once the periphery source is added) instead of depending on one
// hardcoded address/signature pair.
describe("refreshNetwork", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "acm-refresh-test-"));
  });
  afterEach(() => fs.rmSync(baseDir, { recursive: true, force: true }));

  it("re-annotates an undecoded bscmainnet role against a freshly built hash table and rewrites files", () => {
    const dir = path.join(baseDir, "bscmainnet");
    fs.mkdirSync(dir, { recursive: true });
    // Stale leftover from a prior run — must be deleted once nothing is unresolved anymore.
    fs.writeFileSync(path.join(dir, "unresolved-roles.json"), "[]\n");

    // Any known (address, signature) pair hashes to a hit in buildHashTable(loadKnownAddresses,
    // loadSignatures) by construction — pick the first of each from the real, committed registry.
    const address = loadKnownAddresses("bscmainnet").filter(a => a !== "0x0000000000000000000000000000000000000000")[0];
    const sig = loadSignatures()[0];
    const hash = roleHash(address, sig);
    const grantee = GUARDIANS.bscmainnet[0];

    const stub: SnapshotFile = {
      network: "bscmainnet",
      acmAddress: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
      height: 66323914,
      updatedAt: "2026-07-01T00:00:00Z",
      schemaVersion: 1,
      contracts: [
        {
          address: null,
          name: "UNRESOLVED",
          scope: "unresolved",
          permissions: [
            {
              functionSig: null,
              roleHash: hash,
              decoded: false,
              grantees: [{ address: grantee, name: grantee }],
              transactions: ["0xtest"],
            },
          ],
        },
      ],
    };
    saveSnapshotFile("bscmainnet", stub, baseDir);

    const result = refreshNetwork("bscmainnet", { baseDir });

    expect(result).to.deep.equal({ newlyDecoded: 1, total: 1, unresolved: 0 });

    const reloaded = JSON.parse(fs.readFileSync(path.join(dir, "permissions.json"), "utf8")) as SnapshotFile;
    expect(reloaded.height).to.equal(66323914); // height untouched
    expect(reloaded.contracts.find(c => c.scope === "unresolved")).to.equal(undefined);
    const decodedContract = reloaded.contracts.find(c => c.address === address)!;
    expect(decodedContract.permissions[0]).to.include({ functionSig: sig, decoded: true, roleHash: hash });

    // unresolved-roles.json must be deleted now that nothing is unresolved.
    expect(fs.existsSync(path.join(dir, "unresolved-roles.json"))).to.equal(false);
    const md = fs.readFileSync(path.join(dir, "permissions.md"), "utf8");
    expect(md).to.contain(sig);
    expect(md).to.not.contain("Unresolved roles");

    // changes.md/changes.json were removed from the tool entirely — nothing may recreate them.
    expect(fs.existsSync(path.join(dir, "changes.md"))).to.equal(false);
    expect(fs.existsSync(path.join(dir, "changes.json"))).to.equal(false);
  });

  it("re-renders names from the CURRENT name map, ignoring stale names embedded in the old snapshot", () => {
    const [address, currentName] = Object.entries(loadNameMap("sepolia"))[0];

    const stub: SnapshotFile = {
      network: "sepolia",
      acmAddress: "0x0000000000000000000000000000000000000009",
      height: 42,
      updatedAt: "2026-07-01T00:00:00Z",
      schemaVersion: 1,
      verified: true,
      verifiedAt: "2026-07-01T00:00:00Z",
      contracts: [
        {
          address,
          name: "StaleNameFromBeforeRegistryUpdate",
          scope: "contract",
          permissions: [
            {
              functionSig: "pause()",
              roleHash: roleHash(address, "pause()"),
              decoded: true,
              grantees: [{ address, name: "AlsoStale" }],
            },
          ],
        },
      ],
    };
    saveSnapshotFile("sepolia", stub, baseDir);

    const result = refreshNetwork("sepolia", { baseDir });
    expect(result).to.deep.equal({ newlyDecoded: 0, total: 1, unresolved: 0 });

    const dir = path.join(baseDir, "sepolia");
    const reloaded = JSON.parse(fs.readFileSync(path.join(dir, "permissions.json"), "utf8")) as SnapshotFile;
    expect(reloaded.contracts[0].name).to.equal(currentName);
    expect(reloaded.contracts[0].permissions[0].grantees[0].name).to.equal(currentName);
    expect(reloaded.height).to.equal(42); // non-legacy network, no table — height still untouched
    // refresh makes no chain calls — verified/verifiedAt must carry forward unchanged.
    expect(reloaded.verified).to.equal(true);
    expect(reloaded.verifiedAt).to.equal("2026-07-01T00:00:00Z");
    expect(fs.readFileSync(path.join(dir, "permissions.md"), "utf8")).to.contain(
      "✅ verified on-chain (as of 2026-07-01)",
    );
  });

  it("warns and returns null when no snapshot exists for the network", () => {
    expect(refreshNetwork("opsepolia", { baseDir })).to.equal(null);
  });
});
