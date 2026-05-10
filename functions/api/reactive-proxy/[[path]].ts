interface Env {
  REACTIVE_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

export const onRequest: PagesFunction<Env> = async (context) => {
  const { REACTIVE_API_KEY } = context.env;
  if (!REACTIVE_API_KEY) {
    return new Response(JSON.stringify({ error: "REACTIVE_API_KEY not configured" }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Extract the path after /api/reactive-proxy/
  const url = new URL(context.request.url);
  const pathParam = (context.params as Record<string, string | string[]>).path;
  const subPath = Array.isArray(pathParam) ? pathParam.join("/") : (pathParam ?? "");

  const upstream = `https://rxresu.me/api/v1/${subPath}${url.search}`;

  const init: RequestInit = {
    method: context.request.method,
    headers: {
      Authorization: `Bearer ${REACTIVE_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = await context.request.text();
  }

  const upstream_res = await fetch(upstream, init);
  const body = await upstream_res.arrayBuffer();

  return new Response(body, {
    status: upstream_res.status,
    headers: {
      ...CORS,
      "Content-Type": upstream_res.headers.get("Content-Type") ?? "application/json",
    },
  });
};
