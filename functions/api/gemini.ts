// /api/gemini
// Server-side proxy for Google Gemini API.
// Keeps the API key out of the browser bundle and exposes useful debug details.

interface Env {
  GEMINI_API_KEY?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  VITE_GEMINI_KEY?: string;
  GEMINI_MODEL?: string;
}

type GeminiTask = "chat" | "cv_suggest" | "letter_generate" | "smart_search" | "scholarship_match";

interface GeminiRequest {
  task?: GeminiTask;
  prompt?: string;
  context?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const SYSTEM: Record<GeminiTask, string> = {
  chat: `Es o assistente virtual da Giseveral e Services, empresa em Beira, Mocambique.
Responde sempre em Portugues de Mocambique. Maximo 3 frases por resposta. Se amigavel e directo.

Empresa: Beira, Esturro, Rua Alfredo Lawley. Tel/WhatsApp: 874 383 621. Seg-Sab 8h-17h.

Hub Academico:
- Documentos academicos, exames, trabalhos e livros: /hub/explorar
- Bolsas de estudo internacionais: /hub/bolsas
- Criador de CV profissional: /hub/cv
- Gerador de cartas formais: /hub/cartas
- Noticias e artigos: /hub/noticias

Para pedidos ou orcamentos: WhatsApp 874 383 621 ou loja online (/loja).`,

  cv_suggest: `Es um especialista em curriculos profissionais para o mercado mocambicano, africano e internacional.
Escreve em Portugues formal. Se conciso, impactante e profissional.
Usa verbos de accao fortes. Evita cliches. Foca em resultados e impacto quando possivel.`,

  letter_generate: `Es especialista em cartas formais e de motivacao para candidaturas academicas e profissionais.
Escreve em Portugues formal e elegante. Estrutura: assunto, saudacao, corpo com 3 a 4 paragrafos e encerramento formal.
Se especifico, profissional e persuasivo. Comprimento: 250 a 400 palavras.`,

  smart_search: `Interpreta a pesquisa do utilizador sobre documentos academicos e devolve filtros JSON.
Categorias disponiveis: "exames", "trabalhos", "cvs", "livros".
Responde apenas com JSON valido, sem markdown, no formato exacto: {"q":"termo","cat":"categoria_ou_null"}.`,

  scholarship_match: `Es um especialista em bolsas de estudo. Analisa o perfil do candidato face aos requisitos da bolsa.
Responde APENAS com JSON valido (sem markdown, sem texto extra) no formato exacto pedido no prompt do utilizador.`,
};

const MAX_TOKENS: Record<GeminiTask, number> = {
  chat: 250,
  cv_suggest: 600,
  letter_generate: 1200,
  smart_search: 100,
  scholarship_match: 900,
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function maskKey(key?: string): string {
  if (!key) return "missing";
  if (key.length <= 10) return "***";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function getApiKey(env: Env): string | undefined {
  return env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || env.VITE_GEMINI_KEY;
}

function parseErrorBody(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw.slice(0, 1200);
  }
}

// Models tried in order. The gemini-1.5 family was retired in Sept 2025,
// so we use 2.x as primary with newer/older fallbacks.
const MODEL_FALLBACK_CHAIN = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
] as const;

async function tryModel(
  apiKey: string,
  model: string,
  task: GeminiTask,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; upstream: unknown }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: task === "chat" ? 0.7 : task === "smart_search" ? 0.1 : 0.4,
        maxOutputTokens: MAX_TOKENS[task],
        ...(task === "smart_search" || task === "scholarship_match"
          ? { responseMimeType: "application/json" as const }
          : {}),
      },
    }),
  });

  if (!resp.ok) {
    const raw = await resp.text();
    return { ok: false, status: resp.status, upstream: parseErrorBody(raw) };
  }

  const data = (await resp.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
    promptFeedback?: unknown;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!text) {
    return { ok: false, status: 502, upstream: { error: { message: "Resposta vazia ou bloqueada por segurança." } } };
  }
  return { ok: true, text };
}

async function callGemini(env: Env, body: GeminiRequest) {
  const apiKey = getApiKey(env);
  const task = body.task && body.task in SYSTEM ? body.task : "chat";

  if (!apiKey) {
    return json(
      {
        error: "Gemini API key nao configurada",
        detail: "Configure GEMINI_API_KEY nas variaveis do Cloudflare Pages.",
      },
      503,
    );
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return json({ error: "Prompt obrigatorio" }, 400);
  }

  const systemPrompt = SYSTEM[task];
  const userPrompt = body.context?.trim()
    ? `Contexto: ${body.context.trim()}\n\n${prompt}`
    : prompt;

  // Build the list of models to try: env override first (if set), then the fallback chain.
  const candidates = Array.from(new Set([
    ...(env.GEMINI_MODEL ? [env.GEMINI_MODEL] : []),
    ...MODEL_FALLBACK_CHAIN,
  ]));

  let lastErrorStatus = 502;
  let lastUpstream: unknown = null;
  let lastModel = candidates[0];

  for (const model of candidates) {
    lastModel = model;
    try {
      const result = await tryModel(apiKey, model, task, systemPrompt, userPrompt);
      if (result.ok) {
        return json({ text: result.text, model, keyHint: maskKey(apiKey) });
      }
      lastErrorStatus = result.status;
      lastUpstream = result.upstream;
      console.warn("[gemini] model failed", { model, status: result.status });
      // Stop retrying on auth errors — fallback won't help.
      if (result.status === 401 || result.status === 403) break;
    } catch (error) {
      console.error("[gemini] network error", {
        model,
        message: error instanceof Error ? error.message : String(error),
      });
      lastErrorStatus = 502;
      lastUpstream = { error: { message: error instanceof Error ? error.message : "Network error" } };
    }
  }

  return json(
    {
      error: "Erro Gemini",
      status: lastErrorStatus,
      detail: "Todos os modelos retornaram erro. Veja upstream para detalhes.",
      upstream: lastUpstream,
      keyHint: maskKey(apiKey),
      model: lastModel,
      triedModels: candidates,
    },
    502,
  );
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: CORS_HEADERS });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (url.searchParams.get("test") !== "1") {
    return json({
      ok: true,
      usage: "POST JSON { task: 'chat', prompt: 'diz ola' } or open /api/gemini?test=1",
    });
  }

  return callGemini(context.env, {
    task: "chat",
    prompt: "Diz ola em Portugues numa frase curta.",
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: GeminiRequest;
  try {
    body = (await context.request.json()) as GeminiRequest;
  } catch {
    return json({ error: "JSON invalido" }, 400);
  }

  return callGemini(context.env, body);
};
