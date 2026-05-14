/** Same logic as src/lib/ai-json.ts extractJsonObject — workers bundle cannot import src. */
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
