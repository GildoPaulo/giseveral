import { writeFileSync, copyFileSync, cpSync } from 'node:fs'

// 1. Merge server-side assets into dist/client/assets/
//    (_worker.js does import("./assets/...") so they must be colocated)
cpSync('dist/server/assets', 'dist/client/assets', { recursive: true })

// 2. Place _worker.js in the Pages output dir
copyFileSync('dist/server/server.js', 'dist/client/_worker.js')

// 3. Replace the Worker-specific wrangler.json with a valid Pages config
//    pages_build_output_dir: '.' means "this directory" (dist/client/)
writeFileSync('dist/client/wrangler.json', JSON.stringify({
  name: 'giseveral',
  compatibility_date: '2025-09-24',
  compatibility_flags: ['nodejs_compat'],
  pages_build_output_dir: '.'
}, null, 2) + '\n')

console.log('✓ Pages build ready: server assets merged, _worker.js copied, wrangler.json patched')
