import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { unzip } from "fflate";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  X, Save, Upload, Loader2, AlertTriangle, Info, Star,
  FileArchive, LayoutTemplate,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { TEMPLATE_META } from "@/components/cv-builder/types";

export const Route = createFileRoute("/balcao/cv")({
  component: BalcaoCvPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type DbCvTemplate = {
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
  is_active: boolean;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "profissional",
  "criativo",
  "simples",
  "academico",
  "moderno",
  "minimalista",
];

const BLANK_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  category: "profissional",
  reactive_id: "",
  preview_url: null,
  html_content: "",
  css_content: "",
  is_premium: false,
  is_active: true,
};

const LOCAL_CATEGORIES_KEY = "cv_admin_categories";

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function parseZipFile(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const files = await new Promise<Record<string, Uint8Array>>((res, rej) =>
    unzip(buf, (e, f) => (e ? rej(e) : res(f)))
  );

  const configKey = Object.keys(files).find((k) => k.endsWith("config.json"));
  let config: Record<string, unknown> = {};
  if (configKey) {
    config = JSON.parse(new TextDecoder().decode(files[configKey]));
  }

  const previewKey = Object.keys(files).find((k) =>
    /preview\.(png|jpg|jpeg|webp)$/i.test(k)
  );
  let previewBlob: Blob | null = null;
  if (previewKey) {
    const ext = previewKey.split(".").pop()!;
    previewBlob = new Blob([files[previewKey]], { type: `image/${ext}` });
  }

  const htmlKey = Object.keys(files).find(
    (k) => /template\.(html|htm)$/i.test(k) || k.endsWith(".html")
  );
  const htmlContent = htmlKey ? new TextDecoder().decode(files[htmlKey]) : "";

  const cssKey = Object.keys(files).find((k) => k.endsWith(".css"));
  const cssContent = cssKey ? new TextDecoder().decode(files[cssKey]) : "";

  return { config, previewBlob, htmlContent, cssContent };
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = "templates" | "categorias" | "configuracoes";

function BalcaoCvPage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState<DbCvTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showCss, setShowCss] = useState(false);
  const zipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("cv_templates")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        setTableError(true);
      } else {
        toast.error("Erro ao carregar templates", { description: error.message });
      }
      setLoading(false);
      return;
    }
    setTemplates((data as DbCvTemplate[]) ?? []);
    setTableError(false);
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setShowHtml(false);
    setShowCss(false);
    setModalOpen(true);
  }

  function openEdit(t: DbCvTemplate) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
      reactive_id: t.reactive_id ?? "",
      preview_url: t.preview_url,
      html_content: t.html_content ?? "",
      css_content: t.css_content ?? "",
      is_premium: t.is_premium,
      is_active: t.is_active,
    });
    setShowHtml(false);
    setShowCss(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(BLANK_FORM);
  }

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((p) => ({
      ...p,
      name,
      slug: p.slug === slugify(p.name) || p.slug === "" ? slugify(name) : p.slug,
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!form.slug.trim()) { toast.error("Slug obrigatório"); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      category: form.category,
      reactive_id: form.reactive_id.trim() || null,
      preview_url: form.preview_url,
      html_content: form.html_content || null,
      css_content: form.css_content || null,
      is_premium: form.is_premium,
      is_active: form.is_active,
      sort_order: editingId == null ? templates.length : undefined,
    };

    let err: { message: string } | null;
    if (editingId == null) {
      ({ error: err } = await (supabase as any).from("cv_templates").insert(payload));
    } else {
      ({ error: err } = await (supabase as any)
        .from("cv_templates")
        .update(payload)
        .eq("id", editingId));
    }

    if (err) {
      toast.error("Erro ao guardar", { description: err.message });
    } else {
      toast.success(editingId == null ? "Template criado!" : "Template actualizado!");
      closeModal();
      await loadTemplates();
    }
    setSaving(false);
  }

  async function handleDelete(t: DbCvTemplate) {
    if (!confirm(`Apagar o template "${t.name}"?`)) return;
    const { error } = await (supabase as any)
      .from("cv_templates")
      .delete()
      .eq("id", t.id);
    if (error) { toast.error("Erro ao apagar"); return; }
    toast.success("Template apagado");
    await loadTemplates();
  }

  async function toggleActive(t: DbCvTemplate) {
    const { error } = await (supabase as any)
      .from("cv_templates")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    toast.success(t.is_active ? "Template ocultado" : "Template activado");
    await loadTemplates();
  }

  async function moveTemplate(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= templates.length) return;

    const a = templates[index];
    const b = templates[swapIndex];

    await Promise.all([
      (supabase as any).from("cv_templates").update({ sort_order: b.sort_order }).eq("id", a.id),
      (supabase as any).from("cv_templates").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);

    await loadTemplates();
  }

  async function handleZipImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);

    try {
      const { config, previewBlob, htmlContent, cssContent } = await parseZipFile(file);

      let previewUrl: string | null = null;
      if (previewBlob) {
        const ext = previewBlob.type.split("/")[1] || "png";
        const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const path = `cv-templates/${filename}`;
        const { error: uploadErr } = await supabase.storage
          .from("images")
          .upload(path, previewBlob, { upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
          previewUrl = urlData?.publicUrl ?? null;
        }
      }

      const name = String(config.name ?? file.name.replace(".zip", ""));
      const slug = String(config.slug ?? slugify(name));

      setForm({
        name,
        slug,
        description: String(config.description ?? ""),
        category: String(config.category ?? "profissional"),
        reactive_id: String(config.reactive_id ?? ""),
        preview_url: previewUrl,
        html_content: htmlContent,
        css_content: cssContent,
        is_premium: Boolean(config.is_premium ?? false),
        is_active: true,
      });

      setShowHtml(!!htmlContent);
      setShowCss(!!cssContent);
      setModalOpen(true);
      toast.success("ZIP importado! Verifique e guarde o template.");
    } catch (err) {
      toast.error("Erro ao importar ZIP", { description: String(err) });
    } finally {
      setImporting(false);
    }
  }

  const activeCount = templates.filter((t) => t.is_active).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" /> CV Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os templates do construtor de CV
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={zipRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipImport}
          />
          <button
            onClick={() => zipRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-smooth disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4" />
            )}
            Importar ZIP
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
          >
            <Plus className="h-4 w-4" /> Adicionar Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 mb-6 w-fit">
        {(["templates", "categorias", "configuracoes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-smooth capitalize ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "templates" ? "Templates" : t === "categorias" ? "Categorias" : "Configurações"}
          </button>
        ))}
      </div>

      {/* Table missing warning */}
      {tableError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Tabela cv_templates não encontrada</p>
              <p className="text-sm text-muted-foreground mb-3">
                Corre a migration SQL no painel do Supabase (SQL Editor):
              </p>
              <pre className="text-xs bg-background border border-border rounded-lg p-3 overflow-x-auto text-foreground font-mono">
{`CREATE TABLE IF NOT EXISTS cv_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, slug text NOT NULL UNIQUE,
  description text DEFAULT '', category text DEFAULT 'profissional',
  preview_url text, html_content text, css_content text,
  reactive_id text, is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true, sort_order integer DEFAULT 0,
  downloads integer DEFAULT 0, created_at timestamptz DEFAULT now()
);
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active cv_templates"
  ON cv_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage cv_templates"
  ON cv_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','staff'))
  );`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && !tableError && (
        <TemplatesTab
          templates={templates}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleActive={toggleActive}
          onMove={moveTemplate}
          onNew={openNew}
        />
      )}

      {/* Categorias Tab */}
      {tab === "categorias" && <CategoriasTab />}

      {/* Configurações Tab */}
      {tab === "configuracoes" && (
        <ConfiguracaoTab activeCount={activeCount} total={templates.length} />
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-elegant border border-border">
            <div className="sticky top-0 z-10 bg-background flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-lg text-foreground">
                {editingId == null ? "Novo Template" : "Editar Template"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Name + Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Nome *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Modern Blue"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Slug *
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => patchForm("slug", e.target.value)}
                    placeholder="modern-blue"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => patchForm("description", e.target.value)}
                  placeholder="Breve descrição do template..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                />
              </div>

              {/* Category + Reactive ID */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => patchForm("category", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Reactive Resume ID
                  </label>
                  <input
                    value={form.reactive_id}
                    onChange={(e) => patchForm("reactive_id", e.target.value)}
                    placeholder="Ex: azurill"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Slug do template em rxresu.me (opcional)
                  </p>
                </div>
              </div>

              {/* Preview image */}
              <ImageUpload
                value={form.preview_url}
                onChange={(v) => patchForm("preview_url", v)}
                label="Imagem de pré-visualização"
                hint="Recomendado: proporção A4 (210×297 mm)"
                bucket="images"
                folder="cv-templates"
              />

              {/* HTML content */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowHtml((p) => !p)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {showHtml ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  HTML do template {form.html_content ? `(${form.html_content.length} chars)` : "(vazio)"}
                </button>
                {showHtml && (
                  <textarea
                    rows={8}
                    value={form.html_content}
                    onChange={(e) => patchForm("html_content", e.target.value)}
                    placeholder="<!-- HTML do template aqui -->"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                  />
                )}
              </div>

              {/* CSS content */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCss((p) => !p)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {showCss ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  CSS do template {form.css_content ? `(${form.css_content.length} chars)` : "(vazio)"}
                </button>
                {showCss && (
                  <textarea
                    rows={6}
                    value={form.css_content}
                    onChange={(e) => patchForm("css_content", e.target.value)}
                    placeholder="/* CSS do template aqui */"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                  />
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => patchForm("is_premium", !form.is_premium)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${form.is_premium ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_premium ? "translate-x-4" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> Premium
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => patchForm("is_active", !form.is_active)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-brand" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">Activo</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingId == null ? "Criar template" : "Guardar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Templates Tab ──────────────────────────────────────────────────────────────

interface TemplatesTabProps {
  templates: DbCvTemplate[];
  loading: boolean;
  onEdit: (t: DbCvTemplate) => void;
  onDelete: (t: DbCvTemplate) => void;
  onToggleActive: (t: DbCvTemplate) => void;
  onMove: (index: number, dir: "up" | "down") => void;
  onNew: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  profissional: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  criativo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  simples: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  academico: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  moderno: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  minimalista: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
};

function TemplateCard({
  t,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: {
  t: DbCvTemplate;
  index: number;
  total: number;
  onEdit: (t: DbCvTemplate) => void;
  onDelete: (t: DbCvTemplate) => void;
  onToggleActive: (t: DbCvTemplate) => void;
  onMove: (index: number, dir: "up" | "down") => void;
}) {
  const colorClass = CATEGORY_COLORS[t.category] ?? "bg-muted text-muted-foreground";
  const previewGradient = t.preview_url
    ? undefined
    : `linear-gradient(135deg, hsl(${(t.slug.charCodeAt(0) * 17) % 360}, 60%, 55%), hsl(${(t.slug.charCodeAt(0) * 29) % 360}, 50%, 40%))`;

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all ${
        t.is_active ? "border-border" : "border-border/40 opacity-60"
      }`}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden bg-muted"
        style={{ aspectRatio: "210/120", background: previewGradient }}
      >
        {t.preview_url && (
          <img
            src={t.preview_url}
            alt={t.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        {t.is_premium && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white">
            <Star className="h-2.5 w-2.5" /> Premium
          </div>
        )}
        {!t.is_active && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Oculto
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-foreground leading-tight truncate">{t.name}</p>
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorClass}`}>
            {t.category}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2">
          {t.description || "Sem descrição"}
        </p>
        {t.reactive_id && (
          <p className="text-[10px] text-muted-foreground font-mono mb-2">
            rxid: {t.reactive_id}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-border/50">
          <button
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            title="Mover para cima"
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(index, "down")}
            disabled={index === total - 1}
            title="Mover para baixo"
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleActive(t)}
            title={t.is_active ? "Ocultar" : "Activar"}
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onEdit(t)}
            title="Editar"
            className="rounded p-1 text-muted-foreground hover:text-brand transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(t)}
            title="Apagar"
            className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab({
  templates,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
  onNew,
}: TemplatesTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-16 text-center text-muted-foreground">
        <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium">Nenhum template criado ainda</p>
        <p className="text-xs mt-1">Adicione um template ou importe um ficheiro ZIP</p>
        <button
          onClick={onNew}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          <Plus className="h-4 w-4" /> Criar primeiro template
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((t, index) => (
        <TemplateCard
          key={t.id}
          t={t}
          index={index}
          total={templates.length}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

// ── Categorias Tab ─────────────────────────────────────────────────────────────

function CategoriasTab() {
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : [...CATEGORIES];
    } catch {
      return [...CATEGORIES];
    }
  });
  const [newCat, setNewCat] = useState("");

  function save(updated: string[]) {
    setCategories(updated);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updated));
  }

  function addCategory() {
    const val = newCat.trim().toLowerCase();
    if (!val) return;
    if (categories.includes(val)) {
      toast.error("Categoria já existe");
      return;
    }
    save([...categories, val]);
    setNewCat("");
    toast.success("Categoria adicionada");
  }

  function removeCategory(cat: string) {
    save(categories.filter((c) => c !== cat));
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Categorias disponíveis
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCategory(); }
            }}
            placeholder="Nova categoria..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={addCategory}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          As categorias são guardadas localmente neste browser. São usadas no formulário de criação de templates.
        </p>
      </div>
    </div>
  );
}

// ── Configurações Tab ──────────────────────────────────────────────────────────

function ConfiguracaoTab({ activeCount, total }: { activeCount: number; total: number }) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total templates</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Activos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{TEMPLATE_META.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Templates locais</p>
        </div>
      </div>

      {/* ZIP format instructions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-brand" />
          <h3 className="font-semibold text-sm text-foreground">Estrutura do ZIP de template</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Para importar um template via ZIP, o ficheiro deve conter:
        </p>
        <pre className="text-xs bg-muted rounded-lg p-3 font-mono text-foreground overflow-x-auto">
{`template.zip
├── config.json        ← metadados (name, slug, category, ...)
├── preview.png        ← imagem de pré-visualização (A4)
├── template.html      ← HTML do template (opcional)
└── style.css          ← CSS do template (opcional)`}
        </pre>
        <p className="text-xs text-muted-foreground mt-3 font-semibold">config.json exemplo:</p>
        <pre className="text-xs bg-muted rounded-lg p-3 font-mono text-foreground overflow-x-auto mt-1">
{`{
  "name": "Modern Blue",
  "slug": "modern-blue",
  "description": "Template moderno e profissional",
  "category": "profissional",
  "reactive_id": "azurill",
  "is_premium": false
}`}
        </pre>
      </div>

      {/* Storage info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-brand" />
          <h3 className="font-semibold text-sm text-foreground">Armazenamento de imagens</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          As imagens de pré-visualização são guardadas no bucket <code className="bg-muted rounded px-1 py-0.5">images</code>{" "}
          na pasta <code className="bg-muted rounded px-1 py-0.5">cv-templates/</code> do Supabase Storage.
          Certifique-se que o bucket tem política pública de leitura.
        </p>
      </div>

      {/* Reactive Resume integration */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-brand" />
          <h3 className="font-semibold text-sm text-foreground">Integração com Reactive Resume</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          O campo <strong>Reactive Resume ID</strong> mapeia para um template do rxresu.me.
          Por exemplo, <code className="bg-muted rounded px-1 py-0.5">azurill</code> usa o template
          Azurill da API do Reactive Resume.
        </p>
        <p className="text-xs text-muted-foreground">
          Quando um utilizador selecciona um template com <code className="bg-muted rounded px-1 py-0.5">reactive_id</code>,
          o editor usa a API para gerar o PDF com esse template em vez do template local.
          A chave da API é configurada na variável de ambiente{" "}
          <code className="bg-muted rounded px-1 py-0.5">REACTIVE_API_KEY</code> no Cloudflare Pages.
        </p>
      </div>
    </div>
  );
}
