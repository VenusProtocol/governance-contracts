import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { REGISTRY_DIR, TOOL_DIR } from "../config";

export type Source =
  | { type: "local"; path: string }
  | { type: "npm"; package: string; version: string }
  | { type: "git"; url: string; ref: string };
const CACHE = path.join(TOOL_DIR, ".sources-cache");

export function loadManifest(): Source[] {
  const { sources } = JSON.parse(fs.readFileSync(path.join(REGISTRY_DIR, "sources.json"), "utf8"));
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("sources.json: empty or invalid");
  for (const s of sources) {
    if (s.type === "npm" && (!s.package || !s.version))
      throw new Error(`npm source needs package+version: ${JSON.stringify(s)}`);
    if (s.type === "git" && (!s.url || !s.ref)) throw new Error(`git source needs url+ref: ${JSON.stringify(s)}`);
  }
  return sources;
}

export const npmTarballUrl = (pkg: string, version: string) =>
  `https://registry.npmjs.org/${pkg}/-/${pkg.split("/").pop()}-${version}.tgz`;

export function resolveSource(src: Source): string {
  if (src.type === "local") return path.resolve(REGISTRY_DIR, src.path);
  if (src.type === "npm") {
    // Prefer an already-installed copy at the exact pinned version.
    const installed = path.resolve(TOOL_DIR, "../../node_modules", src.package);
    try {
      const v = JSON.parse(fs.readFileSync(path.join(installed, "package.json"), "utf8")).version;
      if (v === src.version) return installed;
    } catch {
      /* not installed — fall through to cache */
    }
    const dir = path.join(CACHE, "npm", `${src.package.replace("/", "__")}@${src.version}`);
    const sentinel = path.join(dir, ".complete");
    if (!fs.existsSync(sentinel) || !fs.existsSync(path.join(dir, "package.json"))) {
      // Self-heal: a dir without the sentinel is a partial download/extract — wipe and redo.
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const tgz = path.join(dir, "pkg.tgz");
      execSync(`curl -sSfL "${npmTarballUrl(src.package, src.version)}" -o "${tgz}"`, { stdio: "inherit" });
      execSync(`tar -xzf "${tgz}" -C "${dir}" --strip-components=1`, { stdio: "inherit" });
      fs.unlinkSync(tgz);
      fs.writeFileSync(sentinel, "");
    }
    return dir;
  }
  // git — cache key derived from the full URL (host+org+repo) + ref to avoid collisions
  // between same-named repos from different hosts/orgs.
  const dir = path.join(CACHE, "git", `${src.url}#${src.ref}`.replace(/[^A-Za-z0-9@._-]/g, "_"));
  const sentinel = path.join(dir, ".complete");
  if (!fs.existsSync(sentinel) || !fs.existsSync(path.join(dir, ".git"))) {
    // Self-heal: a dir without the sentinel (or .git) is an interrupted clone — wipe and redo.
    fs.rmSync(dir, { recursive: true, force: true });
    execSync(`git clone --depth 1 --branch "${src.ref}" "${src.url}" "${dir}"`, { stdio: "inherit" });
    fs.writeFileSync(sentinel, "");
  }
  return dir;
}
