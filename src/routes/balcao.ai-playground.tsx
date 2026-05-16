import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Send, Loader2, Trash2, Copy, Check, AlertCircle,
  Clock, Zap, Save, BookOpen, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/balcao/ai-playground")({
  head: () => ({ meta: [{ title: "AI Playground — Balcão Giseveral" }] }),
  component: AiPlayground,
});

type Task = "chat" | "cv_suggest" | "letter_generate" | "smart_search" | "scholarship_match" | "ats_score";

const TASK_OPTIONS: { id: Task; label: string; description: string; sample: string }[] = [
  { id: "chat",              label: "Chat",              description: "Assistente conversacional curto",          sample: "Quanto custa imprimir 20 páginas a cores na Beira?" },
  { id: "cv_suggest",        label: "CV — sugerir",      description: "Bullets/resumos para CV",                   sample: "Escreve 4 bullet points para um Engenheiro de Software Senior na TechCorp Maputo. Verbos de acção e métricas." },
  { id: "letter_generate",   label: "Carta — gerar",     description: "Gera carta formal de 250-400 palavras",     sample: "Carta de candidatura para UI/UX Designer na Vodacom, tom moderno." },
  { id: "smart_search",      label: "Pesquisa inteligente", description: "Devolve JSON {q, cat}",                  sample: "exames de admissão UEM matemática" },
  { id: "scholarship_match", label: "Match de bolsa",    description: "JSON com score 0-100 e razões",            sample: "Avalia perfil estudante de engenharia para bolsa Chevening UK. Devolve JSON com score, reasons[], gaps[]." },
  { id: "ats_score",         label: "ATS Score",         description: "JSON com score, strengths, improvements",  sample: "Avalia este CV: 'Maria Santos · Engenheira Software Senior · React, Node, AWS · 6 anos exp.' Devolve JSON {score, strengths, improvements, missingKeywords}." },
];

type Entry = {
  id: string;
  ts: number;
  task: Task;
  prompt: string;
  context?: string;
  response: string;
  model?: string;
  ms: number;
  ok: boolean;
  status?: number;
  error?: string;
};

