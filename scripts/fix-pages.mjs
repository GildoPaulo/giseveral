import { writeFileSync, copyFileSync } from 'node:fs'

// Cloudflare Pages expects _worker.js in the output dir for SSR
copyFileSync('dist/server/server.js', 'dist/client/_worker.js')

// Replace the Worker-specific wrangler.json with a valid Pages config
// pages_build_output_dir is required — without it Pages deems the config invalid and skips _worker.js
writeFileSync('dist/client/wrangler.json', JSON.stringify({
  name: 'giseveral',
  compatibility_date: '2025-09-24',
  compatibility_flags: ['nodejs_compat'],
  pages_build_output_dir: 'dist/client'
}, null, 2) + '\n')

console.log('✓ Pages build ready: _worker.js copied, wrangler.json patched')
