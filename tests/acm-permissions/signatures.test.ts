import { expect } from "chai";
import { ethers } from "ethers";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import {
  buildSignatures,
  extractFromAbi,
  extractFromSol,
  extractFromTsHelper,
  flattenSignatures,
} from "../../scripts/acm-permissions/registry-builder/signatures";

const fx = (f: string) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

describe("signature extraction", () => {
  it("extracts literals from _checkAccessAllowed, checkAccessAllowed and ensureAllowed", () => {
    const { signatures, dynamicCallsites } = extractFromSol(fx("Sample.sol"));
    expect(signatures).to.have.members([
      "setTokenConfig(TokenConfig)",
      "pause()",
      "_setCollateralFactor(address,uint256)",
    ]);
    expect(dynamicCallsites).to.have.length(1); // the `sig` variable call
  });
  it("ignores a gate's own declaration, so its revert string is not scraped as a signature", () => {
    const { signatures } = extractFromSol(fx("Sample.sol"));
    expect(signatures).to.not.include("access denied");
  });
  it("extracts signature-shaped strings from the TS permissions helper", () => {
    expect(extractFromTsHelper(fx("sample-permissions-helper.ts"))).to.have.members([
      "setDirectPrice(address,uint256)",
      "unpause()",
    ]);
  });
  it("derives canonical signatures from ABI function fragments only", () => {
    const { abi } = JSON.parse(fx("sample-artifact.json"));
    expect(extractFromAbi(abi)).to.deep.equal(["setOracle(address,address,uint8)"]);
  });
});

describe("buildSignatures grouping", () => {
  it("groups signatures per contract with per-network addresses, accepts raw ABI arrays", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sigroot-"));
    const addr = "0x939bd8d64c0a9583a7dcea9933f7b21697ab6396"; // lowercase on purpose
    const abi = [{ type: "function", name: "pause", inputs: [] }];
    fs.mkdirSync(path.join(root, "contracts"), { recursive: true });
    fs.mkdirSync(path.join(root, "deployments", "bscmainnet"), { recursive: true });
    fs.mkdirSync(path.join(root, "deployments", "abis"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "contracts", "Vault.sol"),
      'contract Vault { function f() external { _checkAccessAllowed("setTokenConfig(TokenConfig)"); } }',
    );
    // wrapped hardhat-deploy artifact under a network dir -> gets an address
    fs.writeFileSync(
      path.join(root, "deployments", "bscmainnet", "Vault.json"),
      JSON.stringify({ address: addr, abi }),
    );
    // raw ABI array outside a network dir -> signatures only, no address
    fs.writeFileSync(path.join(root, "deployments", "abis", "Bare.json"), JSON.stringify(abi));
    const { contracts } = buildSignatures([root]);
    const byName = Object.fromEntries(contracts.map(c => [c.name, c]));
    expect(byName.Vault.signatures).to.have.members(["pause()", "setTokenConfig(TokenConfig)"]);
    expect(byName.Vault.addresses).to.deep.equal({ bscmainnet: [ethers.utils.getAddress(addr)] });
    expect(byName.Bare.signatures).to.deep.equal(["pause()"]);
    expect(byName.Bare.addresses).to.deep.equal({});
    expect(flattenSignatures(contracts)).to.deep.equal(["pause()", "setTokenConfig(TokenConfig)"]);
  });
});