const HISTORY_KEY = "giseveral.ai-playground.history";
const PROMPTS_KEY = "giseveral.ai-playground.prompts";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function AiPlayground() {
  const [task, setTask] = useState<Task>("chat");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [history, setHistory] = useState<Entry[]>(() => loadJson(HISTORY_KEY, []));
  const [savedPrompts, setSavedPrompts] = useState<{ id: string; label: string; task: Task; prompt: string }[]>(
    () => loadJson(PROMPTS_KEY, []),
  );
  const [copied, setCopied] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { saveJson(HISTORY_KEY, history.slice(0, 30)); }, [history]);
  useEffect(() => { saveJson(PROMPTS_KEY, savedPrompts); }, [savedPrompts]);

  const taskMeta = TASK_OPTIONS.find((t) => t.id === task) ?? TASK_OPTIONS[0];

  async function run() {
    if (!prompt.trim()) {
      toast.error("Escreve um prompt antes de executar.");
      return;
    }
    setRunning(true);
    setResponse("");
    setLatency(null);
    setStatus(null);
    setErrorDetail(null);
    setModel(null);

    const started = performance.now();
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, prompt, context: context || undefined }),
      });
      const ms = Math.round(performance.now() - started);
      setLatency(ms);
      setStatus(res.status);

      let data: unknown = null;
      const raw = await res.text();
      try { data = JSON.parse(raw); } catch { /* keep raw for display */ }

      if (!res.ok) {
        const err = data as { error?: string; detail?: string; upstream?: unknown; triedModels?: string[] } | null;
        const detail = err?.detail
          ?? (err?.upstream && typeof err.upstream === "object" && "error" in err.upstream
              ? (err.upstream as { error: { message?: string } }).error?.message
              : null)
          ?? raw.slice(0, 400);
        setErrorDetail(`${err?.error ?? "AI indisponível"} — ${detail ?? "sem detalhe"}${err?.triedModels ? `\nModelos tentados: ${err.triedModels.join(", ")}` : ""}`);
        setHistory((h) => [{
          id: crypto.randomUUID(), ts: Date.now(), task, prompt, context: context || undefined,
          response: "", model: undefined, ms, ok: false, status: res.status, error: err?.error ?? "AI error",
        }, ...h].slice(0, 30));
        toast.error(`Resposta com erro (${res.status})`);
        return;
      }

      const payload = data as { text?: string; model?: string };
      const text = payload?.text ?? raw;
      setResponse(text);
      setModel(payload?.model ?? null);
      setHistory((h) => [{
        id: crypto.randomUUID(), ts: Date.now(), task, prompt, context: context || undefined,
        response: text, model: payload?.model, ms, ok: true, status: res.status,
      }, ...h].slice(0, 30));
      toast.success(`Resposta em ${ms}ms`);
    } catch (e) {
      const ms = Math.round(performance.now() - started);
      setLatency(ms);
      setErrorDetail(e instanceof Error ? e.message : String(e));
      setHistory((h) => [{
        id: crypto.randomUUID(), ts: Date.now(), task, prompt, response: "", ms, ok: false,
        error: e instanceof Error ? e.message : "Network error",
      }, ...h].slice(0, 30));
      toast.error("Falha de rede");
    } finally {
      setRunning(false);
    }
  }

  function copyResponse() {
    if (!response) return;
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function loadEntry(e: Entry) {
    setTask(e.task);
    setPrompt(e.prompt);
    setContext(e.context ?? "");
    setResponse(e.response);
    setLatency(e.ms);
    setStatus(e.status ?? null);
    setModel(e.model ?? null);
    setErrorDetail(e.error ?? null);
    promptRef.current?.focus();
  }

  function saveCurrentPrompt() {
    if (!prompt.trim()) { toast.error("Nada para guardar"); return; }
    const label = prompt.slice(0, 40) + (prompt.length > 40 ? "…" : "");
    const entry = { id: crypto.randomUUID(), label, task, prompt };
    setSavedPrompts((p) => [entry, ...p].slice(0, 20));
    toast.success("Prompt guardado");
  }

  function loadSampleForTask() {
    setPrompt(taskMeta.sample);
    setContext("");
  }

  function reset() {
    setPrompt("");
    setContext("");
    setResponse("");
    setLatency(null);
    setStatus(null);
    setErrorDetail(null);
    setModel(null);
  }

  const okCount = history.filter((h) => h.ok).length;
  const errCount = history.filter((h) => !h.ok).length;
  const avgMs = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.ms, 0) / history.length)
    : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5">

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand" /> AI Playground
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Testa prompts contra <span className="font-mono">/api/gemini</span>. Vê latência, modelo usado, e o erro exacto quando falha.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Sucessos" value={okCount} accent="text-emerald-600" />
          <Stat label="Erros" value={errCount} accent="text-rose-600" />
          <Stat label="Latência média" value={avgMs > 0 ? `${avgMs} ms` : "—"} accent="text-brand" />
        </div>

        {/* Task selector */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Task</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TASK_OPTIONS.map((t) => {
              const active = task === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTask(t.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "bg-brand text-brand-foreground border-brand shadow-card"
                      : "bg-background border-border text-foreground hover:border-brand/40"
                  }`}
                >
                  <p className="text-xs font-bold">{t.label}</p>
                  <p className={`mt-0.5 text-[10px] ${active ? "text-brand-foreground/80" : "text-muted-foreground"}`}>{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt + context */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prompt</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSampleForTask}
                  className="text-[11px] font-semibold text-brand hover:text-gold transition-colors"
                >
                  Carregar exemplo
                </button>
                <button
                  type="button"
                  onClick={saveCurrentPrompt}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  title="Guardar prompt"
                >
                  <Save className="h-3 w-3" /> Guardar
                </button>
              </div>
            </div>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Escreve o prompt aqui…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
            />
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">Contexto adicional (opcional)</summary>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Memória / instruções adicionais"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
            />
          </details>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Limpar
            </button>
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {running ? "A executar…" : "Executar"}
            </button>
          </div>
        </div>

        {/* Response */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Resposta
              </span>
              {latency !== null && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {latency} ms</span>
              )}
              {model && (
                <span className="inline-flex items-center gap-1 font-mono"><Zap className="h-3 w-3" /> {model}</span>
              )}
              {status !== null && (
                <span className={`inline-flex items-center gap-1 font-bold ${status >= 400 ? "text-rose-600" : "text-emerald-600"}`}>
                  HTTP {status}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={copyResponse}
              disabled={!response}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          {errorDetail ? (
            <div className="p-4">
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3">
                <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-100">Erro</p>
                  <pre className="mt-1 text-[11px] text-rose-800 dark:text-rose-200 whitespace-pre-wrap break-all font-mono">
                    {errorDetail}
                  </pre>
                </div>
              </div>
            </div>
          ) : response ? (
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words text-foreground max-h-[480px] overflow-auto">
              {response}
            </pre>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Executa o prompt para ver a resposta aqui.
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="space-y-4">
        {savedPrompts.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Prompts guardados
              </p>
              <button
                type="button"
                onClick={() => setSavedPrompts([])}
                className="text-[10px] text-muted-foreground hover:text-destructive"
              >
                Limpar
              </button>
            </div>
            <ul className="divide-y divide-border max-h-64 overflow-auto">
              {savedPrompts.map((p) => (
                <li key={p.id} className="px-4 py-2 hover:bg-muted/40 transition-colors">
                  <button
                    type="button"
                    onClick={() => { setTask(p.task); setPrompt(p.prompt); }}
                    className="w-full text-left"
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{TASK_OPTIONS.find((t) => t.id === p.task)?.label}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Histórico
            </p>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-[10px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Sem execuções ainda.</p>
          ) : (
            <ul className="divide-y divide-border max-h-[520px] overflow-auto">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => loadEntry(h)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                      <span className="font-bold text-foreground">{TASK_OPTIONS.find((t) => t.id === h.task)?.label}</span>
                      <span className={h.ok ? "text-emerald-600" : "text-rose-600"}>
                        {h.ok ? "✓" : "✗"} {h.status ?? "—"}
                      </span>
                      <span className="text-muted-foreground ml-auto">{h.ms}ms</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{h.prompt}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-extrabold tabular-nums ${accent}`}>{value}</p>
    </motion.div>
  );
}
