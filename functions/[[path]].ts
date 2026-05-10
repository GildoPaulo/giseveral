// @ts-nocheck
// Catch-all SSR handler — forwards every non-asset request to the
// TanStack Start server built at dist/server/server.js.
// Static assets (/assets/*, *.png, etc.) are excluded via _routes.json
// and served directly by Cloudflare Pages without invoking this function.
import server from "../dist/server/server.js";

export const onRequest = (context) =>
  server.fetch(context.request, context.env, context.executionCtx);
