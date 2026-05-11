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
  if (!resp.ok) throw new Error("AI indisponível");
  const data = await resp.json() as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.text ?? "";
}

export type { GeminiTask };
