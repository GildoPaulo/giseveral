import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, X, AlertCircle, Gauge } from "lucide-react";
import { callGemini } from "@/services/gemini";
import type { CvData } from "./types";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

type AtsResult = {
  score: number;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
};

function cvToText(data: CvData): string {
  const lines: string[] = [];
  lines.push(`# ${data.personal.nome ?? ""} ${data.personal.apelido ?? ""}`.trim());
  if (data.personal.titulo) lines.push(data.personal.titulo);
  if (data.objetivo) lines.push(`\nResumo: ${data.objetivo}`);

  if (data.experiencia.length) {
    lines.push("\nExperiência:");
    for (const e of data.experiencia) {
      lines.push(`- ${e.cargo} @ ${e.empresa} (${e.inicio} – ${e.atual ? "Presente" : e.fim})`);
      if (e.descricao) lines.push(`  ${e.descricao}`);
    }
  }

  if (data.educacao.length) {
    lines.push("\nEducação:");
    for (const e of data.educacao) {
      lines.push(`- ${e.grau} em ${e.curso}, ${e.instituicao} (${e.anoInicio}–${e.anoFim})`);
    }
  }

  if (data.skills.length) {
    lines.push("\nCompetências:");
    lines.push(data.skills.map((s) => `${s.nome} (${s.nivel})`).join(", "));
  }

  if (data.idiomas.length) {
    lines.push("\nIdiomas:");
    lines.push(data.idiomas.map((i) => `${i.idioma} (${i.nivel})`).join(", "));
  }

  if (data.projetos.length) {
    lines.push("\nProjectos:");
    for (const p of data.projetos) {
      lines.push(`- ${p.nome}: ${p.descricao} [${p.tecnologias}]`);
    }
  }

  if (data.certificacoes.length) {
    lines.push("\nCertificações:");
    for (const c of data.certificacoes) lines.push(`- ${c.nome} (${c.emissor}, ${c.data})`);
  }

  return lines.join("\n");
}

function toStringArray(value: unknown, max: number): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : v == null ? "" : String(v)))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);
  }
  if (typeof value === "string") {
    // Split on newlines or bullet markers; fall back to commas.
    const lines = value
      .split(/\r?\n|•|^[-*\d.)]\s+/m)
      .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter((s) => s.length > 2);
    if (lines.length > 1) return lines.slice(0, max);
    return value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, max);
  }
  return [];
}

function parseAtsResponse(raw: string): AtsResult | null {
  // 1) Try strict JSON parse.
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      return {
        score: Math.max(0, Math.min(100, Number(obj.score ?? obj.ats ?? obj.total ?? 0))),
        strengths: toStringArray(obj.strengths ?? obj.pontosFortes ?? obj.pros, 6),
        improvements: toStringArray(obj.improvements ?? obj.melhorias ?? obj.suggestions, 6),
        missingKeywords: toStringArray(obj.missingKeywords ?? obj.keywords ?? obj.palavrasChave, 12),
      };
    }
  } catch { /* fall through */ }

  // 2) Heuristic: extract the first number 0-100 as score, and try to find
  //    bullet lists with words like "fortes", "melhorias", "palavras".
  const score = (() => {
    const m = raw.match(/(\d{1,3})\s*(?:\/\s*100|%|pontos|points)?/);
    if (!m) return 0;
    const n = Number(m[1]);
    return Math.max(0, Math.min(100, isNaN(n) ? 0 : n));
  })();

  const section = (regex: RegExp): string[] => {
    const m = raw.match(regex);
    if (!m) return [];
    const block = m[0];
    return block
      .split(/\r?\n/)
      .slice(1)
      .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter((l) => l.length > 3)
      .slice(0, 6);
  };

  if (score > 0) {
    return {
      score,
      strengths: section(/(?:pontos\s*fortes|strengths)[\s\S]{0,400}/i),
      improvements: section(/(?:melhorias|improvements|sugest)[\s\S]{0,400}/i),
      missingKeywords: section(/(?:palavras[-\s]chave|keywords|missing)[\s\S]{0,400}/i),
    };
  }
  return null;
}

