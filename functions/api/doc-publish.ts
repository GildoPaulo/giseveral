// POST /api/doc-publish
// Auto-approves user-submitted documents server-side.
// Validates title uniqueness, category, content rules, then publishes immediately
// and grants +2 credits to the submitter.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Payload {
  title: string;
  author: string;
  category: string;
  description: string;
  tags: string[];
  pages: number;
  file_url: string;
  cover_hue: number;
  cover_image_url?: string | null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const VALID_CATEGORIES = ["exames", "trabalhos", "cvs", "livros"];

// Extend as needed
const BANNED_PATTERNS = [/\bporn\b/i, /\bxxx\b/i, /\bspam\b/i];

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 503, headers: CORS });
  }

  // ── Auth: validate user token ──────────────────────────────────────────────
  const token = context.request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: CORS });
  }
  const { id: user_id } = await userRes.json() as { id: string };

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload: Payload;
  try {
    payload = await context.request.json<Payload>();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { title, author, category, description, tags, pages, file_url, cover_hue, cover_image_url } = payload;

  // ── Validation rules ───────────────────────────────────────────────────────
  if (!title?.trim() || title.trim().length < 3) {
    return new Response(JSON.stringify({ error: "Título muito curto (mínimo 3 caracteres)" }), { status: 422, headers: CORS });
  }
  if (!description?.trim() || description.trim().length < 10) {
    return new Response(JSON.stringify({ error: "Descrição muito curta (mínimo 10 caracteres)" }), { status: 422, headers: CORS });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return new Response(JSON.stringify({ error: "Categoria inválida" }), { status: 422, headers: CORS });
  }
  if (!file_url) {
    return new Response(JSON.stringify({ error: "Ficheiro inválido" }), { status: 422, headers: CORS });
  }

  const combinedText = `${title} ${description}`.toLowerCase();
  for (const pat of BANNED_PATTERNS) {
    if (pat.test(combinedText)) {
      return new Response(JSON.stringify({ error: "Conteúdo não permitido" }), { status: 422, headers: CORS });
    }
  }

  // ── Duplicate title check ──────────────────────────────────────────────────
  const dupeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/hub_documents?title=ilike.${encodeURIComponent(title.trim())}&select=id&limit=1`,
    { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } }
  );
  const dupes = await dupeRes.json() as { id: string }[];
  if (dupes.length > 0) {
    return new Response(JSON.stringify({ error: "Já existe um documento com este título" }), { status: 409, headers: CORS });
  }

  // ── Insert document (published immediately) ────────────────────────────────
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/hub_documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      title: title.trim(),
      author: author?.trim() || "Anónimo",
      category,
      description: description.trim(),
      tags: tags ?? [],
      pages: pages > 0 ? pages : 1,
      file_url,
      cover_hue: cover_hue ?? Math.floor(Math.random() * 360),
      cover_image_url: cover_image_url ?? null,
      user_id,
      published: true,
      premium: false,
      downloads: 0,
      views: 0,
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.json().catch(() => ({})) as { message?: string };
    return new Response(JSON.stringify({ error: err.message ?? "Erro ao guardar documento" }), { status: 500, headers: CORS });
  }

  const [doc] = await insertRes.json() as { id: string }[];

  // ── Grant +2 credits to submitter ─────────────────────────────────────────
  try {
    const credRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=hub_credits`,
      { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } }
    );
    const [profile] = await credRes.json() as { hub_credits?: number }[];
    const current = profile?.hub_credits ?? 0;

    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ hub_credits: current + 2 }),
    });
  } catch {
    // Credits are best-effort; document is already published
  }

  return new Response(JSON.stringify({ id: doc.id, published: true, credits_granted: 2 }), {
    status: 201,
    headers: CORS,
  });
};
