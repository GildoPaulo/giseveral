import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap, Plus, Pencil, Trash2, Star, Globe,
  Loader2, Save, X, Check, Bot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerAutoNotify } from "@/services/autoNotify";
import { SCHOLARSHIPS } from "@/data/hub-bolsas";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export const Route = createFileRoute("/balcao/bolsas")({
  component: BalcaoBolsas,
});

type GuideStep = { title: string; description: string; tip?: string; link?: string };
type Material = { title: string; type: string; url: string };

type ScholarshipRow = {
  id: string;
  title: string;
  country: string;
  flag: string;
  level: string;
  area: string;
  coverage: string;
  language: string;
  deadline: string;
  institution: string;
  description: string | null;
  apply_url: string;
  benefits: string[];
  requirements: string[];
  process_steps: string[];
  documents: string[];
  tips: string[];
  featured: boolean;
  active: boolean;
  created_at: string;
  content_rich: string | null;
  guides: GuideStep[];
  materials: Material[];
  image_url: string | null;
  edital_url: string | null;
  comments_enabled: boolean;
  allow_applications: boolean;
};

function emptyRow(): ScholarshipRow {
  return {
    id: crypto.randomUUID(),
    title: "", country: "", flag: "🌍", level: "Licenciatura / Mestrado",
    area: "", coverage: "Bolsa integral", language: "Inglês", deadline: "",
    institution: "", description: "", apply_url: "",
    benefits: [], requirements: [], process_steps: [], documents: [], tips: [],
    featured: false, active: true, created_at: new Date().toISOString(),
    content_rich: null, guides: [], materials: [], image_url: null, edital_url: null,
    comments_enabled: true, allow_applications: true,
  };
}

function GuideEditor({ value, onChange }: { value: GuideStep[]; onChange: (v: GuideStep[]) => void }) {
  function add() { onChange([...value, { title: "", description: "" }]); }
  function update(i: number, patch: Partial<GuideStep>) {
    onChange(value.map((s, j) => j === i ? { ...s, ...patch } : s));
  }
  function remove(i: number) { onChange(value.filter((_, j) => j !== i)); }
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Guia passo-a-passo</label>
      {value.map((step, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Passo {i + 1}</span>
            <button onClick={() => remove(i)} className="ml-auto text-xs text-destructive hover:underline">Remover</button>
          </div>
          <input value={step.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Título do passo"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30" />
          <textarea value={step.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Descrição" rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-brand/30" />
          <div className="grid grid-cols-2 gap-2">
            <input value={step.tip ?? ""} onChange={(e) => update(i, { tip: e.target.value || undefined })} placeholder="Dica (opcional)"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30" />
            <input value={step.link ?? ""} onChange={(e) => update(i, { link: e.target.value || undefined })} placeholder="Link (opcional)"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30" />
          </div>
        </div>
      ))}
      <button onClick={add} className="text-xs text-brand hover:underline">+ Adicionar passo</button>
    </div>
  );
}

function MaterialEditor({ value, onChange }: { value: Material[]; onChange: (v: Material[]) => void }) {
  function add() { onChange([...value, { title: "", type: "link", url: "" }]); }
  function update(i: number, patch: Partial<Material>) {
    onChange(value.map((m, j) => j === i ? { ...m, ...patch } : m));
  }
  function remove(i: number) { onChange(value.filter((_, j) => j !== i)); }
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Materiais e recursos</label>
      {value.map((mat, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <select value={mat.type} onChange={(e) => update(i, { type: e.target.value })}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="link">Link</option>
              <option value="pdf">PDF</option>
              <option value="video">Vídeo</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <button onClick={() => remove(i)} className="ml-auto text-xs text-destructive hover:underline">Remover</button>
          </div>
          <input value={mat.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Título do recurso"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30" />
          <input value={mat.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="URL / link"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand/30" />
        </div>
      ))}
      <button onClick={add} className="text-xs text-brand hover:underline">+ Adicionar recurso</button>
    </div>
  );
}

function ArrayEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    if (!input.trim()) return;
    onChange([...value, input.trim()]);
    setInput("");
  }
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand text-xs px-2.5 py-0.5 font-medium">
            {v}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-destructive ml-0.5">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { add(); e.preventDefault(); } }}
          placeholder="Escreva e pressione Enter"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button onClick={add} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
          +
        </button>
      </div>
    </div>
  );
}

