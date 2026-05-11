import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { unzip } from "fflate";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Save, Upload,
  Loader2, AlertTriangle, Info, X, FileArchive, LayoutTemplate,
  ChevronUp, ChevronDown, TrendingDown, BarChart3, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/balcao/cv-templates")({
  component: BalcaoCvTemplates,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type CvTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_url: string | null;
  html_content: string | null;
  css_content: string | null;
  reactive_id: string | null;
  is_premium: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  downloads: number;
  created_at: string;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  reactive_id: string;
  preview_url: string | null;
  html_content: string;
  css_content: string;
  is_premium: boolean;
  is_featured: boolean;
  is_active: boolean;
};

type ViewTab = "grid" | "stats";

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "profissional", "criativo", "simples",
  "academico", "moderno", "minimalista",
];

const CATEGORY_COLORS: Record<string, string> = {
  profissional: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  criativo:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  simples:      "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  academico:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  moderno:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  minimalista:  "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
};

const BLANK: FormState = {
  name: "", slug: "", description: "", category: "profissional",
  reactive_id: "", preview_url: null, html_content: "", css_content: "",
  is_premium: false, is_featured: false, is_active: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function parseZip(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const files = await new Promise<Record<string, Uint8Array>>((res, rej) =>
    unzip(buf, (e, f) => (e ? rej(e) : res(f))));

  const config: Record<string, unknown> = (() => {
    const k = Object.keys(files).find((k) => k.endsWith("config.json"));
    return k ? JSON.parse(new TextDecoder().decode(files[k])) : {};
  })();

  const previewKey = Object.keys(files).find((k) => /preview\.(png|jpg|jpeg|webp)$/i.test(k));
  let previewBlob: Blob | null = null;
  if (previewKey) {
    const ext = previewKey.split(".").pop()!;
    previewBlob = new Blob([files[previewKey]], { type: `image/${ext}` });
  }

  const htmlKey = Object.keys(files).find((k) => /\.(html|htm)$/i.test(k));
  const cssKey  = Object.keys(files).find((k) => k.endsWith(".css"));

  return {
    config,
    previewBlob,
    htmlContent: htmlKey ? new TextDecoder().decode(files[htmlKey]) : "",
    cssContent:  cssKey  ? new TextDecoder().decode(files[cssKey])  : "",
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

function BalcaoCvTemplates() {
  const [templates, setTemplates] = useState<CvTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>("grid");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showCss, setShowCss] = useState(false);
  const [importing, setImporting] = useState(false);

  // Filter
  const [filterCat, setFilterCat] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | "activos" | "destaque" | "premium">("todos");

  const zipRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("cv_templates").select("*").order("sort_order");
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) setTableError(true);
      else toast.error("Erro ao carregar", { description: error.message });
    } else {
      setTemplates((data as CvTemplate[]) ?? []);
      setTableError(false);
    }
    setLoading(false);
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeCount   = templates.filter((t) => t.is_active).length;
  const featuredCount = templates.filter((t) => t.is_featured).length;
  const premiumCount  = templates.filter((t) => t.is_premium).length;
  const totalDl       = templates.reduce((s, t) => s + (t.downloads ?? 0), 0);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = templates.filter((t) => {
    if (filterCat !== "todos" && t.category !== filterCat) return false;
    if (filterStatus === "activos")  return t.is_active;
    if (filterStatus === "destaque") return t.is_featured;
    if (filterStatus === "premium")  return t.is_premium;
    return true;
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openNew() {
    setEditingId(null); setForm(BLANK);
    setShowHtml(false); setShowCss(false);
    setModalOpen(true);
  }

  function openEdit(t: CvTemplate) {
    setEditingId(t.id);
    setForm({
      name: t.name, slug: t.slug, description: t.description,
      category: t.category, reactive_id: t.reactive_id ?? "",
      preview_url: t.preview_url, html_content: t.html_content ?? "",
      css_content: t.css_content ?? "", is_premium: t.is_premium,
      is_featured: t.is_featured, is_active: t.is_active,
    });
    setShowHtml(false); setShowCss(false);
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(BLANK); }

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function save() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!form.slug.trim()) { toast.error("Slug obrigatório"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), slug: form.slug.trim(),
      description: form.description.trim(), category: form.category,
      reactive_id: form.reactive_id.trim() || null,
      preview_url: form.preview_url,
      html_content: form.html_content || null,
      css_content: form.css_content || null,
      is_premium: form.is_premium, is_featured: form.is_featured, is_active: form.is_active,
      sort_order: editingId == null ? templates.length : undefined,
    };
    const q = editingId == null
      ? (supabase as any).from("cv_templates").insert(payload)
      : (supabase as any).from("cv_templates").update(payload).eq("id", editingId);
    const { error } = await q;
    if (error) toast.error("Erro ao guardar", { description: error.message });
    else { toast.success(editingId == null ? "Template criado!" : "Actualizado!"); closeModal(); await load(); }
    setSaving(false);
  }

  async function handleDelete(t: CvTemplate) {
    if (!confirm(`Apagar "${t.name}"? Esta acção não pode ser desfeita.`)) return;
    const { error } = await (supabase as any).from("cv_templates").delete().eq("id", t.id);
    if (error) { toast.error("Erro ao apagar"); return; }
    toast.success("Template apagado");
    setTemplates((p) => p.filter((x) => x.id !== t.id));
  }

  async function toggleField(t: CvTemplate, field: "is_active" | "is_featured" | "is_premium") {
    const next = !t[field];
    const { error } = await (supabase as any)
      .from("cv_templates").update({ [field]: next }).eq("id", t.id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    setTemplates((p) => p.map((x) => x.id === t.id ? { ...x, [field]: next } : x));
    const labels: Record<string, [string, string]> = {
      is_active:   ["Template activado", "Template ocultado"],
      is_featured: ["Adicionado aos destaques", "Removido dos destaques"],
      is_premium:  ["Marcado como Premium", "Removido do Premium"],
    };
    toast.success(next ? labels[field][0] : labels[field][1]);
  }

  async function move(index: number, dir: "up" | "down") {
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= templates.length) return;
    const a = templates[index], b = templates[swapIdx];
    await Promise.all([
      (supabase as any).from("cv_templates").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("cv_templates").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await load();
  }

  // ── ZIP import ─────────────────────────────────────────────────────────────

  async function handleZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const { config, previewBlob, htmlContent, cssContent } = await parseZip(file);
      let previewUrl: string | null = null;
      if (previewBlob) {
        const ext = previewBlob.type.split("/")[1] || "png";
        const path = `cv-templates/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("images").upload(path, previewBlob, { upsert: false });
        if (!error) ({ data: { publicUrl: previewUrl } } = supabase.storage.from("images").getPublicUrl(path));
      }
      const name = String(config.name ?? file.name.replace(".zip", ""));
      setForm({
        name, slug: String(config.slug ?? slugify(name)),
        description: String(config.description ?? ""),
        category: String(config.category ?? "profissional"),
        reactive_id: String(config.reactive_id ?? ""),
        preview_url: previewUrl, html_content: htmlContent, css_content: cssContent,
        is_premium: Boolean(config.is_premium ?? false),
        is_featured: false, is_active: true,
      });
      setShowHtml(!!htmlContent); setShowCss(!!cssContent);
      setEditingId(null);
      setModalOpen(true);
      toast.success("ZIP importado! Verifique e guarde o template.");
    } catch (err) {
      toast.error("Erro ao importar ZIP", { description: String(err) });
    }
    setImporting(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" /> Templates de CV
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {templates.length} templates · {activeCount} activos · {featuredCount} em destaque
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={handleZip} />
          <button
            onClick={() => zipRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-smooth disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            Importar ZIP
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
          >
            <Plus className="h-4 w-4" /> Novo template
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: templates.length,  color: "text-brand" },
          { label: "Activos",    value: activeCount,       color: "text-green-600" },
          { label: "Destaques",  value: featuredCount,     color: "text-gold" },
          { label: "Downloads",  value: totalDl,           color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table missing warning */}
      {tableError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Tabela <code>cv_templates</code> não encontrada</p>
              <p className="text-sm text-muted-foreground">
                Corre as migrations em <strong>supabase/migrations/20260511_cv_templates.sql</strong> e <strong>20260511_cv_templates_featured.sql</strong> no Supabase SQL Editor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!tableError && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          {(["todos", "activos", "destaque", "premium"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border capitalize transition-smooth ${
                filterStatus === f
                  ? "bg-brand text-brand-foreground border-brand"
                  : "border-border text-foreground/70 hover:border-brand/50"
              }`}
            >
              {f === "todos" ? "Todos" : f === "activos" ? "Activos" : f === "destaque" ? "⭐ Destaque" : "👑 Premium"}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {/* Category filter */}
          {["todos", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border capitalize transition-smooth ${
                filterCat === c
                  ? "bg-muted text-foreground border-border"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setViewTab(viewTab === "grid" ? "stats" : "grid")}
            className={`ml-auto rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-smooth ${
              viewTab === "stats" ? "bg-brand text-brand-foreground border-brand" : "border-border text-muted-foreground hover:border-brand/50"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
          </button>
        </div>
      )}

      {/* ── GRID VIEW ───────────────────────────────────────────────────────── */}
      {viewTab === "grid" && !tableError && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <LayoutTemplate className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum template encontrado</p>
              <button onClick={openNew} className="mt-4 text-sm text-brand hover:underline">
                + Criar primeiro template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((t, index) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  index={index}
                  total={filtered.length}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={toggleField}
                  onMove={move}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── STATS VIEW ──────────────────────────────────────────────────────── */}
      {viewTab === "stats" && !tableError && (
        <StatsView templates={templates} />
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-elegant border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-brand" />
                {editingId == null ? "Novo Template" : "Editar Template"}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name + Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({ ...p, name: v, slug: p.slug === slugify(p.name) || p.slug === "" ? slugify(v) : p.slug }));
                    }}
                    placeholder="Ex: Modern Blue"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={(e) => patch("slug", e.target.value)}
                    placeholder="modern-blue"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Descrição</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => patch("description", e.target.value)}
                  placeholder="Breve descrição do template..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {/* Category + Reactive ID */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => patch("category", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Reactive Resume ID</label>
                  <input
                    value={form.reactive_id}
                    onChange={(e) => patch("reactive_id", e.target.value)}
                    placeholder="Ex: azurill"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Slug do template em rxresu.me (opcional)</p>
                </div>
              </div>

              {/* Preview image */}
              <ImageUpload
                value={form.preview_url}
                onChange={(v) => patch("preview_url", v)}
                label="Imagem de pré-visualização"
                hint="Recomendado: proporção A4 (210×297 mm)"
                bucket="images"
                folder="cv-templates"
              />

              {/* HTML */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowHtml((p) => !p)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {showHtml ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  HTML {form.html_content ? `(${form.html_content.length} chars)` : "(vazio)"}
                </button>
                {showHtml && (
                  <textarea
                    rows={8}
                    value={form.html_content}
                    onChange={(e) => patch("html_content", e.target.value)}
                    placeholder="<!-- HTML do template aqui -->"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                )}
              </div>

              {/* CSS */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCss((p) => !p)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {showCss ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  CSS {form.css_content ? `(${form.css_content.length} chars)` : "(vazio)"}
                </button>
                {showCss && (
                  <textarea
                    rows={6}
                    value={form.css_content}
                    onChange={(e) => patch("css_content", e.target.value)}
                    placeholder="/* CSS do template aqui */"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                {([
                  { key: "is_active"  as const, label: "Activo",    color: "bg-brand",      icon: Eye },
                  { key: "is_featured"as const, label: "Destaque",  color: "bg-gold",       icon: Star },
                  { key: "is_premium" as const, label: "Premium",   color: "bg-amber-500",  icon: Crown },
                ] as { key: keyof FormState; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ key, label, color, icon: Icon }) => (
                  <label key={key} className="flex flex-col items-center gap-2 cursor-pointer select-none rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div
                      onClick={() => patch(key, !form[key] as FormState[typeof key])}
                      className={`relative h-5 w-9 rounded-full transition-colors ${form[key] ? color : "bg-muted-foreground/30"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form[key] ? "translate-x-4" : ""}`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId == null ? "Criar template" : "Guardar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────────────────

function TemplateCard({
  t, index, total, onEdit, onDelete, onToggle, onMove,
}: {
  t: CvTemplate;
  index: number;
  total: number;
  onEdit: (t: CvTemplate) => void;
  onDelete: (t: CvTemplate) => void;
  onToggle: (t: CvTemplate, field: "is_active" | "is_featured" | "is_premium") => void;
  onMove: (i: number, dir: "up" | "down") => void;
}) {
  const catColor = CATEGORY_COLORS[t.category] ?? "bg-muted text-muted-foreground";
  const gradient = t.preview_url
    ? undefined
    : `linear-gradient(135deg, hsl(${(t.slug.charCodeAt(0) * 17) % 360}, 60%, 55%), hsl(${(t.slug.charCodeAt(0) * 29) % 360}, 50%, 40%))`;

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all hover:shadow-elegant ${!t.is_active ? "border-border/40 opacity-60" : "border-border"}`}>
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "210/140", background: gradient }}>
        {t.preview_url && (
          <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {t.is_featured && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gold/90 text-white">
              <Star className="h-2 w-2 fill-current" /> Destaque
            </span>
          )}
          {t.is_premium && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white">
              <Crown className="h-2 w-2" /> Premium
            </span>
          )}
        </div>
        {!t.is_active && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground bg-background/80 px-2 py-1 rounded">Oculto</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-bold text-foreground leading-tight truncate">{t.name}</p>
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${catColor}`}>{t.category}</span>
        </div>
        <p className="text-[11px] text-muted-foreground line-clamp-1">{t.description || "Sem descrição"}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <BarChart3 className="h-3 w-3" />
          <span>{t.downloads ?? 0} downloads</span>
          {t.reactive_id && <><span className="text-border">·</span><span className="font-mono">{t.reactive_id}</span></>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 pt-1.5 border-t border-border/50">
          <button onClick={() => onMove(index, "up")} disabled={index === 0} title="Mover para cima"
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button onClick={() => onMove(index, "down")} disabled={index === total - 1} title="Mover para baixo"
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors">
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Active */}
          <button onClick={() => onToggle(t, "is_active")} title={t.is_active ? "Ocultar" : "Activar"}
            className={`rounded p-1 transition-colors ${t.is_active ? "text-green-500 hover:text-muted-foreground" : "text-muted-foreground hover:text-green-500"}`}>
            {t.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          {/* Featured */}
          <button onClick={() => onToggle(t, "is_featured")} title={t.is_featured ? "Remover destaque" : "Marcar como destaque"}
            className={`rounded p-1 transition-colors ${t.is_featured ? "text-gold" : "text-muted-foreground hover:text-gold"}`}>
            <Star className={`h-3.5 w-3.5 ${t.is_featured ? "fill-current" : ""}`} />
          </button>

          {/* Edit */}
          <button onClick={() => onEdit(t)} title="Editar"
            className="rounded p-1 text-muted-foreground hover:text-brand transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button onClick={() => onDelete(t)} title="Apagar"
            className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors ml-auto">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats View ─────────────────────────────────────────────────────────────────

function StatsView({ templates }: { templates: CvTemplate[] }) {
  const sorted = [...templates].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
  const maxDl = sorted[0]?.downloads ?? 1;
  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    count: templates.filter((t) => t.category === cat).length,
    dl: templates.filter((t) => t.category === cat).reduce((s, t) => s + (t.downloads ?? 0), 0),
  })).filter((x) => x.count > 0);

  return (
    <div className="space-y-6">
      {/* Top templates */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand" /> Downloads por template
        </h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem dados ainda.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((t, i) => {
              const pct = maxDl > 0 ? Math.max(2, Math.round(((t.downloads ?? 0) / maxDl) * 100)) : 2;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 shrink-0 ${i === 0 ? "text-gold" : i === 1 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                    #{i + 1}
                  </span>
                  {t.preview_url ? (
                    <img src={t.preview_url} alt={t.name} className="h-8 w-6 object-cover rounded shrink-0 border border-border" />
                  ) : (
                    <div className="h-8 w-6 rounded shrink-0 bg-muted border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate">{t.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{t.downloads ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-brand transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {t.is_featured && <Star className="h-3 w-3 text-gold fill-current" />}
                    {t.is_premium && <Crown className="h-3 w-3 text-amber-500" />}
                    {!t.is_active && <EyeOff className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By category */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-brand" /> Por categoria
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {byCategory.map(({ cat, count, dl }) => (
            <div key={cat} className="flex items-center justify-between rounded-xl bg-muted/40 border border-border px-4 py-3">
              <div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${CATEGORY_COLORS[cat] ?? "bg-muted text-muted-foreground"}`}>
                  {cat}
                </span>
                <p className="text-xs text-muted-foreground">{count} template{count !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-brand">{dl}</p>
                <p className="text-[10px] text-muted-foreground">downloads</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Os downloads são incrementados automaticamente quando um utilizador gera um PDF no CV Builder.
          Os templates em <strong>Destaque</strong> aparecem na secção "Recomendados" da página <code>/hub/cv</code>.
        </p>
      </div>
    </div>
  );
}
