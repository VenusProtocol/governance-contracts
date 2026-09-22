import { expect } from "chai";

import { verificationStamp } from "../../scripts/acm-permissions/cli";
import { DiffEntry, SnapshotFile } from "../../scripts/acm-permissions/types";

const entry: DiffEntry = {
  roleHash: "0xrole",
  contractAddress: "0x0000000000000000000000000000000000000001",
  functionSig: "setFoo(uint256)",
  decoded: true,
  account: "0x0000000000000000000000000000000000000002",
  txHash: "0xtx",
};

const prev = { verified: true, verifiedAt: "2026-07-10T00:00:00Z" } as SnapshotFile;

describe("verificationStamp", () => {
  it("stamps a fresh verification when the diff had entries to check", () => {
    const stamp = verificationStamp({ added: [entry], removed: [] }, prev);
    expect(stamp.verified).to.equal(true);
    expect(stamp.verifiedAt).to.not.equal(prev.verifiedAt);
  });

  it("carries the previous stamp through when the diff was empty (nothing was checked)", () => {
    expect(verificationStamp({ added: [], removed: [] }, prev)).to.deep.equal({
      verified: true,
      verifiedAt: "2026-07-10T00:00:00Z",
    });
  });

  it("claims nothing when an empty diff meets a first-ever snapshot", () => {
    expect(verificationStamp({ added: [], removed: [] }, null)).to.deep.equal({
      verified: undefined,
      verifiedAt: undefined,
    });
  });
});
