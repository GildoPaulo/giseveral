type GeminiTask = "chat" | "cv_suggest" | "letter_generate" | "smart_search";

export async function callGemini(
  task: GeminiTask,
  prompt: string,
  context?: string,
): Promise<string> {
  const resp = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, prompt, context }),
  });
  // Parse JSON even on error to get the actual error message
  let data: { text?: string; error?: string } = {};
  try { data = await resp.json(); } catch { /* ignore */ }
  if (!resp.ok || data.error) {
    const errorMessage = data.error ?? `AI indisponível (${resp.status})`;
    throw new Error(errorMessage);
  }
  return data.text ?? "";
}

export type { GeminiTask };
