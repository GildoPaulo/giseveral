import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap, Plus, Pencil, Trash2, Star, Loader2, Save, X, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EXAMS } from "@/data/hub-exams";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export const Route = createFileRoute("/balcao/exames")({
  component: BalcaoExames,
});

type ExamRow = {
  id: string; title: string; institution: string; course: string;
  year: number; subjects: string[]; difficulty: string; description: string | null;
  content_rich: string | null; image_url: string | null; file_url: string | null;
  solution_url: string | null; active: boolean; featured: boolean;
  comments_enabled: boolean; allow_registrations: boolean;
  registration_url: string | null; registration_deadline: string | null;
  registration_fee: string | null; tips: string[]; created_at: string;
};

function emptyRow(): ExamRow {
  return {
    id: "", title: "", institution: "", course: "", year: new Date().getFullYear(),
    subjects: [], difficulty: "Médio", description: null, content_rich: null,
    image_url: null, file_url: null, solution_url: null,
    active: true, featured: false, comments_enabled: true, allow_registrations: false,
    registration_url: null, registration_deadline: null, registration_fee: null,
    tips: [], created_at: new Date().toISOString(),
  };
}

function ArrayEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() { if (!input.trim()) return; onChange([...value, input.trim()]); setInput(""); }
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
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { add(); e.preventDefault(); } }}
          placeholder="Escreva e pressione Enter"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <button onClick={add} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">+</button>
      </div>
    </div>
  );
}

