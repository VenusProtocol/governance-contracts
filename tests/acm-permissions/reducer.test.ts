import { expect } from "chai";

import { applyEvents } from "../../scripts/acm-permissions/core/reducer";
import { PermissionEvent, SnapshotState } from "../../scripts/acm-permissions/types";

const ev = (o: Partial<PermissionEvent>): PermissionEvent => ({
  type: "granted",
  roleHash: "0xr1",
  account: "0xA",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  blockNumber: 1,
  logIndex: 0,
  txHash: "0xt",
  ...o,
});

describe("reducer", () => {
  it("grant → revoke → re-grant, out of order input, ends granted", () => {
    const s: SnapshotState = {};
    applyEvents(s, [
      ev({ type: "granted", blockNumber: 5 }), // re-grant (latest)
      ev({ type: "granted", blockNumber: 1 }),
      ev({ type: "revoked", blockNumber: 3 }),
    ]);
    expect(s["0xr1"].grantees).to.deep.equal(["0xA"]);
  });
  it("removes fully-revoked roles from state", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ blockNumber: 1 }), ev({ type: "revoked", blockNumber: 2 })]);
    expect(s).to.deep.equal({});
  });
  it("dedupes duplicate grants and keeps tx history", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ txHash: "0x1" }), ev({ txHash: "0x2", blockNumber: 2 })]);
    expect(s["0xr1"].grantees).to.deep.equal(["0xA"]);
    expect(s["0xr1"].transactions).to.deep.equal(["0x1", "0x2"]);
  });
  it("revokes undecoded roles by hash (bscmainnet staleness fix)", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ roleHash: "0xdead", decoded: false, contractAddress: null, functionSig: null })]);
    expect(s["0xdead"].decoded).to.equal(false);
    applyEvents(s, [
      ev({
        type: "revoked",
        roleHash: "0xdead",
        decoded: false,
        contractAddress: null,
        functionSig: null,
        blockNumber: 9,
      }),
    ]);
    expect(s["0xdead"]).to.equal(undefined);
  });
  it("same-block events respect logIndex order", () => {
    const s: SnapshotState = {};
    applyEvents(s, [
      ev({ type: "revoked", blockNumber: 1, logIndex: 2 }),
      ev({ type: "granted", blockNumber: 1, logIndex: 1 }),
    ]);
    expect(s).to.deep.equal({});
  });
});
