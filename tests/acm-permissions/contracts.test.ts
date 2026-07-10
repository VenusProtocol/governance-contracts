import { expect } from "chai";
import { ethers } from "ethers";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { nameFor } from "../../scripts/acm-permissions/core/registry";
import { buildContractRegistry } from "../../scripts/acm-permissions/registry-builder/contracts";

describe("contract registry", () => {
  it("merges sources, checksums keys, joins conflicting names", () => {
    const a = fs.mkdtempSync(path.join(os.tmpdir(), "srcA-")),
      b = fs.mkdtempSync(path.join(os.tmpdir(), "srcB-"));
    const addr = "0x939bd8d64c0a9583a7dcea9933f7b21697ab6396"; // lowercase on purpose
    for (const [root, name] of [
      [a, "Timelock"],
      [b, "NormalTimelock"],
    ] as const) {
      fs.mkdirSync(path.join(root, "deployments"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "deployments", "bsctestnet_addresses.json"),
        JSON.stringify({ addresses: { [name]: addr } }),
      );
    }
    const reg = buildContractRegistry("bsctestnet", [a, b]);
    const key = ethers.utils.getAddress(addr);
    expect(reg[key]).to.equal("Timelock / NormalTimelock");
  });
  it("nameFor falls back to the raw address and is case-insensitive", () => {
    const key = ethers.utils.getAddress("0x939bd8d64c0a9583a7dcea9933f7b21697ab6396");
    const map = { [key]: "NormalTimelock" };
    expect(nameFor(map, key.toLowerCase())).to.equal("NormalTimelock");
    expect(nameFor(map, "0x0000000000000000000000000000000000000001")).to.equal(
      "0x0000000000000000000000000000000000000001",
    );
  });
});
