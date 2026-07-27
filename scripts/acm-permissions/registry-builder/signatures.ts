import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { NETWORKS } from "../types";

const SIG_RE = /"([A-Za-z_][A-Za-z0-9_]*\([^"()]*\))"/g;

export type ContractSignatures = {
  name: string;
  addresses: Record<string, string[]>;
  signatures: string[];
};

export function extractFromTsHelper(content: string): string[] {
  return unique([...content.matchAll(SIG_RE)].map(m => m[1]));
}

export function extractFromSol(content: string): { signatures: string[]; dynamicCallsites: string[] } {
  const signatures: string[] = [],
    dynamicCallsites: string[] = [];
  const CALL_RE = /(_checkAccessAllowed|checkAccessAllowed|ensureAllowed)\s*\(([^;{}]*?)\)\s*;/g;
  for (const m of content.matchAll(CALL_RE)) {
    const lit = m[2].match(/"([^"]+)"/);
    if (lit) signatures.push(lit[1]);
    else dynamicCallsites.push(m[0].slice(0, 120));
  }
  return { signatures: unique(signatures), dynamicCallsites };
}

export function extractFromAbi(abi: any[]): string[] {
  return unique(
    abi
      .filter(f => f?.type === "function" && f.name)
      .map(f => `${f.name}(${(f.inputs || []).map((i: any) => i.type).join(",")})`),
  );
}

export function buildSignatures(roots: string[]): { contracts: ContractSignatures[]; dynamicCallsites: string[] } {
  const groups = new Map<string, { addresses: Map<string, Set<string>>; signatures: Set<string> }>();
  const dyn: string[] = [];
  const group = (name: string) => {
    let g = groups.get(name);
    if (!g) groups.set(name, (g = { addresses: new Map(), signatures: new Set() }));
    return g;
  };
  for (const root of roots) {
    for (const sol of walk(path.join(root, "contracts"), ".sol")) {
      const r = extractFromSol(fs.readFileSync(sol, "utf8"));
      if (r.signatures.length) {
        const g = group(path.basename(sol, ".sol"));
        r.signatures.forEach(s => g.signatures.add(s));
      }
      dyn.push(...r.dynamicCallsites.map(d => `${sol}: ${d}`));
    }
    const depDir = path.join(root, "deployments");
    for (const j of walk(depDir, ".json")) {
      try {
        const parsed = JSON.parse(fs.readFileSync(j, "utf8"));
        // Standard hardhat-deploy artifacts wrap the ABI ({ abi, address, ... });
        // some repos (e.g. fixed-rate-vaults deployments/abis/) publish the raw ABI array.
        const abi = Array.isArray(parsed) ? parsed : parsed.abi;
        if (!Array.isArray(abi)) continue;
        const sigs = extractFromAbi(abi);
        if (!sigs.length) continue;
        const g = group(path.basename(j, ".json"));
        sigs.forEach(s => g.signatures.add(s));
        const network = path.relative(depDir, j).split(path.sep)[0];
        if (typeof parsed.address === "string" && (NETWORKS as readonly string[]).includes(network)) {
          try {
            const addr = ethers.utils.getAddress(parsed.address);
            if (!g.addresses.has(network)) g.addresses.set(network, new Set());
            g.addresses.get(network)!.add(addr);
          } catch {
            /* malformed address in artifact — keep signatures, skip address */
          }
        }
      } catch {
        /* aggregate/malformed json without an abi — skip */
      }
    }
    const helper = path.join(root, "helpers", "permissions.ts");
    if (fs.existsSync(helper)) {
      const sigs = extractFromTsHelper(fs.readFileSync(helper, "utf8"));
      if (sigs.length) {
        const g = group("_helpers/permissions.ts");
        sigs.forEach(s => g.signatures.add(s));
      }
    }
  }
  const contracts = [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, g]) => ({
      name,
      addresses: Object.fromEntries(
        [...g.addresses.entries()]
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([net, addrs]) => [net, [...addrs].sort()]),
      ),
      signatures: [...g.signatures].sort(),
    }));
  return { contracts, dynamicCallsites: dyn };
}

export function flattenSignatures(contracts: ContractSignatures[]): string[] {
  return [...new Set(contracts.flatMap(c => c.signatures))].sort();
}

const unique = (a: string[]) => [...new Set(a)];
function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.isDirectory() && e.name === "solcInputs") return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : e.name.endsWith(ext) ? [p] : [];
  });
}
