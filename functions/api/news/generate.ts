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

function cleanJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
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
  "excerpt": "resumo/meta description com 100-160 caracteres",
  "content": "artigo completo em portugues, 500-800 palavras, com paragrafos separados por duas quebras de linha",
  "keyword": "palavra-chave principal",
  "imagePrompt": "termos de busca para imagem de capa",
  "youtubeQuery": "termo para pesquisar video YouTube relacionado",
  "sources": ["links oficiais/confiaveis sugeridos"]
}
Escreve em portugues mocambicano, claro e util. Inclui contexto local quando fizer sentido.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 2200 },
      }),
    },
  );

  if (!resp.ok) return json({ error: "Erro ao gerar noticia com IA" }, 502);
  const data = await resp.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return json(JSON.parse(cleanJson(text)));
  } catch {
    return json({ error: "A IA nao devolveu JSON valido", raw: text }, 502);
  }
};
