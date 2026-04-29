import { writeFileSync, copyFileSync, cpSync } from 'node:fs'

// 1. Merge server-side assets into dist/client/assets/
cpSync('dist/server/assets', 'dist/client/assets', { recursive: true })

// 2. Copy server entry as ssr.js (NOT _worker.js — we wrap it below)
copyFileSync('dist/server/server.js', 'dist/client/ssr.js')

// 3. Create _worker.js wrapper that:
//    - proxies /assets/* requests to Pages CDN via env.ASSETS
//      (without this the worker intercepts and 404s every CSS/JS/image request)
//    - delegates everything else to the SSR handler (ssr.js)
writeFileSync('dist/client/_worker.js', `let _ssr = null

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url)

    // Static assets — let Pages CDN serve them
    if (pathname.startsWith('/assets/') && env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    // Lazy-load the SSR handler once
    if (!_ssr) {
      const mod = await import('./ssr.js')
      _ssr = mod.default
    }
    return _ssr.fetch(request, env, ctx)
  }
}
`)

// 4. Write a valid Pages wrangler.json
//    pages_build_output_dir: '.' = "this directory" (dist/client/)
writeFileSync('dist/client/wrangler.json', JSON.stringify({
  name: 'giseveral',
  compatibility_date: '2025-09-24',
  compatibility_flags: ['nodejs_compat'],
  pages_build_output_dir: '.'
}, null, 2) + '\n')

console.log('✓ Pages build ready: assets merged, _worker.js wrapper created, wrangler.json patched')
