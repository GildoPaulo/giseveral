import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LETTER_TYPES, type LetterField } from "@/data/hub-cartas";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  FileText, Save, X, GripVertical, CheckCircle2, AlertCircle, Sparkles,
  Upload, Loader2,
} from "lucide-react";

// ── Extract text from uploaded template file (.txt, .pdf, .docx, .rtf) ─────────

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "txt") {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res((e.target?.result as string) ?? "");
      reader.onerror = rej;
      reader.readAsText(file, "utf-8");
    });
  }

  if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url,
    ).toString();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it: any) => it.str).join(" "));
    }
    return pages.join("\n");
  }

  if (ext === "docx") {
    const { default: mammoth } = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (ext === "rtf") {
    // Simple RTF text extraction: remove control words and braces
    const raw = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res((e.target?.result as string) ?? "");
      reader.onerror = rej;
      reader.readAsText(file, "ascii");
    });
    const text = raw
      .replace(/\{\\[^{}]*\}/g, "")       // remove groups like {\fonttbl ...}
      .replace(/\\[a-z]+[-\d]* ?/g, " ")  // remove control words
      .replace(/[{}]/g, "")               // remove braces
      .replace(/\r?\n/g, "\n")
      .replace(/  +/g, " ")
      .trim();
    return text;
  }

  throw new Error(`Formato não suportado: .${ext}`);
}

export const Route = createFileRoute("/balcao/cartas")({
  component: BalcaoCartasPage,
});

type DbTemplate = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  fields: LetterField[];
  template: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type FormState = {
  title: string;
  description: string;
  icon: string;
  category: string;
  template: string;
  fields_raw: string; // JSON string of fields array
};

const BLANK_FORM: FormState = {
  title: "",
  description: "",
  icon: "📄",
  category: "académico",
  template: "",
  fields_raw: "[]",
};

const ICON_OPTIONS = ["📄", "🎓", "💼", "📝", "✍️", "🚀", "⭐", "🏢", "📋", "🔖", "📑", "🖊️"];

// ── Validate fields JSON ──────────────────────────────────────────────────────
function parseFields(raw: string): { ok: boolean; fields: LetterField[]; error?: string } {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: false, fields: [], error: "Deve ser um array JSON" };
    return { ok: true, fields: parsed as LetterField[] };
  } catch {
    return { ok: false, fields: [], error: "JSON inválido" };
  }
}

// Build simple fields from template placeholders automatically
function autoFields(template: string): LetterField[] {
  const matches = [...template.matchAll(/\{\{(\w+)\}\}/g)];
  const keys = [...new Set(matches.map((m) => m[1]))];
  return keys.map((k) => ({
    key: k,
    label: k.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    placeholder: `Preencha: ${k.toLowerCase().replace(/_/g, " ")}`,
    type: k.toLowerCase().includes("descri") || k.toLowerCase().includes("motiv") || k.toLowerCase().includes("texto")
      ? "textarea"
      : k.toLowerCase().includes("data")
      ? "date"
      : "text",
    required: true,
  }));
}