function BalcaoBolsas() {
  const [items, setItems] = useState<ScholarshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ScholarshipRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [importingPdf, setImportingPdf] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hub_scholarships")
      .select("*")
      .order("featured", { ascending: false });

    if (error || !data || data.length === 0) {
      setItems(SCHOLARSHIPS.map((s) => ({
        id: s.id, title: s.title, country: s.country, flag: s.flag,
        level: s.level, area: s.area, coverage: s.coverage, language: s.language,
        deadline: s.deadline, institution: s.institution, description: s.description ?? null,
        apply_url: s.applyUrl, benefits: s.benefits ?? [], requirements: s.requirements ?? [],
        process_steps: s.process ?? [], documents: s.documents ?? [], tips: s.tips ?? [],
        featured: s.featured ?? false, active: true, created_at: new Date().toISOString(),
        content_rich: null, guides: [], materials: [], image_url: null, edital_url: null,
        comments_enabled: true, allow_applications: true,
      })));
    } else {
      setItems(data.map((r) => ({
        ...r,
        guides: Array.isArray(r.guides) ? (r.guides as GuideStep[]) : [],
        materials: Array.isArray(r.materials) ? (r.materials as Material[]) : [],
      })) as ScholarshipRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleField(id: string, field: "active" | "featured", val: boolean) {
    const payload: { active?: boolean; featured?: boolean } =
      field === "featured" ? { featured: val } : { active: val };
    const { error } = await supabase
      .from("hub_scholarships")
      .update(payload)
      .eq("id", id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    setItems((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta bolsa? Esta acção não pode ser desfeita.")) return;
    setDeleting(id);
    const { error } = await supabase.from("hub_scholarships").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); setDeleting(null); return; }
    setItems((prev) => prev.filter((s) => s.id !== id));
    toast.success("Bolsa eliminada.");
    setDeleting(null);
  }

  async function handleSave(form: ScholarshipRow) {
    if (!form.title.trim() || !form.country.trim() || !form.apply_url.trim()) {
      toast.error("Título, País e URL oficial de candidatura são obrigatórios.");
      return;
    }
    setSaving(true);
    const isNew = !items.find((s) => s.id === form.id);
    const payload = {
      title: form.title, country: form.country, flag: form.flag,
      level: form.level, area: form.area, coverage: form.coverage,
      language: form.language, deadline: form.deadline, institution: form.institution,
      description: form.description || null, apply_url: form.apply_url,
      benefits: form.benefits, requirements: form.requirements,
      process_steps: form.process_steps, documents: form.documents, tips: form.tips,
      featured: form.featured, active: form.active,
      content_rich: form.content_rich || null, guides: form.guides, materials: form.materials,
      image_url: form.image_url || null, edital_url: form.edital_url || null,
      comments_enabled: form.comments_enabled, allow_applications: form.allow_applications,
    };

    const { error } = await (supabase as any).from("hub_scholarships").upsert(
      { id: form.id, ...payload },
      { onConflict: "id" },
    );

    if (error) {
      toast.error("Erro ao guardar: " + error.message);
    } else {
      if (isNew) setItems((prev) => [form, ...prev]);
      else setItems((prev) => prev.map((s) => s.id === form.id ? form : s));
      toast.success("Bolsa guardada!");
      setEditing(null);
      if (isNew && form.active) {
        triggerAutoNotify({
          event_type: "nova_bolsa",
          title: `Nova bolsa: ${form.title}`,
          body: `${form.institution || form.country} · Prazo: ${form.deadline || "em aberto"}`,
          url: `/hub/bolsas`,
          channels: ["push", "email"],
          target: "all",
        });
      }
    }
    setSaving(false);
  }

  function upd(fn: (p: ScholarshipRow) => ScholarshipRow) {
    setEditing((prev) => prev ? fn(prev) : prev);
  }

  async function importScholarshipPdf(file: File) {
    setImportingPdf(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scholarship/import-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao importar PDF");

      upd((p) => ({
        ...p,
        title: data.title || p.title,
        country: data.country || p.country,
        flag: data.flag || p.flag,
        level: data.level || p.level,
        area: data.area || p.area,
        coverage: data.coverage || p.coverage,
        language: data.language || p.language,
        deadline: data.deadline || p.deadline,
        institution: data.institution || p.institution,
        description: data.description || p.description,
        apply_url: data.apply_url || p.apply_url,
        benefits: Array.isArray(data.benefits) && data.benefits.length ? data.benefits : p.benefits,
        requirements: Array.isArray(data.requirements) && data.requirements.length ? data.requirements : p.requirements,
        process_steps: Array.isArray(data.process_steps) && data.process_steps.length ? data.process_steps : p.process_steps,
        documents: Array.isArray(data.documents) && data.documents.length ? data.documents : p.documents,
        tips: Array.isArray(data.tips) && data.tips.length ? data.tips : p.tips,
      }));
      toast.success("Edital importado com IA. Revê os campos antes de guardar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar PDF");
    } finally {
      setImportingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  /* ── Editor ─────────────────────────────────────────────── */
  if (editing) {
    const f = editing;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-brand transition-colors">
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-brand flex-1">
            {items.find((s) => s.id === f.id) ? "Editar bolsa" : "Nova bolsa"}
          </h2>
          <button
            onClick={() => handleSave(f)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>

        {/* Main fields */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/40 bg-background px-4 py-3 text-sm font-bold text-brand hover:bg-brand/5 transition-colors">
              {importingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {importingPdf ? "A importar edital..." : "Importar PDF com IA"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={importingPdf}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (file) importScholarshipPdf(file);
                }}
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Envia o edital oficial em PDF para pré-preencher título, prazo, requisitos, benefícios e link oficial.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título *</label>
              <input value={f.title} onChange={(e) => upd((p) => ({ ...p, title: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instituição</label>
              <input value={f.institution} onChange={(e) => upd((p) => ({ ...p, institution: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">País *</label>
              <input value={f.country} onChange={(e) => upd((p) => ({ ...p, country: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bandeira (emoji)</label>
              <input value={f.flag} onChange={(e) => upd((p) => ({ ...p, flag: e.target.value }))} placeholder="🇬🇧"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prazo</label>
              <input value={f.deadline} onChange={(e) => upd((p) => ({ ...p, deadline: e.target.value }))} placeholder="Outubro 2025"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nível</label>
              <input value={f.level} onChange={(e) => upd((p) => ({ ...p, level: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Área</label>
              <input value={f.area} onChange={(e) => upd((p) => ({ ...p, area: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Idioma</label>
              <input value={f.language} onChange={(e) => upd((p) => ({ ...p, language: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cobertura</label>
              <input value={f.coverage} onChange={(e) => upd((p) => ({ ...p, coverage: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL oficial de candidatura *</label>
              <input value={f.apply_url} onChange={(e) => upd((p) => ({ ...p, apply_url: e.target.value }))} placeholder="https://..."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição breve</label>
            <textarea value={f.description ?? ""} onChange={(e) => upd((p) => ({ ...p, description: e.target.value }))} rows={3}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>

          <div>
            <RichTextEditor
              value={f.content_rich ?? ""}
              onChange={(html) => upd((p) => ({ ...p, content_rich: html }))}
              label="Conteúdo rico (texto expandido)"
              hint="Use formatação avançada para centrar ou ampliar detalhes da bolsa."
              placeholder="Redija o conteúdo detalhado com texto rico..."
              bucket="images"
              folder="bolsas"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUpload
              value={f.image_url}
              onChange={(url) => upd((p) => ({ ...p, image_url: url }))}
              label="Imagem de capa"
              hint="Arraste uma imagem ou use uma URL externa."
              bucket="images"
              folder="bolsas"
            />
            <FileUpload
              value={f.edital_url}
              onChange={(url) => upd((p) => ({ ...p, edital_url: url }))}
              label="Edital / PDF oficial"
              hint="PDF do edital da bolsa"
              bucket="hub-documents"
              folder="bolsas/editais"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.active} onChange={(e) => upd((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
              Activa
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.featured} onChange={(e) => upd((p) => ({ ...p, featured: e.target.checked }))} className="rounded" />
              Destaque
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.comments_enabled} onChange={(e) => upd((p) => ({ ...p, comments_enabled: e.target.checked }))} className="rounded" />
              Comentários activos
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.allow_applications} onChange={(e) => upd((p) => ({ ...p, allow_applications: e.target.checked }))} className="rounded" />
              Aceitar pedidos de ajuda
            </label>
          </div>
        </div>

        {/* Array fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Benefícios" value={f.benefits} onChange={(v) => upd((p) => ({ ...p, benefits: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Requisitos" value={f.requirements} onChange={(v) => upd((p) => ({ ...p, requirements: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Passos do processo" value={f.process_steps} onChange={(v) => upd((p) => ({ ...p, process_steps: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Documentos necessários" value={f.documents} onChange={(v) => upd((p) => ({ ...p, documents: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-2">
            <ArrayEditor label="Dicas" value={f.tips} onChange={(v) => upd((p) => ({ ...p, tips: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-2">
            <GuideEditor value={f.guides} onChange={(v) => upd((p) => ({ ...p, guides: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:col-span-2">
            <MaterialEditor value={f.materials} onChange={(v) => upd((p) => ({ ...p, materials: v }))} />
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" /> Bolsas Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} bolsas · visíveis em /hub/bolsas
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyRow())}
          className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
        >
          <Plus className="h-4 w-4" /> Nova bolsa
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium">Sem bolsas ainda</p>
          <button onClick={() => setEditing(emptyRow())} className="mt-3 text-sm text-brand hover:underline">
            + Adicionar bolsa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card hover:shadow-elegant transition-smooth">
              <span className="text-2xl flex-shrink-0" aria-hidden>{s.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{s.title}</p>
                  {s.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-gold/10 text-gold px-2 py-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" /> Destaque
                    </span>
                  )}
                  {!s.active && (
                    <span className="text-[10px] font-bold rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.country} · {s.institution || "—"} · {s.deadline || "—"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Toggle featured */}
                <button
                  onClick={() => toggleField(s.id, "featured", !s.featured)}
                  title={s.featured ? "Remover destaque" : "Marcar como destaque"}
                  className={`p-1.5 rounded-md transition-colors ${s.featured ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                >
                  <Star className={`h-4 w-4 ${s.featured ? "fill-current" : ""}`} />
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => toggleField(s.id, "active", !s.active)}
                  title={s.active ? "Desactivar" : "Activar"}
                  className={`p-1.5 rounded-md transition-colors ${s.active ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                >
                  {s.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>

                {/* Open apply URL */}
                {s.apply_url && (
                  <a href={s.apply_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-brand transition-colors"
                    title="Abrir candidatura"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}

                {/* Edit */}
                <button
                  onClick={() => setEditing(s)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {deleting === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
