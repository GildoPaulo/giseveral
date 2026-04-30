import { writeFileSync, copyFileSync, cpSync, readdirSync } from 'node:fs'

// 1. Merge server-side assets into dist/client/assets/
cpSync('dist/server/assets', 'dist/client/assets', { recursive: true })

// 2. Place _worker.js in the Pages output dir
copyFileSync('dist/server/server.js', 'dist/client/_worker.js')

// 3. Copy the hashed CSS file to a fixed name so the SSR fallback href
//    (/assets/styles.css) always resolves — the ?url import in server.js
//    may resolve to undefined in the Cloudflare Worker context.
const cssFiles = readdirSync('dist/client/assets').filter(
  (f) => f.endsWith('.css') && f !== 'styles.css'
)
if (cssFiles.length > 0) {
  copyFileSync(`dist/client/assets/${cssFiles[0]}`, 'dist/client/assets/styles.css')
  console.log(`✓ CSS aliased: ${cssFiles[0]} → styles.css`)
}

// 4. Create _routes.json so Pages CDN serves /assets/* directly (bypasses the worker).
//    Without this, the worker intercepts every /assets/* request and 404s CSS/JS/images.
writeFileSync('dist/client/_routes.json', JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*'],
}, null, 2) + '\n')

// 5. Replace the Worker-specific wrangler.json with a valid Pages config
writeFileSync('dist/client/wrangler.json', JSON.stringify({
  name: 'giseveral',
  compatibility_date: '2025-09-24',
  compatibility_flags: ['nodejs_compat'],
  pages_build_output_dir: '.'
}, null, 2) + '\n')

console.log('✓ Pages build ready: assets merged, _worker.js placed, CSS aliased, _routes.json written, wrangler.json patched')
