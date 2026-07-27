import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { GUARDIANS, REGISTRY_DIR } from "../config";
import { Network } from "../types";

export function buildContractRegistry(network: Network, roots: string[]): Record<string, string> {
  const reg: Record<string, string> = {};
  const put = (addr: string, name: string) => {
    const key = ethers.utils.getAddress(addr);
    if (reg[key] && reg[key] !== name && !reg[key].split(" / ").includes(name)) {
      console.warn(`[registry] name conflict for ${key}: "${reg[key]}" vs "${name}"`);
      reg[key] = `${reg[key]} / ${name}`;
    } else if (!reg[key]) reg[key] = name;
  };
  for (const root of roots) {
    const depDir = path.join(root, "deployments");
    if (!fs.existsSync(depDir)) continue;
    for (const f of fs.readdirSync(depDir)) {
      if (!f.endsWith("_addresses.json")) continue;
      // Some repos name aggregates with underscores (fixed-rate-vaults: bsc_mainnet_addresses.json).
      if (f.slice(0, -"_addresses.json".length).replace(/_/g, "") !== network) continue;
      const { addresses } = JSON.parse(fs.readFileSync(path.join(depDir, f), "utf8"));
      for (const [name, addr] of Object.entries(addresses || {})) put(addr as string, name);
    }
  }
  GUARDIANS[network].forEach((g, i, all) => put(g, all.length > 1 ? `Guardian ${i + 1}` : "Guardian"));
  if (network === "bscmainnet") {
    const f = path.join(REGISTRY_DIR, "legacy-contracts.json");
    for (const c of JSON.parse(fs.readFileSync(f, "utf8")).contracts) {
      if (!reg[ethers.utils.getAddress(c.address)]) put(c.address, `Legacy (${c.origin})`);
    }
  }
  return reg;
}