function BalcaoCartasPage() {
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DbTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedStatic, setExpandedStatic] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) { toast.error("Ficheiro vazio ou sem texto extraível."); return; }
      setForm((p) => ({ ...p, template: text.trim() }));
      toast.success("Texto importado! Verifique e ajuste o template.");
    } catch (err) {
      toast.error("Erro ao importar", { description: String(err) });
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("letter_templates")
      .select("*")
      .order("sort_order", { ascending: true });
    setDbTemplates((data as DbTemplate[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setForm(BLANK_FORM);
  }

  function openEdit(t: DbTemplate) {
    setEditing(t);
    setIsNew(false);
    setForm({
      title: t.title,
      description: t.description,
      icon: t.icon,
      category: t.category,
      template: t.template,
      fields_raw: JSON.stringify(t.fields, null, 2),
    });
  }

  function closeForm() {
    setEditing(null);
    setIsNew(false);
    setForm(BLANK_FORM);
  }

  function autoDetectFields() {
    const fields = autoFields(form.template);
    setForm((p) => ({ ...p, fields_raw: JSON.stringify(fields, null, 2) }));
    toast.success(`${fields.length} campos detectados automaticamente`);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    if (!form.template.trim()) { toast.error("Template obrigatório"); return; }
    const { ok, fields, error } = parseFields(form.fields_raw);
    if (!ok) { toast.error("Campos JSON inválido", { description: error }); return; }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      category: form.category.trim(),
      template: form.template,
      fields,
      sort_order: isNew ? dbTemplates.length : (editing?.sort_order ?? 0),
    };

    let err;
    if (isNew) {
      ({ error: err } = await (supabase as any).from("letter_templates").insert(payload));
    } else {
      ({ error: err } = await (supabase as any).from("letter_templates")
        .update(payload)
        .eq("id", editing!.id));
    }

    if (err) {
      toast.error("Erro ao guardar", { description: err.message });
    } else {
      toast.success(isNew ? "Template criado!" : "Template actualizado!");
      closeForm();
      await loadTemplates();
    }
    setSaving(false);
  }

  async function toggleActive(t: DbTemplate) {
    const { error } = await (supabase as any).from("letter_templates")
      .update({ active: !t.active })
      .eq("id", t.id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    toast.success(t.active ? "Template ocultado" : "Template activado");
    await loadTemplates();
  }

  async function handleDelete(t: DbTemplate) {
    if (!confirm(`Apagar o template "${t.title}"?`)) return;
    const { error } = await (supabase as any).from("letter_templates").delete().eq("id", t.id);
    if (error) { toast.error("Erro ao apagar"); return; }
    toast.success("Template apagado");
    await loadTemplates();
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-brand">Templates de Cartas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os modelos disponíveis na página de Cartas Inteligentes
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
        >
          <Plus className="h-4 w-4" /> Novo template
        </button>
      </div>

      {/* ── Form Panel ───────────────────────────────────────────────────────── */}
      {(isNew || editing) && (
        <div className="mb-8 rounded-2xl border-2 border-brand/30 bg-card p-5 sm:p-7 shadow-elegant">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-foreground">
              {isNew ? "Novo template" : `Editar: ${editing!.title}`}
            </h2>
            <button onClick={closeForm} className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Icon picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setForm((p) => ({ ...p, icon: ic }))}
                    className={`text-xl rounded-lg p-1.5 border-2 transition-colors ${form.icon === ic ? "border-brand bg-brand/10" : "border-border hover:border-brand/40"}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Título *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Carta de Motivação para Bolsa"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Descrição</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Para candidaturas a bolsas nacionais e internacionais"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Categoria</label>
              <input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="Ex: académico, profissional, pessoal"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {/* Template text */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Texto do template *
                  <span className="ml-2 normal-case font-normal text-muted-foreground/70">
                    Use {"{{CAMPO}}"} para campos variáveis
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 text-xs rounded-lg border border-brand/40 px-2.5 py-1 text-brand hover:bg-brand/10 transition-smooth disabled:opacity-50"
                  title="Importar de ficheiro .txt, .pdf, .docx ou .rtf"
                >
                  {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Importar ficheiro
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.rtf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
              <textarea
                rows={12}
                value={form.template}
                onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))}
                placeholder={`Maputo, {{DATA}}\n\nAssunto: {{ASSUNTO}}\n\nExmos. Senhores,\n\n{{TEXTO_PRINCIPAL}}\n\nCom os melhores cumprimentos,\n{{NOME_COMPLETO}}`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Importar: <strong>.txt</strong>, <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.rtf</strong> — o texto será extraído e colocado aqui para edição.
              </p>
            </div>

            {/* Fields JSON */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Campos (JSON)
                </label>
                <button
                  onClick={autoDetectFields}
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <Sparkles className="h-3 w-3" /> Detectar automaticamente
                </button>
              </div>
              <textarea
                rows={8}
                value={form.fields_raw}
                onChange={(e) => setForm((p) => ({ ...p, fields_raw: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                placeholder='[{"key":"NOME_COMPLETO","label":"Nome completo","placeholder":"Ex: ...","type":"text","required":true}]'
              />
              {(() => {
                const { ok, error, fields } = parseFields(form.fields_raw);
                if (!ok) return (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {error}
                  </p>
                );
                return (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {fields.length} campos válidos
                  </p>
                );
              })()}
              <p className="text-[11px] text-muted-foreground mt-1">
                Tipos disponíveis: <code>text</code>, <code>textarea</code>, <code>date</code>, <code>select</code>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
            <button onClick={closeForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card disabled:opacity-50"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" /> : <Save className="h-4 w-4" />}
              {isNew ? "Criar template" : "Guardar alterações"}
            </button>
          </div>
        </div>
      )}

      {/* ── DB Templates ─────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Templates personalizados ({dbTemplates.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : dbTemplates.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhum template personalizado ainda</p>
            <p className="text-xs mt-1">Crie um novo template para aparecer no Hub</p>
            <button
              onClick={openNew}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              <Plus className="h-4 w-4" /> Criar primeiro template
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dbTemplates.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 ${t.active ? "border-border" : "border-border/50 opacity-60"}`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                    <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {t.category}
                    </span>
                    {!t.active && (
                      <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        oculto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.description || "Sem descrição"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(t)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title={t.active ? "Ocultar" : "Activar"}
                  >
                    {t.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-brand transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Apagar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Static Templates Reference ───────────────────────────────────────── */}
      <section>
        <button
          onClick={() => setExpandedStatic((p) => !p)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 hover:text-foreground transition-colors"
        >
          Templates estáticos incluídos ({LETTER_TYPES.length})
          {expandedStatic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <p className="text-xs text-muted-foreground mb-3">
          Estes templates são embutidos no código e aparecem sempre no Hub. Crie um novo template personalizado para adicionar variantes.
        </p>

        {expandedStatic && (
          <div className="space-y-2">
            {LETTER_TYPES.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground/70 truncate">{t.title}</p>
                    <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{t.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 truncate">{t.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{t.fields.length} campos</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

