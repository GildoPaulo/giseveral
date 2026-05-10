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
  exclude: ["/assets/*", "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg", "/*.ico", "/favicon.ico", "/robots.txt", "/sitemap.xml"],
};
fs.writeFileSync(path.join(distDir, "_routes.json"), JSON.stringify(routesJson, null, 2));
console.log("✅ _routes.json created");

// NÃO apagar dist/client/wrangler.json — o Cloudflare Pages precisa dele para saber
// onde está o worker SSR (aponta para dist/server/server.js).
// Apagar APENAS .wrangler/deploy/config.json para evitar erros de "redirected config path"
// quando o ficheiro fica stale no repo local entre builds.
const wranglerDeployConfig = path.resolve(__dirname, "../.wrangler/deploy/config.json");
if (fs.existsSync(wranglerDeployConfig)) {
  fs.unlinkSync(wranglerDeployConfig);
  console.log("✅ .wrangler/deploy/config.json removed (stale pointer)");
}

console.log("✅ Build ready for Cloudflare Pages!");