function BalcaoExames() {
  const [items, setItems] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("hub_exams").select("*").order("featured", { ascending: false });
    if (error || !data || data.length === 0) {
      setItems(EXAMS.map((e) => ({
        id: e.id, title: e.title, institution: e.institution, course: e.course,
        year: e.year, subjects: e.subjects, difficulty: e.difficulty,
        description: e.description ?? null, content_rich: null,
        image_url: null, file_url: e.fileUrl ?? null, solution_url: e.solutionUrl ?? null,
        active: true, featured: e.featured ?? false, comments_enabled: true,
        allow_registrations: e.allowRegistrations ?? false,
        registration_url: e.registrationUrl ?? null,
        registration_deadline: e.registrationDeadline ?? null,
        registration_fee: e.registrationFee ?? null,
        tips: e.tips ?? [], created_at: new Date().toISOString(),
      })));
    } else {
      setItems(data as ExamRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleField(id: string, field: "active" | "featured", val: boolean) {
    const payload: { active?: boolean; featured?: boolean } = field === "featured" ? { featured: val } : { active: val };
    const { error } = await supabase.from("hub_exams").update(payload).eq("id", id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    setItems((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este exame?")) return;
    setDeleting(id);
    const { error } = await supabase.from("hub_exams").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); setDeleting(null); return; }
    setItems((prev) => prev.filter((e) => e.id !== id));
    toast.success("Exame eliminado.");
    setDeleting(null);
  }

  async function handleSave(form: ExamRow) {
    if (!form.title.trim() || !form.id.trim() || !form.institution.trim()) {
      toast.error("ID, Título e Instituição são obrigatórios."); return;
    }
    setSaving(true);
    const isNew = !items.find((e) => e.id === form.id);
    const payload = {
      title: form.title, institution: form.institution, course: form.course,
      year: form.year, subjects: form.subjects, difficulty: form.difficulty,
      description: form.description || null, content_rich: form.content_rich || null,
      image_url: form.image_url || null, file_url: form.file_url || null,
      solution_url: form.solution_url || null, active: form.active, featured: form.featured,
      comments_enabled: form.comments_enabled, allow_registrations: form.allow_registrations,
      registration_url: form.registration_url || null,
      registration_deadline: form.registration_deadline || null,
      registration_fee: form.registration_fee || null,
      tips: form.tips,
    };

    let err: { message: string } | null = null;
    if (isNew) {
      const { error } = await supabase.from("hub_exams").insert({ id: form.id, ...payload });
      err = error;
      if (!err) setItems((prev) => [form, ...prev]);
    } else {
      const { error } = await supabase.from("hub_exams").update(payload).eq("id", form.id);
      err = error;
      if (!err) setItems((prev) => prev.map((e) => e.id === form.id ? form : e));
    }

    if (err) toast.error("Erro ao guardar: " + err.message);
    else { toast.success("Exame guardado!"); setEditing(null); }
    setSaving(false);
  }

  function upd(fn: (p: ExamRow) => ExamRow) {
    setEditing((prev) => prev ? fn(prev) : prev);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  /* Editor */
  if (editing) {
    const f = editing;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-brand transition-colors">← Voltar</button>
          <h2 className="text-xl font-bold text-brand flex-1">
            {items.find((e) => e.id === f.id) ? "Editar exame" : "Novo exame"}
          </h2>
          <button onClick={() => handleSave(f)} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID / Slug *</label>
              <input value={f.id} onChange={(e) => upd((p) => ({ ...p, id: e.target.value }))}
                placeholder="uem-engenharia-2026"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título *</label>
              <input value={f.title} onChange={(e) => upd((p) => ({ ...p, title: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instituição *</label>
              <input value={f.institution} onChange={(e) => upd((p) => ({ ...p, institution: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Curso</label>
              <input value={f.course} onChange={(e) => upd((p) => ({ ...p, course: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ano</label>
              <input type="number" value={f.year} onChange={(e) => upd((p) => ({ ...p, year: +e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dificuldade</label>
              <select value={f.difficulty} onChange={(e) => upd((p) => ({ ...p, difficulty: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option>Fácil</option><option>Médio</option><option>Difícil</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taxa de inscrição</label>
              <input value={f.registration_fee ?? ""} onChange={(e) => upd((p) => ({ ...p, registration_fee: e.target.value }))} placeholder="1.500 MZN"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FileUpload
              value={f.file_url}
              onChange={(url) => upd((p) => ({ ...p, file_url: url }))}
              label="Ficheiro do exame (PDF / DOCX)"
              hint="PDF, DOCX, PPTX aceites"
              bucket="hub-documents"
              folder="exames"
            />
            <FileUpload
              value={f.solution_url}
              onChange={(url) => upd((p) => ({ ...p, solution_url: url }))}
              label="Gabarito / Resolução"
              hint="PDF ou DOCX com resolução"
              bucket="hub-documents"
              folder="exames/resolucoes"
            />
          </div>
          <div>
            <ImageUpload
              value={f.image_url}
              onChange={(url) => upd((p) => ({ ...p, image_url: url }))}
              label="Imagem de capa"
              hint="Arraste a imagem do exame ou cole um URL externo."
              bucket="images"
              folder="exames"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL de inscrição</label>
            <input value={f.registration_url ?? ""} onChange={(e) => upd((p) => ({ ...p, registration_url: e.target.value }))} placeholder="https://www.uem.ac.mz/"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
            <textarea value={f.description ?? ""} onChange={(e) => upd((p) => ({ ...p, description: e.target.value }))} rows={3}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div>
            <RichTextEditor
              value={f.content_rich ?? ""}
              onChange={(html) => upd((p) => ({ ...p, content_rich: html }))}
              label="Conteúdo rico"
              hint="Adicione parágrafos, imagens, links e vídeos para descrever o exame."
              placeholder="Comece a escrever o conteúdo detalhado do exame..."
              bucket="images"
              folder="exames"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {(["active", "featured", "comments_enabled", "allow_registrations"] as const).map((field) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={f[field]} onChange={(e) => upd((p) => ({ ...p, [field]: e.target.checked }))} className="rounded" />
                {{ active: "Activo", featured: "Destaque", comments_enabled: "Comentários", allow_registrations: "Inscrições" }[field]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Matérias" value={f.subjects} onChange={(v) => upd((p) => ({ ...p, subjects: v }))} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <ArrayEditor label="Dicas" value={f.tips} onChange={(v) => upd((p) => ({ ...p, tips: v }))} />
          </div>
        </div>
      </div>
    );
  }

  /* List */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" /> Exames de Admissão
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} exames · visíveis em /hub/exames</p>
        </div>
        <button onClick={() => setEditing(emptyRow())}
          className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
        >
          <Plus className="h-4 w-4" /> Novo exame
        </button>
      </div>

      <div className="space-y-3">
        {items.map((e) => (
          <div key={e.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card hover:shadow-elegant transition-smooth">
            <div className="text-2xl flex-shrink-0">🎯</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground truncate">{e.title}</p>
                {e.featured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-gold/10 text-gold px-2 py-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" /> Destaque
                  </span>
                )}
                {!e.active && <span className="text-[10px] font-bold rounded-full bg-muted text-muted-foreground px-2 py-0.5">Inactivo</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{e.institution} · {e.course} · {e.year} · {e.difficulty}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => toggleField(e.id, "featured", !e.featured)}
                className={`p-1.5 rounded-md transition-colors ${e.featured ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
              >
                <Star className={`h-4 w-4 ${e.featured ? "fill-current" : ""}`} />
              </button>
              <button onClick={() => toggleField(e.id, "active", !e.active)}
                className={`p-1.5 rounded-md transition-colors ${e.active ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
              >
                {e.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
              <button onClick={() => setEditing(e)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {deleting === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
