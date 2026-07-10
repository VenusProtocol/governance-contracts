import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

import {
  extractFromAbi,
  extractFromSol,
  extractFromTsHelper,
} from "../../scripts/acm-permissions/registry-builder/signatures";

const fx = (f: string) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

describe("signature extraction", () => {
  it("extracts literals from _checkAccessAllowed and checkAccessAllowed", () => {
    const { signatures, dynamicCallsites } = extractFromSol(fx("Sample.sol"));
    expect(signatures).to.have.members(["setTokenConfig(TokenConfig)", "pause()"]);
    expect(dynamicCallsites).to.have.length(1); // the `sig` variable call
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
