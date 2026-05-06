import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  BookOpen, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Loader2, Eye, Save, ChevronDown, ChevronUp,
  FileText, LayoutTemplate, Wand2, Globe, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/balcao/blog")({
  component: BalcaoBlog,
});

/* ── Gemini ─────────────────────────────────────────────── */
const GEMINI_KEY = (typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_KEY : undefined) ?? "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function geminiSuggest(prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error("VITE_GEMINI_KEY não configurada");
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/* ── SEO scoring ─────────────────────────────────────────── */
type SeoCheck = { label: string; pts: number; max: number; pass: boolean; tip: string };

function computeSeo(title: string, content: string, keyword: string, excerpt: string): { score: number; checks: SeoCheck[] } {
  const kw = keyword.toLowerCase().trim();
  const titleL = title.toLowerCase();
  const contentL = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 30).length;

  const checks: SeoCheck[] = [
    {
      label: "Palavra-chave no título",
      pts: kw && titleL.includes(kw) ? 20 : 0,
      max: 20,
      pass: !!(kw && titleL.includes(kw)),
      tip: "Inclua a palavra-chave principal no início do título.",
    },
    {
      label: "Palavra-chave no conteúdo (2×)",
      pts: kw && (contentL.split(kw).length - 1) >= 2 ? 15 : kw && contentL.includes(kw) ? 8 : 0,
      max: 15,
      pass: !!(kw && (contentL.split(kw).length - 1) >= 2),
      tip: "Use a palavra-chave pelo menos 2 vezes no texto.",
    },
    {
      label: "Referência à Beira / Moçambique",
      pts: contentL.includes("beira") || contentL.includes("moçambique") ? 10 : 0,
      max: 10,
      pass: contentL.includes("beira") || contentL.includes("moçambique"),
      tip: "Mencione 'Beira' ou 'Moçambique' para SEO local.",
    },
    {
      label: "Tamanho do conteúdo",
      pts: wordCount >= 500 ? 20 : wordCount >= 300 ? 12 : wordCount >= 150 ? 6 : 0,
      max: 20,
      pass: wordCount >= 300,
      tip: `Texto com ${wordCount} palavras. Recomendado: mínimo 500.`,
    },
    {
      label: "Estrutura (parágrafos)",
      pts: paragraphs >= 4 ? 10 : paragraphs >= 2 ? 5 : 0,
      max: 10,
      pass: paragraphs >= 2,
      tip: "Divida o conteúdo em parágrafos curtos com pelo menos 4 secções.",
    },
    {
      label: "Comprimento do título (40–70 chars)",
      pts: title.length >= 40 && title.length <= 70 ? 10 : title.length >= 20 ? 5 : 0,
      max: 10,
      pass: title.length >= 40 && title.length <= 70,
      tip: `Título com ${title.length} caracteres. Ideal: 40–70.`,
    },
    {
      label: "Resumo (meta description)",
      pts: excerpt.length >= 100 && excerpt.length <= 160 ? 10 : excerpt.length >= 50 ? 5 : 0,
      max: 10,
      pass: excerpt.length >= 100,
      tip: `Resumo com ${excerpt.length} chars. Ideal: 100–160.`,
    },
    {
      label: "Slug/URL válido",
      pts: title.length >= 5 ? 5 : 0,
      max: 5,
      pass: title.length >= 5,
      tip: "O slug é gerado automaticamente a partir do título.",
    },
  ];

  const score = checks.reduce((s, c) => s + c.pts, 0);
  return { score, checks };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/* ── score ring ─────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-500" : score >= 45 ? "text-amber-500" : "text-red-500";
  const label = score >= 70 ? "Bom" : score >= 45 ? "Médio" : "Fraco";
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="currentColor" strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={color}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="text-center -mt-[74px] mb-[10px]">
        <p className={`text-2xl font-extrabold ${color}`}>{score}</p>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </div>
      <div className="mt-[55px]">
        <span className={`text-xs font-bold ${color}`}>{label}</span>
      </div>
    </div>
  );
}

/* ── AI suggestions panel ───────────────────────────────── */
type AiSuggestions = {
  title: string;
  description: string;
  keywords: string[];
  improvements: string[];
};

