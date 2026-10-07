// Builds dist/index.html (minified, single file) and dist/gemhollow.zip for upload.
// Usage: npm i --no-save esbuild && node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { transformSync } from "esbuild";

const target = ["chrome80", "edge88", "firefox78", "safari15"];   // also validates syntax for older iOS Safari
let html = readFileSync("index.html", "utf8");

html = html.replace(/<style>([\s\S]*?)<\/style>/, (_, css) =>
  `<style>${transformSync(css, { loader: "css", minify: true, target }).code.trim()}</style>`);

html = html.replace(/<script>([\s\S]*?)<\/script>/, (_, js) =>
  `<script>${transformSync(js, { minify: true, target, legalComments: "none" }).code.trim()}</script>`);

html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\n\s*/g, " ");

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
rmSync("dist/gemhollow.zip", { force: true });
try { execFileSync("zip", ["-j", "-q", "dist/gemhollow.zip", "dist/index.html"]); } catch { console.log("zip not found; upload dist/index.html directly"); }
const kb = n => (n / 1024).toFixed(1) + " KB";
console.log("source", kb(readFileSync("index.html").length), "-> dist", kb(html.length));
