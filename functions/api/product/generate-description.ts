/**
 * GISEVERAL PRODUCT DESCRIPTION GENERATOR
 * ========================================
 * Generates professional product descriptions using Gemini AI
 * Used in admin product form
 */

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
  if (!GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY não configurada" }, 503);
  }

  let body: { name?: string; category?: string; brand?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const name = body.name?.trim();
  if (!name) {
    return json({ error: "Informe o nome do produto" }, 400);
  }

  const category = body.category?.trim() || "geral";
  const brand = body.brand?.trim() || "";

  const prompt = `Gera uma descrição profissional para venda online de um produto.

Produto: ${name}
Categoria: ${category}
${brand ? `Marca: ${brand}` : ""}

Escreve uma descrição em português de Moçambique:
- 2 a 3 parágrafos curtos (150-250 palavras no total)
- Destaca benefícios e características principais
- Usa linguagem persuasiva mas natural
- Foca em como o produto resolve problemas ou facilita a vida
- Adequado para e-commerce/marketplace
- SEO-friendly com palavras-chave naturais

Responde APENAS com o texto da descrição, sem markdown, sem título, sem aspas. Vai direto ao conteúdo.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 600,
          },
        }),
      },
    );

    if (!resp.ok) {
      const error = await resp.text();
      console.error("[product-description] Gemini error:", error);
      return json({
        error: "Erro ao gerar descrição com IA",
        detail: error.substring(0, 200),
      }, 502);
    }

    const data = await resp.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text.trim()) {
      return json({
        error: "IA não devolveu texto",
        detail: "Resposta vazia do Gemini",
      }, 502);
    }

    // Clean up any markdown artifacts
    const cleaned = text
      .replace(/```/g, "")
      .replace(/^#+\s+/gm, "")
      .trim();

    return json({ description: cleaned });
  } catch (error) {
    console.error("[product-description] Error:", error);
    return json({
      error: "Erro ao conectar com IA",
      detail: error instanceof Error ? error.message : String(error),
    }, 500);
  }
};
