#!/usr/bin/env node
// Builds the self-contained viewer (index.html) from src/, assets/ and scripts/.
// The collector scripts are embedded as base64 downloads, images as data URIs.
// Usage: node build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p));
const text = (p) => read(p).toString("utf8");

function embedScript(file, versionPattern) {
  const buf = read(join("scripts", file));
  const src = buf.toString("utf8");
  const version = (src.match(versionPattern) || [])[1];
  if (!version) throw new Error(`No version found in ${file}`);
  if (/[^\x00-\x7F]/.test(src)) throw new Error(`${file} must be ASCII-only (Windows PowerShell 5.1 reads BOM-less files as ANSI)`);
  return {
    name: file,
    version,
    bytes: buf.length,
    lines: src.split("\n").length - (src.endsWith("\n") ? 1 : 0),
    sha256: createHash("sha256").update(buf).digest("hex"),
    b64: buf.toString("base64"),
  };
}

const embed = {
  ps1: embedScript("Get-CopilotCostInventory.ps1", /\$ScriptVersion\s*=\s*'([^']+)'/),
  sh: embedScript("get-copilot-cost-inventory.sh", /const VERSION = "([^"]+)"/),
};

const js = ["core.js", "demo.js", "render.js", "main.js"].map((f) => text(join("src", f))).join("\n");
const jsWithEmbed = js.replace(/\/\*@EMBED@\*\/[\s\S]*?\/\*@END@\*\//, () => `/*@EMBED@*/ ${JSON.stringify(embed)} /*@END@*/`);
if (jsWithEmbed === js) throw new Error("EMBED marker not found in src/core.js");
if (/<\/script|<!--/i.test(jsWithEmbed)) throw new Error("Inline JS must not contain </script or <!--");

let html = text("src/template.html")
  .replace("/*@CSS@*/", () => text("src/styles.css"))
  .replace("/*@JS@*/", () => jsWithEmbed);

const dataUri = (file, ext) => `data:${ext === "svg" ? "image/svg+xml" : "image/png"};base64,${read(join("assets", file)).toString("base64")}`;
html = html
  .replace(/(src|href)="assets\/([\w.-]+\.(png|svg))"/g, (_, attr, file, ext) => `${attr}="${dataUri(file, ext)}"`)
  .replace(/url\(["']?assets\/([\w.-]+\.(png|svg))["']?\)/g, (_, file, ext) => `url("${dataUri(file, ext)}")`);
if (/="assets\/|url\(["']?assets\//.test(html)) throw new Error("Unresolved asset reference");

writeFileSync(join(root, "index.html"), html);
console.log(`index.html written: ${(html.length / 1024).toFixed(1)} KB` +
  ` | ${embed.ps1.name} v${embed.ps1.version} ${embed.ps1.sha256.slice(0, 12)}` +
  ` | ${embed.sh.name} v${embed.sh.version} ${embed.sh.sha256.slice(0, 12)}`);
