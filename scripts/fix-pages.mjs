import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist/client");

if (!fs.existsSync(distDir)) {
  console.error("❌ dist/client folder not found");
  process.exit(1);
}

// _routes.json
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: ["/assets/*", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico", "/favicon.ico", "/robots.txt", "/sitemap.xml"],
};
fs.writeFileSync(path.join(distDir, "_routes.json"), JSON.stringify(routesJson, null, 2));
console.log("✅ _routes.json");

// wrangler.json (APENAS Pages, sem "main")
const wranglerJson = {
  pages_build_output_dir: "client",
  compatibility_date: "2025-03-21",
  compatibility_flags: ["nodejs_compat"],
};
fs.writeFileSync(path.join(distDir, "wrangler.json"), JSON.stringify(wranglerJson, null, 2));
console.log("✅ wrangler.json (Pages only)");

console.log("✅ Build pronto para Pages!");