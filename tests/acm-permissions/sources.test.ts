import { expect } from "chai";
import * as fs from "fs";

import { loadManifest, npmTarballUrl, resolveSource } from "../../scripts/acm-permissions/registry-builder/sources";

describe("acm-permissions sources", () => {
  it("loads a valid manifest", () => {
    const sources = loadManifest();
    expect(sources.length).to.be.greaterThan(1);
    expect(sources[0].type).to.equal("local");
    for (const s of sources) if (s.type === "npm") expect(s.version).to.match(/^\d+\.\d+\.\d+/);
  });
  it("builds correct npm tarball URLs (scoped packages)", () => {
    expect(npmTarballUrl("@venusprotocol/oracle", "2.9.0")).to.equal(
      "https://registry.npmjs.org/@venusprotocol/oracle/-/oracle-2.9.0.tgz",
    );
  });
  it("resolves the local source to the repo root", () => {
    const root = resolveSource({ type: "local", path: "../../.." });
    expect(fs.existsSync(root + "/hardhat.config.ts")).to.equal(true);
  });
});
