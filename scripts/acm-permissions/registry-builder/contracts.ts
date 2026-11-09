import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { GUARDIANS, REGISTRY_DIR } from "../config";
import { Network } from "../types";

// Records a name for an address, joining genuinely different names as "A / B" rather than letting
// one deployment's name silently win over another's.
function put(reg: Record<string, string>, addr: string, name: string): void {
  const key = ethers.utils.getAddress(addr);
  if (!reg[key]) {
    reg[key] = name;
    return;
  }
  if (reg[key] === name || reg[key].split(" / ").includes(name)) return;
  console.warn(`[registry] name conflict for ${key}: "${reg[key]}" vs "${name}"`);
  reg[key] = `${reg[key]} / ${name}`;
}

// Pulls the names out of one repo's `<network>_addresses.json` aggregates.
function addRepoAddresses(reg: Record<string, string>, root: string, network: Network): void {
  const depDir = path.join(root, "deployments");
  if (!fs.existsSync(depDir)) return;
  for (const f of fs.readdirSync(depDir)) {
    if (!f.endsWith("_addresses.json")) continue;
    // Some repos name aggregates with underscores (fixed-rate-vaults: bsc_mainnet_addresses.json).
    if (f.slice(0, -"_addresses.json".length).replace(/_/g, "") !== network) continue;
    const { addresses } = JSON.parse(fs.readFileSync(path.join(depDir, f), "utf8"));
    for (const [name, addr] of Object.entries(addresses || {})) put(reg, addr as string, name);
  }
}

export function buildContractRegistry(network: Network, roots: string[]): Record<string, string> {
  const reg: Record<string, string> = {};
  for (const root of roots) addRepoAddresses(reg, root, network);
  GUARDIANS[network].forEach((g, i, all) => put(reg, g, all.length > 1 ? `Guardian ${i + 1}` : "Guardian"));
  if (network === "bscmainnet") {
    const f = path.join(REGISTRY_DIR, "legacy-contracts.json");
    for (const c of JSON.parse(fs.readFileSync(f, "utf8")).contracts) {
      if (!reg[ethers.utils.getAddress(c.address)]) put(reg, c.address, `Legacy (${c.origin})`);
    }
  }
  return reg;
}
