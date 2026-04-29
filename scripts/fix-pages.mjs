import { writeFileSync, copyFileSync, cpSync } from 'node:fs'

// 1. Merge server-side assets into dist/client/assets/
cpSync('dist/server/assets', 'dist/client/assets', { recursive: true })

// 2. Place _worker.js in the Pages output dir (original approach — self-contained bundle)
copyFileSync('dist/server/server.js', 'dist/client/_worker.js')

// 3. Create _routes.json so Pages CDN serves /assets/* directly (bypasses the worker).
//    Without this, the worker intercepts every /assets/* request and 404s static files.
writeFileSync('dist/client/_routes.json', JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*'],
}, null, 2) + '\n')

// 4. Replace the Worker-specific wrangler.json with a valid Pages config
writeFileSync('dist/client/wrangler.json', JSON.stringify({
  name: 'giseveral',
  compatibility_date: '2025-09-24',
  compatibility_flags: ['nodejs_compat'],
  pages_build_output_dir: '.'
}, null, 2) + '\n')

console.log('✓ Pages build ready: assets merged, _worker.js placed, _routes.json written, wrangler.json patched')
