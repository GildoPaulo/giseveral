type GeminiTask = "chat" | "cv_suggest" | "letter_generate" | "smart_search" | "scholarship_match";

type GeminiResponse = {
  text?: string;
  error?: string;
  detail?: string;
  status?: number;
  statusText?: string;
  upstream?: unknown;
};

function formatGeminiError(data: GeminiResponse, status: number): string {
  const parts = [
    data.error ?? `AI indisponivel (${status})`,
    data.status ? `Google ${data.status}` : undefined,
    data.statusText,
    data.detail,
  ].filter(Boolean);

  if (data.upstream && typeof data.upstream === "object" && "error" in data.upstream) {
    const upstream = data.upstream as { error?: { message?: string; status?: string } };
    if (upstream.error?.message) parts.push(upstream.error.message);
    if (upstream.error?.status) parts.push(upstream.error.status);
  } else if (typeof data.upstream === "string") {
    parts.push(data.upstream);
  }

  return parts.join(" - ");
}

export async function callGemini(
  task: GeminiTask,
  prompt: string,
  context?: string,
  signal?: AbortSignal,
): Promise<string> {
  const resp = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, prompt, context }),
    signal,
  });

  let data: GeminiResponse = {};
  try {
    data = await resp.json();
  } catch {
    // Keep the status fallback below when the proxy did not return JSON.
  }

  if (!resp.ok || data.error) {
    throw new Error(formatGeminiError(data, resp.status));
  }

  return data.text ?? "";
}

export type { GeminiTask };
