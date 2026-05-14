import { extractJsonObject } from "../_aiJson";

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

  const form = await context.request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Envie um PDF no campo file" }, 400);
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return json({ error: "O ficheiro precisa ser PDF" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const prompt = `Analisa este edital PDF de bolsa de estudos e extrai dados para pre-preencher um formulario de administracao.
Responde APENAS com JSON valido, sem markdown, neste formato:
{
  "title": "",
  "country": "",
  "flag": "",
  "level": "",
  "area": "",
  "coverage": "",
  "language": "",
  "deadline": "",
  "institution": "",
  "description": "",
  "apply_url": "",
  "benefits": [],
  "requirements": [],
  "process_steps": [],
  "documents": [],
  "tips": []
}
Usa portugues mocambicano. Se um campo nao existir, deixa string vazia ou array vazio. O campo apply_url deve ser a fonte oficial se estiver no edital.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "application/pdf", data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!resp.ok) return json({ error: "Erro ao analisar PDF com IA" }, 502);
  const data = await resp.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return json(JSON.parse(extractJsonObject(text)));
  } catch {
    return json({ error: "A IA nao devolveu JSON valido", raw: text }, 502);
  }
};
