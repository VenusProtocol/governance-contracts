import { expect } from "chai";

import { diffSnapshots } from "../../scripts/acm-permissions/core/diff";
import { SnapshotState } from "../../scripts/acm-permissions/types";

const role = (grantees: string[], over: object = {}) => ({
  roleHash: "0xr1",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  grantees,
  transactions: ["0xt"],
  ...over,
});

describe("diff", () => {
  it("detects added and removed grantees per role", () => {
    const prev: SnapshotState = { "0xr1": role(["0xA", "0xB"]) };
    const next: SnapshotState = { "0xr1": role(["0xB", "0xNew"]) };
    const d = diffSnapshots(prev, next);
    expect(d.added.map(e => e.account)).to.deep.equal(["0xNew"]);
    expect(d.removed.map(e => e.account)).to.deep.equal(["0xA"]);
  });
  it("whole-role appearance/disappearance", () => {
    const d = diffSnapshots({}, { "0xr1": role(["0xA"]) });
    expect(d.added).to.have.length(1);
    expect(d.removed).to.have.length(0);
    const d2 = diffSnapshots({ "0xr1": role(["0xA"]) }, {});
    expect(d2.removed).to.have.length(1);
  });
  it("falls back to empty txHash when the role has no transactions", () => {
    const d = diffSnapshots({ "0xr1": role(["0xA"], { transactions: [] }) }, {});
    expect(d.removed).to.have.length(1);
    expect(d.removed[0].txHash).to.equal("");
  });
  it("empty diff on identical states", () => {
    const s: SnapshotState = { "0xr1": role(["0xA"]) };
    expect(diffSnapshots(s, s)).to.deep.equal({ added: [], removed: [] });
  });
});
