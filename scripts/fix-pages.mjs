import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist/client");

if (!fs.existsSync(distDir)) {
  console.error("❌ dist/client folder not found");
  process.exit(1);
}

// _routes.json — controla o que VAI para o worker. Tudo que entra no "exclude"
// é servido como static asset. NÃO incluir /api/* aqui — Cloudflare Pages
// Functions têm prioridade sobre o worker SSR para os caminhos /api/* desde
// que existam em functions/. Se colocarmos /api/* em "exclude", Pages tenta
// servir como ficheiro estático e POST devolve 405 ("Method Not Allowed").
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/assets/*",
    "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg", "/*.ico", "/*.webp",
    "/favicon.ico", "/favicon.svg", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/sw.js",
  ],
};
fs.writeFileSync(path.join(distDir, "_routes.json"), JSON.stringify(routesJson, null, 2));
console.log("✅ _routes.json created");

// Copy functions/ (root) to dist/client/functions so wrangler pages deploy
// picks them up when pages_build_output_dir is dist/client.
const srcFns = path.resolve(__dirname, "../functions");
const dstFns = path.join(distDir, "functions");
if (fs.existsSync(srcFns)) {
  fs.cpSync(srcFns, dstFns, { recursive: true });
  console.log("✅ functions/ copied to dist/client/functions");
}

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