import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { loadLegacyOnlySignatures, recordDroppedSignatures } from "../../scripts/acm-permissions/core/registry";

describe("registry helpers", () => {
  it("loadLegacyOnlySignatures returns only strings no package source proves (reads committed registry)", () => {
    const legacyOnly = loadLegacyOnlySignatures();
    // recovered from VIP-357; absent from every published package
    expect(legacyOnly).to.include("sweepTokenFromPool(address,address,address,uint256)");
    // present in generated signatures.json (erc-4626 ABI), so NOT legacy-only despite its legacy entry
    expect(legacyOnly).to.not.include("setRewardRecipient(address)");
  });

  describe("recordDroppedSignatures", () => {
    let file: string;
    beforeEach(() => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "acm-registry-test-"));
      file = path.join(dir, "legacy-signatures.json");
      fs.writeFileSync(file, JSON.stringify({ signatures: [{ signature: "zebra()", origin: "existing" }] }));
    });

    it("appends dropped signatures with a dated origin, sorted, skipping ones already present", () => {
      const added = recordDroppedSignatures(["alpha(uint256)", "zebra()", "alpha(uint256)"], file);
      expect(added).to.equal(1);
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      expect(data.signatures.map((e: { signature: string }) => e.signature)).to.deep.equal([
        "alpha(uint256)",
        "zebra()",
      ]);
      expect(data.signatures[0].origin).to.match(/^dropped from generated signatures\.json on \d{4}-\d{2}-\d{2}/);
      expect(data.signatures[1].origin).to.equal("existing");
    });

    it("is a no-op for an empty drop list", () => {
      const before = fs.readFileSync(file, "utf8");
      expect(recordDroppedSignatures([], file)).to.equal(0);
      expect(fs.readFileSync(file, "utf8")).to.equal(before);
    });
  });
});
