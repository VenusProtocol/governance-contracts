import { expect } from "chai";

import { filterPermissions } from "../../scripts/acm-permissions/cli";
import { GUARDIANS } from "../../scripts/acm-permissions/config";
import { SnapshotFile } from "../../scripts/acm-permissions/types";

const NORMAL_TIMELOCK = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";
const UNITROLLER = "0xfD36E2c2a6789Db23113685031d7F16329158384";
const VBNB = "0x0000000000000000000000000000000000000001";
const GUARDIAN_2 = GUARDIANS.bscmainnet[1]; // proves "Guardian" must match ALL three, not just [0]

const nameMap: Record<string, string> = {
  [NORMAL_TIMELOCK]: "NormalTimelock",
  [UNITROLLER]: "Unitroller",
  [VBNB]: "VBNB",
};

const file: SnapshotFile = {
  network: "bscmainnet",
  acmAddress: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
  height: 123,
  updatedAt: "2026-07-10T00:00:00Z",
  schemaVersion: 1,
  contracts: [
    {
      address: UNITROLLER,
      name: "Unitroller",
      scope: "contract",
      permissions: [
        {
          functionSig: "pause()",
          roleHash: "0xr1",
          decoded: true,
          grantees: [{ address: NORMAL_TIMELOCK, name: "NormalTimelock" }],
          transactions: ["0xt1"],
        },
      ],
    },
    {
      address: VBNB,
      name: "VBNB",
      scope: "contract",
      permissions: [
        {
          functionSig: "mint()",
          roleHash: "0xr2",
          decoded: true,
          grantees: [{ address: GUARDIAN_2, name: "Guardian 2" }],
          transactions: ["0xt2"],
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
          roleHash: "0xr3",
          decoded: false,
          grantees: [{ address: GUARDIAN_2, name: "Guardian 2" }],
          transactions: ["0xt3"],
        },
      ],
    },
  ],
};

describe("filterPermissions", () => {
  it("keys results by the requested label verbatim", () => {
    const result = filterPermissions(file, ["NormalTimelock", "Guardian"], "bscmainnet", nameMap);
    expect(Object.keys(result)).to.deep.equal(["NormalTimelock", "Guardian"]);
  });

  it("resolves a timelock name via reverse name-map lookup", () => {
    const result = filterPermissions(file, ["NormalTimelock"], "bscmainnet", nameMap);
    expect(result.NormalTimelock).to.deep.equal([{ contract: "Unitroller", functionSig: "pause()", roleHash: "0xr1" }]);
  });

  it('"Guardian" matches ALL bscmainnet guardian addresses, including the decoded and unresolved permissions', () => {
    const result = filterPermissions(file, ["Guardian"], "bscmainnet", nameMap);
    expect(result.Guardian).to.have.length(2);
    expect(result.Guardian).to.deep.include({ contract: "VBNB", functionSig: "mint()", roleHash: "0xr2" });
    expect(result.Guardian).to.deep.include({ contract: "UNRESOLVED", functionSig: null, roleHash: "0xr3" });
  });

  it("a raw 0x… address label matches directly, same as its resolved name", () => {
    const result = filterPermissions(file, [NORMAL_TIMELOCK], "bscmainnet", nameMap);
    expect(result[NORMAL_TIMELOCK]).to.deep.equal([
      { contract: "Unitroller", functionSig: "pause()", roleHash: "0xr1" },
    ]);
  });

  it("throws a clear error for a label that resolves to nothing", () => {
    expect(() => filterPermissions(file, ["NotARealLabel"], "bscmainnet", nameMap)).to.throw(/NotARealLabel/);
  });

  it('matches each part of a joined "A / B" registry name individually', () => {
    // Generated registries join conflicting deployments as "X / X_Proxy" — either part must resolve.
    const joinedMap: Record<string, string> = { ...nameMap, [NORMAL_TIMELOCK]: "NormalTimelock / LegacyAlias" };
    const expected = [{ contract: "Unitroller", functionSig: "pause()", roleHash: "0xr1" }];
    expect(filterPermissions(file, ["NormalTimelock"], "bscmainnet", joinedMap).NormalTimelock).to.deep.equal(expected);
    expect(filterPermissions(file, ["LegacyAlias"], "bscmainnet", joinedMap).LegacyAlias).to.deep.equal(expected);
  });
});