export function AtsPanel({ data }: { data: CvData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const cvText = cvToText(data);
      const prompt = `Analisa este CV face a sistemas ATS (Applicant Tracking Systems) usados por recrutadores. Devolve APENAS JSON (sem markdown, sem texto fora) no formato:
{
  "score": 0-100,
  "strengths": ["ponto forte 1", "ponto forte 2", ...],
  "improvements": ["melhoria concreta 1", ...],
  "missingKeywords": ["palavra-chave 1", "palavra-chave 2", ...]
}

Critérios:
- 25 pontos por palavras-chave técnicas alinhadas com a função-alvo.
- 25 pontos por descrições de experiência com verbos de acção e métricas/impacto.
- 20 pontos por estrutura clara (secções, hierarquia, datas formatadas).
- 15 pontos por competências relevantes para a área.
- 15 pontos por completude (telefone, email, localização, etc.).

CV:
${cvText}`;

      const text = await callGemini("ats_score", prompt);
      const parsed = parseAtsResponse(text);
      if (!parsed) {
        setError("A IA devolveu texto inválido. Tenta novamente.");
        return;
      }
      setResult(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro a contactar a IA.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-600 bg-emerald-500/10"
    : s >= 60 ? "text-amber-600 bg-amber-500/10"
    : "text-rose-600 bg-rose-500/10";

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); if (!result) run(); }}
        className="w-full inline-flex items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2.5 text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5" /> Analisar ATS Score
        </span>
        <Sparkles className="h-3.5 w-3.5 text-gold" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-md bg-background shadow-2xl overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-5 py-4">
                <h2 className="text-base font-bold text-foreground inline-flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-brand" /> ATS Score
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {loading && (
                  <div className="grid place-items-center py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand" />
                    <p className="mt-3 text-sm font-semibold text-foreground">A analisar o teu CV…</p>
                    <p className="mt-1 text-xs text-muted-foreground">Vamos pontuar palavras-chave, estrutura e impacto.</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">Análise falhou</p>
                      <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{error}</p>
                      <button
                        type="button"
                        onClick={run}
                        className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2.5 py-1 text-[11px] font-bold hover:opacity-90 transition-opacity"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                )}

                {result && !loading && (
                  <>
                    {/* Score */}
                    <div className={`rounded-2xl border border-border p-5 text-center ${scoreColor(result.score)}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Score ATS</p>
                      <p className="mt-1 text-5xl font-extrabold tabular-nums">{result.score}<span className="text-2xl opacity-70">/100</span></p>
                      <p className="mt-1 text-xs font-semibold">
                        {result.score >= 80 ? "Excelente — pronto para enviar"
                        : result.score >= 60 ? "Bom — algumas melhorias podem ajudar"
                        : "Precisa de trabalho — segue as sugestões abaixo"}
                      </p>
                    </div>

                    {result.strengths.length > 0 && (
                      <section>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pontos fortes</p>
                        <ul className="space-y-1.5">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {result.improvements.length > 0 && (
                      <section>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">A melhorar</p>
                        <ul className="space-y-1.5">
                          {result.improvements.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                              <Sparkles className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {result.missingKeywords.length > 0 && (
                      <section>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Palavras-chave em falta</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.missingKeywords.map((k) => (
                            <span key={k} className="rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[11px] font-semibold">
                              {k}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    <button
                      type="button"
                      onClick={run}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-gold" /> Analisar de novo
                    </button>

                    {/* Feedback — link to human review if AI score is poor */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">Análise útil?</p>
                      <FeedbackWidget
                        source="ats"
                        sourceTitle={`ATS Score · ${result.score}/100`}
                        output={JSON.stringify(result, null, 2)}
                        prompt={cvToText(data).slice(0, 1500)}
                        metadata={{ score: result.score, cv_name: data.personal.nome }}
                        compact
                        onAction={async (action) => {
                          if (action.kind === "ai_improve" || action.kind === "ai_regenerate") {
                            await run();
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
