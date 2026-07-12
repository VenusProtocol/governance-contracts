import { expect } from "chai";
import { ethers } from "ethers";

import {
  TOPICS,
  buildHashTable,
  decodeLog,
  legacyWildcardRoleHash,
  roleHash,
} from "../../scripts/acm-permissions/core/decoder";

const ACM = "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555";
const T = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396"; // account
const C = "0xfD36E2c2a6789Db23113685031d7F16329158384"; // target contract
const base = { blockNumber: 100, logIndex: 3, transactionHash: "0xabc", address: ACM } as any;

describe("decoder", () => {
  it("computes roleHash as solidity keccak256(encodePacked(address,string))", () => {
    expect(roleHash(C, "pause()")).to.equal(ethers.utils.solidityKeccak256(["address", "string"], [C, "pause()"]));
  });
  it("decodes modern PermissionGranted logs (non-indexed data)", () => {
    const data = ethers.utils.defaultAbiCoder.encode(["address", "address", "string"], [T, C, "pause()"]);
    const ev = decodeLog({ ...base, topics: [TOPICS.modern.granted], data }, "ethereum", ACM, null);
    expect(ev).to.include({
      type: "granted",
      account: T,
      contractAddress: C,
      functionSig: "pause()",
      decoded: true,
      blockNumber: 100,
      logIndex: 3,
    });
    expect(ev.roleHash).to.equal(roleHash(C, "pause()"));
  });
  it("decodes legacy RoleGranted via hash table, keeps unknown roles undecoded", () => {
    const table = buildHashTable([C], ["pause()"]);
    const topics = (role: string) => [TOPICS.legacy.granted, role, ethers.utils.hexZeroPad(T, 32)];
    const known = decodeLog({ ...base, topics: topics(roleHash(C, "pause()")), data: "0x" }, "bscmainnet", ACM, table);
    expect(known).to.include({ decoded: true, contractAddress: C, functionSig: "pause()", account: T });
    const unknown = decodeLog(
      { ...base, topics: topics("0x" + "11".repeat(32)), data: "0x" },
      "bscmainnet",
      ACM,
      table,
    );
    expect(unknown).to.include({ decoded: false, contractAddress: null, functionSig: null });
    expect(unknown.roleHash).to.equal("0x" + "11".repeat(32));
  });
  it("decodes the deployed bsc ACM's bytes32(0) wildcard roles alongside the 20-byte form", () => {
    const WILDCARD = "0x0000000000000000000000000000000000000000";
    const table = buildHashTable([C, WILDCARD], ["pause()"]);
    const topics = (role: string) => [TOPICS.legacy.granted, role, ethers.utils.hexZeroPad(T, 32)];
    // deployed bsc ACM wildcard derivation: keccak256(bytes32(0) ++ sig), NOT the 20-byte address(0)
    const legacyWildcard = legacyWildcardRoleHash("pause()");
    expect(legacyWildcard).to.not.equal(roleHash(WILDCARD, "pause()"));
    for (const role of [legacyWildcard, roleHash(WILDCARD, "pause()")]) {
      const ev = decodeLog({ ...base, topics: topics(role), data: "0x" }, "bscmainnet", ACM, table);
      expect(ev).to.include({ decoded: true, contractAddress: WILDCARD, functionSig: "pause()" });
    }
  });
  it("maps the all-zero role to DEFAULT_ADMIN_ROLE on the ACM", () => {
    const ev = decodeLog(
      { ...base, topics: [TOPICS.legacy.granted, "0x" + "00".repeat(32), ethers.utils.hexZeroPad(T, 32)], data: "0x" },
      "bscmainnet",
      ACM,
      {},
    );
    expect(ev).to.include({ decoded: true, contractAddress: ACM, functionSig: "DEFAULT_ADMIN_ROLE" });
  });
  it("decodes revoked events with type revoked", () => {
    const data = ethers.utils.defaultAbiCoder.encode(["address", "address", "string"], [T, C, "pause()"]);
    expect(decodeLog({ ...base, topics: [TOPICS.modern.revoked], data }, "ethereum", ACM, null).type).to.equal(
      "revoked",
    );
  });
});
