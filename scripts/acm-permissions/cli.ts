import * as fs from "fs";
import { parseArgs } from "node:util";
import * as path from "path";

import { REGISTRY_DIR } from "./config";
import { buildContractRegistry } from "./registry-builder/contracts";
import { buildSignatures } from "./registry-builder/signatures";
import { loadManifest, resolveSource } from "./registry-builder/sources";
import { NETWORKS, Network } from "./types";

const writeAtomic = (file: string, data: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", data);
  fs.renameSync(file + ".tmp", file);
};

async function buildRegistry() {
  const roots = loadManifest().map(resolveSource);
  const { signatures, dynamicCallsites } = buildSignatures(roots);
  const prevFile = path.join(REGISTRY_DIR, "signatures.json");
  const prev: string[] = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, "utf8")).signatures : [];
  const appeared = signatures.filter(s => !prev.includes(s)),
    disappeared = prev.filter(s => !signatures.includes(s));
  writeAtomic(prevFile, JSON.stringify({ generatedAt: new Date().toISOString(), signatures }, null, 2));
  console.log(`signatures: ${signatures.length} (+${appeared.length} / -${disappeared.length})`);
  disappeared.forEach(s => console.log(`  disappeared: ${s}`));
  if (dynamicCallsites.length) {
    console.log(`⚠ dynamic checkAccessAllowed callsites (manual review):`);
    dynamicCallsites.forEach(d => console.log("  " + d));
  }
  for (const n of NETWORKS) {
    const reg = buildContractRegistry(n as Network, roots);
    writeAtomic(path.join(REGISTRY_DIR, "contracts", `${n}.json`), JSON.stringify(reg, null, 2));
    console.log(`${n}: ${Object.keys(reg).length} named contracts`);
  }
}

(async () => {
  const { positionals } = parseArgs({
    allowPositionals: true,
    options: {
      network: { type: "string", default: "all" },
      "chunk-size": { type: "string", default: "40000" },
      rebuild: { type: "boolean", default: false },
      to: { type: "string" },
      grantees: { type: "string" },
      out: { type: "string" },
    },
  });
  const cmd = positionals[0];
  if (cmd === "build-registry") await buildRegistry();
  else if (cmd === "fetch" || cmd === "verify" || cmd === "filter")
    throw new Error(`${cmd}: implemented in a later task`);
  else {
    console.error("usage: cli.ts <build-registry|fetch|verify|filter> [--network all]");
    process.exit(2);
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
