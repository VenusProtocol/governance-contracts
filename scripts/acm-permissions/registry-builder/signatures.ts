import * as fs from "fs";
import * as path from "path";

const SIG_RE = /"([A-Za-z_][A-Za-z0-9_]*\([^"()]*\))"/g;

export function extractFromTsHelper(content: string): string[] {
  return unique([...content.matchAll(SIG_RE)].map(m => m[1]));
}

export function extractFromSol(content: string): { signatures: string[]; dynamicCallsites: string[] } {
  const signatures: string[] = [],
    dynamicCallsites: string[] = [];
  const CALL_RE = /(_checkAccessAllowed|checkAccessAllowed)\s*\(([^;]*?)\)\s*;/g;
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

export function buildSignatures(roots: string[]): { signatures: string[]; dynamicCallsites: string[] } {
  const sigs = new Set<string>();
  const dyn: string[] = [];
  for (const root of roots) {
    for (const sol of walk(path.join(root, "contracts"), ".sol")) {
      const r = extractFromSol(fs.readFileSync(sol, "utf8"));
      r.signatures.forEach(s => sigs.add(s));
      dyn.push(...r.dynamicCallsites.map(d => `${sol}: ${d}`));
    }
    for (const j of walk(path.join(root, "deployments"), ".json")) {
      try {
        const { abi } = JSON.parse(fs.readFileSync(j, "utf8"));
        if (Array.isArray(abi)) extractFromAbi(abi).forEach(s => sigs.add(s));
      } catch {
        /* aggregate/malformed json without top-level abi — skip */
      }
    }
    const helper = path.join(root, "helpers", "permissions.ts");
    if (fs.existsSync(helper)) extractFromTsHelper(fs.readFileSync(helper, "utf8")).forEach(s => sigs.add(s));
  }
  return { signatures: [...sigs].sort(), dynamicCallsites: dyn };
}

const unique = (a: string[]) => [...new Set(a)];
function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : e.name.endsWith(ext) ? [p] : [];
  });
}