function AiPanel({
  title, content, keyword, excerpt,
  onApply,
}: {
  title: string; content: string; keyword: string; excerpt: string;
  onApply: (s: AiSuggestions) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSuggestions | null>(null);
  const [open, setOpen] = useState(false);

  async function analyse() {
    if (!title && !content) { toast.error("Preencha o título e conteúdo primeiro"); return; }
    setLoading(true);
    setOpen(true);
    try {
      const prompt = `Analisa este artigo de blog para a empresa Giseveral e Services em Beira, Moçambique (reprografia, informática, redes, papelaria).

Título: ${title}
Palavra-chave: ${keyword}
Resumo: ${excerpt}
Conteúdo (primeiras 800 palavras): ${content.slice(0, 2000)}

Responde APENAS com JSON válido neste formato exacto (sem markdown, sem explicações):
{
  "title": "título melhorado com a palavra-chave, 40-70 caracteres",
  "description": "meta description SEO, 100-160 caracteres, inclua Beira",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "improvements": ["melhoria 1 concisa", "melhoria 2 concisa", "melhoria 3 concisa"]
}`;
      const raw = await geminiSuggest(prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as AiSuggestions;
      setResult(parsed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na análise IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 bg-gradient-brand text-brand-foreground hover:opacity-95 transition-opacity"
      >
        <Sparkles className="h-5 w-5 text-gold flex-shrink-0" />
        <span className="font-bold text-sm flex-1 text-left">Análise IA — Sugestões automáticas</span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="p-5">
          {!GEMINI_KEY && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400">Configura a IA Gemini</p>
              <p className="mt-1 text-amber-600 dark:text-amber-500 text-xs">
                Adiciona <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">VITE_GEMINI_KEY</code> nas variáveis de ambiente do Cloudflare Pages (Google AI Studio → API keys, gratuito).
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={analyse}
            disabled={loading || !GEMINI_KEY}
            className="flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-50 mb-4"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> A analisar...</> : <><Sparkles className="h-4 w-4" /> Analisar com Gemini</>}
          </button>

          {result && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Título sugerido</p>
                  <p className="text-sm font-semibold text-foreground">{result.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Meta description</p>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Keywords relacionadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((k) => (
                      <span key={k} className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-medium">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">O que melhorar</p>
                  <ul className="space-y-1">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onApply(result); toast.success("Sugestões aplicadas!"); }}
                className="flex items-center gap-2 rounded-lg border border-brand/30 px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/5 transition-smooth"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Aplicar sugestões
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */
type Category = "Informática" | "Impressão" | "Redes" | "Dicas";

const CATEGORIES: Category[] = ["Informática", "Impressão", "Redes", "Dicas"];

type Draft = {
  id: string;
  title: string;
  content: string;
  category: Category;
  keyword: string;
  excerpt: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
};

function loadDrafts(): Draft[] {
  try { return JSON.parse(localStorage.getItem("blog_drafts") ?? "[]"); } catch { return []; }
}
function saveDraftsLocal(drafts: Draft[]) {
  localStorage.setItem("blog_drafts", JSON.stringify(drafts));
}

async function publishToSupabase(draft: Draft, slug: string): Promise<void> {
  const row = {
    slug,
    title: draft.title,
    date: new Date().toISOString().split("T")[0],
    category: draft.category,
    image_url: draft.imageUrl,
    excerpt: draft.excerpt,
    meta_title: draft.title,
    meta_description: draft.excerpt,
    keywords: draft.keyword,
    content: draft.content,
    published: true,
  };

  const { error } = await supabase
    .from("blog_posts")
    .upsert(row, { onConflict: "slug" });
  if (error) throw error;
}

async function deleteFromSupabase(slug: string): Promise<void> {
  await supabase.from("blog_posts").delete().eq("slug", slug);
}

const emptyDraft = (): Draft => ({
  id: "", title: "", content: "", category: "Informática",
  keyword: "", excerpt: "", imageUrl: "", slug: "",
  createdAt: new Date().toISOString(),
});

function BalcaoBlog() {
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts);
  const [dbItems, setDbItems] = useState<Draft[]>([]);
  const [publishedSlugs, setPublishedSlugs] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Draft>(emptyDraft());
  const [showList, setShowList] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setPublishedSlugs(new Set(data.map((r) => r.slug)));
        const localSlugs = new Set(loadDrafts().map((d) => slugify(d.title)));
        setDbItems(
          data
            .filter((p) => !localSlugs.has(p.slug))
            .map((p) => ({
              id: p.id,
              title: p.title,
              content: typeof p.content === "string" ? p.content : "",
              category: (p.category ?? "Informática") as Category,
              keyword: p.keywords ?? "",
              excerpt: p.excerpt ?? "",
              imageUrl: p.image_url ?? "",
              slug: p.slug,
              createdAt: p.created_at,
            }))
        );
      });
  }, []);

  const slug = useMemo(() => slugify(editing.title), [editing.title]);
  const { score, checks } = useMemo(
    () => computeSeo(editing.title, editing.content, editing.keyword, editing.excerpt),
    [editing.title, editing.content, editing.keyword, editing.excerpt]
  );

  const canPublish = score >= 70;

  function startNew() { setEditing({ ...emptyDraft(), id: crypto.randomUUID() }); setShowList(false); setPreviewMode(false); }
  function editDraft(d: Draft) { setEditing(d); setShowList(false); setPreviewMode(false); }

  function save() {
    const updated = { ...editing, slug };
    const existing = drafts.find((d) => d.id === updated.id);
    const next = existing ? drafts.map((d) => (d.id === updated.id ? updated : d)) : [...drafts, updated];
    setDrafts(next);
    saveDraftsLocal(next);
    toast.success("Rascunho guardado!");
  }

  function deleteDraft(id: string) {
    if (!confirm("Eliminar este rascunho?")) return;
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    saveDraftsLocal(next);
    if (editing.id === id) { setEditing(emptyDraft()); setShowList(true); }
  }

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    try {
      await publishToSupabase(editing, slug);
      setPublishedSlugs((prev) => new Set([...prev, slug]));
      const updated = { ...editing, slug };
      const existing = drafts.find((d) => d.id === updated.id);
      const next = existing ? drafts.map((d) => (d.id === updated.id ? updated : d)) : [...drafts, updated];
      setDrafts(next);
      saveDraftsLocal(next);
      toast.success("Artigo publicado no site!");
    } catch (e) {
      toast.error("Erro ao publicar: " + (e instanceof Error ? e.message : "desconhecido"));
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish(draftSlug: string) {
    try {
      await deleteFromSupabase(draftSlug);
      setPublishedSlugs((prev) => { const s = new Set(prev); s.delete(draftSlug); return s; });
      toast.success("Artigo removido do site");
    } catch {
      toast.error("Erro ao despublicar");
    }
  }

  function applyAi(s: AiSuggestions) {
    setEditing((prev) => ({
      ...prev,
      title: s.title || prev.title,
      excerpt: s.description || prev.excerpt,
      keyword: s.keywords[0] || prev.keyword,
    }));
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const wordCount = stripHtml(editing.content).split(/\s+/).filter(Boolean).length;

  /* structured sections */
  const [sections, setSections] = useState({ intro: "", development: "", conclusion: "", cta: "" });
  const [showStructure, setShowStructure] = useState(false);

  function applyStructure() {
    const cta = sections.cta.trim() || "Contacte a Giseveral e Services em Beira, Esturro • Rua Alfredo Lawley. Ligue/WhatsApp: 874 383 621 ou visite-nos Seg–Sáb 8h–17h.";
    const built = [
      sections.intro.trim()       && `${sections.intro.trim()}`,
      sections.development.trim() && `${sections.development.trim()}`,
      sections.conclusion.trim()  && `${sections.conclusion.trim()}`,
      `${cta}`,
    ].filter(Boolean).join("\n\n");
    if (!built.trim()) { toast.error("Preenche pelo menos uma secção"); return; }
    setEditing((p) => ({ ...p, content: built }));
    toast.success("Estrutura aplicada no conteúdo!");
  }

  /* list view */
  if (showList) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gold" /> Blog + IA
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Editor com análise SEO automática e sugestões Gemini.</p>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
          >
            + Novo artigo
          </button>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">✅ Publicação directa no site</p>
          <p className="mt-1 text-emerald-600 dark:text-emerald-500 text-xs">
            Quando o score atingir ≥ 70, usa o botão <strong>Publicar no site</strong> — o artigo aparece imediatamente em <strong>/blog</strong>.
          </p>
        </div>

        {drafts.length === 0 && dbItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border">
            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-muted-foreground">Sem artigos ainda</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Cria o teu primeiro artigo com ajuda da IA.</p>
            <button onClick={startNew} className="mt-4 text-sm font-semibold text-brand hover:underline">+ Criar artigo</button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...drafts, ...dbItems].map((d) => {
              const { score: s } = computeSeo(d.title, d.content, d.keyword, d.excerpt);
              const ok = s >= 70;
              const isPublished = publishedSlugs.has(d.slug || slugify(d.title));
              const isDraft = drafts.some((x) => x.id === d.id);
              return (
                <div key={d.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card hover:shadow-elegant transition-smooth">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${ok ? "bg-green-100 text-green-600" : s >= 45 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                    {s}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{d.title || "(sem título)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.category} · {(d.content ?? "").trim().split(/\s+/).filter(Boolean).length} palavras · {new Date(d.createdAt).toLocaleDateString("pt-MZ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPublished && (
                      <span className="text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 flex items-center gap-1">
                        <Globe className="h-2.5 w-2.5" /> Online
                      </span>
                    )}
                    {!isDraft && (
                      <span className="text-[10px] font-bold rounded-full bg-brand/10 text-brand px-2 py-0.5">Supabase</span>
                    )}
                    {ok && !isPublished && <span className="text-[10px] font-bold rounded-full bg-green-100 text-green-600 px-2 py-0.5">Pronto</span>}
                    <button onClick={() => editDraft(d)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">Editar</button>
                    {isPublished && (
                      <button onClick={() => unpublish(d.slug || slugify(d.title))} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors">Despublicar</button>
                    )}
                    {isDraft && (
                      <button onClick={() => deleteDraft(d.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">Eliminar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* editor view */
  return (
    <div className="max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => setShowList(true)} className="text-sm text-muted-foreground hover:text-brand transition-colors">
          ← Voltar
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setPreviewMode((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> {previewMode ? "Editar" : "Preview"}
        </button>
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Save className="h-3.5 w-3.5" /> Guardar rascunho
        </button>
        <button
          onClick={publish}
          disabled={!canPublish || publishing}
          className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-xs font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-40"
          title={!canPublish ? "Score mínimo 70/100 para publicar" : ""}
        >
          {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
          {publishedSlugs.has(slug) ? "Actualizar no site" : "Publicar no site"}
          {!canPublish && <span className="text-[9px] opacity-70">(min. 70)</span>}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-5">
          {!previewMode ? (
            <>
              {/* Title */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título *</label>
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: Como proteger o seu PC contra vírus na Beira"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 font-semibold"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Slug: /{slug || "..."}</span>
                    <span className={`text-[10px] ${editing.title.length >= 40 && editing.title.length <= 70 ? "text-green-500" : "text-amber-500"}`}>
                      {editing.title.length}/70
                    </span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria *</label>
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value as Category }))}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Palavra-chave principal *</label>
                    <input
                      value={editing.keyword}
                      onChange={(e) => setEditing((p) => ({ ...p, keyword: e.target.value }))}
                      placeholder="Ex: remover vírus Beira"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo *</label>
                  <span className={`text-[10px] font-medium ${wordCount >= 500 ? "text-green-500" : wordCount >= 300 ? "text-amber-500" : "text-red-400"}`}>
                    {wordCount} palavras {wordCount >= 500 ? "✓" : `(mín. 500)`}
                  </span>
                </div>
                <RichTextEditor
                  value={editing.content}
                  onChange={(html) => setEditing((p) => ({ ...p, content: html }))}
                  label="Conteúdo do artigo"
                  hint="Formate o texto, adicione vídeos, imagens e tabelas." 
                  placeholder="Escreva o conteúdo do artigo aqui..."
                  bucket="images"
                  folder="blog"
                />
              </div>

              {/* Structured sections helper */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <button
                  onClick={() => setShowStructure((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-gold" />
                    <span className="text-sm font-semibold text-foreground">Estrutura Guiada do Artigo</span>
                    <span className="text-[10px] rounded-full bg-gold/10 text-gold px-2 py-0.5 font-medium">Recomendado</span>
                  </div>
                  {showStructure ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showStructure && (
                  <div className="px-5 pb-5 space-y-4 border-t border-border">
                    <p className="text-xs text-muted-foreground pt-4">Preenche as secções e clica "Aplicar no conteúdo" para gerar o texto estruturado automaticamente.</p>

                    {[
                      { key: "intro" as const,       label: "🔹 Introdução",   placeholder: "Qual é o problema que o cliente tem? Por que este tema é importante?\nEx: Muitos utilizadores em Beira perdem dados por não protegerem o PC contra vírus...", rows: 4 },
                      { key: "development" as const, label: "🔹 Desenvolvimento", placeholder: "Explica a solução ou o tema em detalhe.\nEx: Existem várias formas de proteger o seu computador: antivírus actualizado, evitar pen-drives desconhecidas...", rows: 6 },
                      { key: "conclusion" as const,  label: "🔹 Conclusão",    placeholder: "Resume os pontos principais.\nEx: Proteger o seu PC é simples e acessível. Com pequenos cuidados diários pode evitar grandes problemas...", rows: 4 },
                      { key: "cta" as const,         label: "🔹 CTA (Chamada à acção)", placeholder: "Contacte a Giseveral e Services em Beira, Esturro • Rua Alfredo Lawley. Ligue/WhatsApp: 874 383 621 ou visite-nos Seg–Sáb 8h–17h.", rows: 3 },
                    ].map(({ key, label, placeholder, rows }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
                        <textarea
                          value={sections[key]}
                          onChange={(e) => setSections((p) => ({ ...p, [key]: e.target.value }))}
                          rows={rows}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 leading-relaxed"
                        />
                      </div>
                    ))}

                    <button
                      onClick={applyStructure}
                      className="flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
                    >
                      <Wand2 className="h-4 w-4" /> Aplicar estrutura no conteúdo
                    </button>
                  </div>
                )}
              </div>

              {/* Excerpt + Image */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo / Meta description *</label>
                    <span className={`text-[10px] ${editing.excerpt.length >= 100 && editing.excerpt.length <= 160 ? "text-green-500" : "text-amber-500"}`}>
                      {editing.excerpt.length}/160
                    </span>
                  </div>
                  <textarea
                    value={editing.excerpt}
                    onChange={(e) => setEditing((p) => ({ ...p, excerpt: e.target.value }))}
                    rows={3}
                    placeholder="Resumo do artigo para os motores de busca (100–160 caracteres)"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <ImageUpload
                  label="Imagem de capa"
                  value={editing.imageUrl}
                  onChange={(url) => setEditing((p) => ({ ...p, imageUrl: url }))}
                  bucket="images"
                  folder="blog"
                />
              </div>
            </>
          ) : (
            /* Preview */
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{editing.category}</span>
              <h1 className="mt-2 text-2xl font-extrabold text-brand leading-tight">{editing.title || "(sem título)"}</h1>
              <p className="mt-3 text-muted-foreground text-sm">{editing.excerpt}</p>
              {editing.imageUrl && <img src={editing.imageUrl} alt="" className="mt-4 w-full rounded-xl object-cover aspect-video" />}
              <div className="mt-6 prose prose-sm max-w-none">
                {editing.content.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4">{para}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEO panel + AI */}
        <div className="space-y-5">
          {/* Score */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <ScoreRing score={score} />
              <div>
                <p className="font-bold text-foreground">SEO Score</p>
                <p className="text-xs text-muted-foreground">{canPublish ? "Pronto para publicar ✓" : `Mín. 70 para exportar`}</p>
              </div>
            </div>
            <div className="space-y-2">
              {checks.map((c) => {
                const Icon = c.pass ? CheckCircle2 : c.pts > 0 ? AlertTriangle : XCircle;
                const cls = c.pass ? "text-green-500" : c.pts > 0 ? "text-amber-500" : "text-red-400";
                return (
                  <div key={c.label} className="flex items-start gap-2 text-xs">
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${cls}`} />
                    <div className="flex-1 min-w-0">
                      <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                      {!c.pass && <p className="text-muted-foreground/70 text-[10px] leading-tight mt-0.5">{c.tip}</p>}
                    </div>
                    <span className={`flex-shrink-0 font-bold ${cls}`}>{c.pts}/{c.max}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI panel */}
          <AiPanel
            title={editing.title}
            content={editing.content}
            keyword={editing.keyword}
            excerpt={editing.excerpt}
            onApply={applyAi}
          />

          {/* Quick tips */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 text-xs space-y-2">
            <p className="font-bold text-foreground flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-gold" /> Dicas rápidas</p>
            {[
              "Comece o título com a palavra-chave",
              "Use parágrafos curtos (máx 4 linhas)",
              "Mencione 'Beira' pelo menos 2 vezes",
              "Termine com um call-to-action",
              "500+ palavras = melhor ranking",
            ].map((t) => (
              <p key={t} className="text-muted-foreground flex items-center gap-1.5">
                <span className="text-gold">→</span> {t}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
