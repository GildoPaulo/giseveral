import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist/client");

if (!fs.existsSync(distDir)) {
  console.error("❌ dist/client folder not found");
  process.exit(1);
}

// Apenas _routes.json (wrangler.json não é necessário para Pages)
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: ["/assets/*", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico", "/favicon.ico", "/robots.txt", "/sitemap.xml"],
};
fs.writeFileSync(path.join(distDir, "_routes.json"), JSON.stringify(routesJson, null, 2));
console.log("✅ _routes.json created");

// Apagar wrangler.json se existir (Cloudflare Pages não precisa dele)
const wranglerPath = path.join(distDir, "wrangler.json");
if (fs.existsSync(wranglerPath)) {
  fs.unlinkSync(wranglerPath);
  console.log("✅ wrangler.json removed (not needed for Pages)");
}

console.log("✅ Build ready for Cloudflare Pages!");