// POST /api/gemini
// Server-side proxy for Google Gemini API.
// Keeps the API key out of the browser bundle.

interface Env {
  GEMINI_API_KEY: string;
}

type GeminiTask = "chat" | "cv_suggest" | "letter_generate" | "smart_search";

interface GeminiRequest {
  task: GeminiTask;
  prompt: string;
  context?: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const SYSTEM: Record<GeminiTask, string> = {
  chat: `És o assistente virtual da Giseveral e Services, empresa em Beira, Moçambique.
Responde SEMPRE em Português (moçambicano). Máximo 3 frases por resposta. Sê amigável e directo.

EMPRESA: Beira, Esturro • Rua Alfredo Lawley · Tel/WhatsApp: 874 383 621 · Seg-Sáb 8h-17h

SERVIÇOS E PREÇOS:
- Impressão P&B: 5 MZN/pág · Cores: 15 MZN/pág · Fotocópia: 3 MZN/pág
- Digitalização: 5 MZN/pág · Encadernação: 50-150 MZN · Plastificação A4: 30 MZN
- Formatação PC: 500 MZN · Windows: 700 MZN · Vírus: 400 MZN
- Router Wi-Fi: 1.500 MZN · Cabeamento/ponto: 200 MZN
- Logotipo: 1.500 MZN · Cartão visita: 300 MZN · Panfleto A5: 400 MZN

HUB ACADÉMICO (giseveral.com/hub):
- Documentos académicos, exames, trabalhos, livros — /hub/explorar
- Bolsas de estudo internacionais — /hub/bolsas
- Criador de CV profissional — /hub/cv
- Gerador de cartas formais — /hub/cartas
- Notícias e artigos — /hub/noticias

Para pedidos ou orçamentos: WhatsApp 874 383 621 ou loja online (/loja).`,

  cv_suggest: `És um especialista em currículos profissionais para o mercado moçambicano, africano e internacional.
Escreve em Português europeu formal. Sê conciso, impactante e profissional.
Usa verbos de acção fortes. Evita clichés. Foca em resultados e impacto quando possível.`,

  letter_generate: `És especialista em cartas formais e de motivação para candidaturas académicas e profissionais em contexto moçambicano.
Escreve em Português formal e elegante. Estrutura: [Assunto], saudação, corpo (3-4 parágrafos), encerramento formal.
Sê específico, profissional e persuasivo. Comprimento: 250-400 palavras.`,

  smart_search: `Interpreta a pesquisa do utilizador sobre documentos académicos e devolve filtros JSON.
Categorias disponíveis: "exames", "trabalhos", "cvs", "livros".
Responde APENAS com JSON válido, sem markdown, no formato exacto: {"q": "termo", "cat": "categoria_ou_null"}`,
};

const MAX_TOKENS: Record<GeminiTask, number> = {
  chat: 250,
  cv_suggest: 600,
  letter_generate: 1200,
  smart_search: 100,
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { GEMINI_API_KEY } = context.env;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "AI não configurado" }), { status: 503, headers: CORS });
  }

  let body: GeminiRequest;
  try {
    body = await context.request.json<GeminiRequest>();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: CORS });
  }

  const task = body.task ?? "chat";
  const systemPrompt = SYSTEM[task] ?? SYSTEM.chat;
  const userPrompt = body.context
    ? `Contexto: ${body.context}\n\n${body.prompt}`
    : body.prompt;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: task === "chat" ? 0.7 : task === "smart_search" ? 0.1 : 0.4,
          maxOutputTokens: MAX_TOKENS[task],
        },
      }),
    }
  );

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "Erro do serviço AI" }), { status: 502, headers: CORS });
  }

  const data = await resp.json() as {
    candidates?: { content: { parts: { text: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return new Response(JSON.stringify({ text }), { status: 200, headers: CORS });
};
