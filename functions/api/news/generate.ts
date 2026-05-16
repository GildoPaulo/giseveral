// Inlined to avoid relative-import bundling issues across Pages Functions
// subdirectories — wrangler was failing to resolve "../_aiJson" silently,
// causing /api/news/generate to fall through to the SPA catch-all (HTML 404).
function extractJsonObject(raw: string): string {
  let s = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const lower = s.toLowerCase();
  const doctype = lower.indexOf("<!doctype");
  const htmlOpen = lower.indexOf("<html");
  const firstBrace = s.indexOf("{");
  if (firstBrace < 0) return s;
  if (doctype >= 0 && firstBrace > doctype + 80) s = s.slice(firstBrace);
  else if (htmlOpen >= 0 && firstBrace > htmlOpen + 40) s = s.slice(firstBrace);
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end < start) return s;
  return s.slice(start, end + 1);
}

interface Env {
  GEMINI_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GEMINI_API_KEY } = context.env;
  if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY nao configurada" }, 503);

  let body: { topic?: string; category?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON invalido" }, 400);
  }

  const topic = body.topic?.trim();
  if (!topic) return json({ error: "Informe o tema da noticia" }, 400);

  const prompt = `Gera uma noticia/artigo para o site Giseveral e Services, na Beira, Mocambique.
Tema: ${topic}
Categoria: ${body.category || "Dicas"}

Responde APENAS com JSON valido, sem markdown:
{
  "title": "titulo SEO com 40-70 caracteres",
  "suggested_slug": "url-limpa-so-minusculas-e-numeros-sem-espacos",
  "excerpt": "resumo/meta description com 100-160 caracteres",
  "content": "artigo completo em HTML simples: use <h2>, <h3>, <p>, <ul><li>, <strong>, <a href>. 500-900 palavras. Paragrafos claros.",
  "keyword": "palavra-chave principal",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "hashtags": ["#Giseveral", "#Beira", "#Mocambique"],
  "imagePrompt": "termos de busca para imagem de capa",
  "youtubeQuery": "termo para pesquisar video YouTube relacionado",
  "sources": ["links oficiais/confiaveis sugeridos"]
}
O suggested_slug deve ser unico, curto e descritivo (ex: bolsas-canada-2026).
Escreve em portugues mocambicano, claro e util. Inclui contexto local quando fizer sentido.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 2200,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!resp.ok) return json({ error: "Erro ao gerar noticia com IA" }, 502);
  const data = await resp.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return json(JSON.parse(extractJsonObject(text)));
  } catch {
    return json({ error: "A IA nao devolveu JSON valido", raw: text }, 502);
  }
};
