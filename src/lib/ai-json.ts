/**
 * Extract a single JSON object from LLM output that may include markdown fences,
 * prose, or accidental HTML wrappers (e.g. "<!DOCTYPE ...") when proxies return HTML errors.
 */
export function extractJsonObject(raw: string): string {
  let s = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const lower = s.toLowerCase();
  const doctype = lower.indexOf("<!doctype");
  const htmlOpen = lower.indexOf("<html");
  const firstBrace = s.indexOf("{");
  if (firstBrace < 0) return s;
  if (doctype >= 0 && firstBrace > doctype + 80) {
    s = s.slice(firstBrace);
  } else if (htmlOpen >= 0 && firstBrace > htmlOpen + 40) {
    s = s.slice(firstBrace);
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end < start) return s;
  return s.slice(start, end + 1);
}

export function parseJsonFromAi<T = unknown>(raw: string): T {
  const slice = extractJsonObject(raw);
  return JSON.parse(slice) as T;
}

/** Parse fetch body as JSON; if the server returned HTML (DOCTYPE), throw a clear error. */
export async function readJsonOrThrow<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Resposta vazia do servidor");
  if (trimmed.startsWith("<") || trimmed.toLowerCase().startsWith("<!doctype")) {
    throw new Error(
      "O servidor devolveu HTML em vez de JSON (API ou rota /api indisponível). Verifica o deploy e as variáveis de ambiente.",
    );
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error("Resposta JSON inválida do servidor");
  }
}
