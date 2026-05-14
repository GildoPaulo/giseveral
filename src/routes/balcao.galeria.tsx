import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Trash2,
  Check,
  X,
  Image,
  ExternalLink,
  Loader2,
  Plus,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { GALLERY_CATEGORIES } from "@/data/gallery-categories";

export const Route = createFileRoute("/balcao/galeria")({
  component: BalcaoGaleria,
});

type GalleryImageRow = {
  id: string;
  project_id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  step_order: number | null;
  step_label: string | null;
  is_cover: boolean | null;
};

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  client_testimonial: string | null;
  category: string;
  description: string;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  technologies: string[] | null;
  project_url: string | null;
  project_date: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  gallery_images: GalleryImageRow[] | null;
};

const CAT_IDS = GALLERY_CATEGORIES.filter((c) => c.id !== "todos").map((c) => c.id);

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

async function uniqueSlug(base: string) {
  let s = slugify(base) || "projecto";
  for (let i = 0; i < 20; i += 1) {
    const trySlug = i === 0 ? s : `${s}-${i}`;
    const { data } = await supabase.from("gallery_projects").select("id").eq("slug", trySlug).maybeSingle();
    if (!data) return trySlug;
  }
  return `${s}-${crypto.randomUUID().slice(0, 8)}`;
}

function BalcaoGaleria() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    client_name: "",
    client_testimonial: "",
    category: "design",
    description: "",
    challenge: "",
    solution: "",
    results: "",
    technologies: "",
    project_url: "",
    project_date: "",
    is_featured: false,
    is_active: true,
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_projects")
      .select("*, gallery_images(*)")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar projectos: " + error.message);
      setProjects([]);
    } else {
      setProjects((data as ProjectRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const editing = editId ? projects.find((p) => p.id === editId) : null;

  useEffect(() => {
    if (!editing) {
      setForm({
        title: "",
        slug: "",
        client_name: "",
        client_testimonial: "",
        category: "design",
        description: "",
        challenge: "",
        solution: "",
        results: "",
        technologies: "",
        project_url: "",
        project_date: "",
        is_featured: false,
        is_active: true,
      });
      return;
    }
    setForm({
      title: editing.title,
      slug: editing.slug,
      client_name: editing.client_name ?? "",
      client_testimonial: editing.client_testimonial ?? "",
      category: editing.category,
      description: editing.description ?? "",
      challenge: editing.challenge ?? "",
      solution: editing.solution ?? "",
      results: editing.results ?? "",
      technologies: (editing.technologies ?? []).join(", "),
      project_url: editing.project_url ?? "",
      project_date: editing.project_date ?? "",
      is_featured: !!editing.is_featured,
      is_active: editing.is_active !== false,
    });
  }, [editing]);

  async function createBlankProject() {
    setSaving(true);
    const slug = await uniqueSlug("novo-projecto");
    const { data, error } = await supabase
      .from("gallery_projects")
      .insert({
        title: "Novo projecto",
        slug,
        category: "design",
        description: "Descreve o trabalho realizado.",
        is_active: true,
        is_featured: false,
      })
      .select("*, gallery_images(*)")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "Erro ao criar projecto");
      return;
    }
    setProjects((prev) => [data as ProjectRow, ...prev]);
    setEditId(data.id);
    toast.success("Projecto criado. Preenche os campos e adiciona imagens.");
  }

  async function saveProject() {
    if (!editId) return;
    setSaving(true);
    const tech = form.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const { error } = await supabase
      .from("gallery_projects")
      .update({
        title: form.title.trim(),
        slug: form.slug.trim(),
        client_name: form.client_name.trim() || null,
        client_testimonial: form.client_testimonial.trim() || null,
        category: form.category,
        description: form.description.trim(),
        challenge: form.challenge.trim() || null,
        solution: form.solution.trim() || null,
        results: form.results.trim() || null,
        technologies: tech,
        project_url: form.project_url.trim() || null,
        project_date: form.project_date.trim() || null,
        is_featured: form.is_featured,
        is_active: form.is_active,
      })
      .eq("id", editId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Projecto guardado");
    loadProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("Eliminar este projecto e todas as imagens?")) return;
    const { error } = await supabase.from("gallery_projects").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (editId === id) setEditId(null);
    toast.success("Projecto eliminado");
  }

  async function uploadImage(file: File) {
    if (!editId) {
      toast.error("Selecciona ou cria um projecto primeiro");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5 MB por imagem");
      return;
    }
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `gallery/${editId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("images").upload(path, file, { upsert: false });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
    const imgs = editing?.gallery_images ?? [];
    const maxOrder = imgs.reduce((m, i) => Math.max(m, i.step_order ?? 0), 0);
    const isFirst = imgs.length === 0;
    const { data: row, error: insErr } = await supabase
      .from("gallery_images")
      .insert({
        project_id: editId,
        image_url: pub.publicUrl,
        step_order: maxOrder + 1,
        step_label: isFirst ? "Capa" : `Passo ${maxOrder + 1}`,
        is_cover: isFirst,
        title: form.title.slice(0, 80),
      })
      .select()
      .single();
    if (insErr || !row) {
      toast.error(insErr?.message ?? "Erro ao guardar imagem");
      return;
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editId ? { ...p, gallery_images: [...(p.gallery_images ?? []), row as GalleryImageRow] } : p,
      ),
    );
    toast.success("Imagem adicionada");
  }

  async function deleteImage(imageId: string) {
    const { error } = await supabase.from("gallery_images").delete().eq("id", imageId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editId ? { ...p, gallery_images: (p.gallery_images ?? []).filter((i) => i.id !== imageId) } : p,
      ),
    );
  }

  async function setCover(imageId: string) {
    if (!editId) return;
    await supabase.from("gallery_images").update({ is_cover: false }).eq("project_id", editId);
    const { error } = await supabase.from("gallery_images").update({ is_cover: true }).eq("id", imageId);
    if (error) toast.error(error.message);
    else {
      toast.success("Capa actualizada");
      loadProjects();
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Gestão de galeria (portfólio)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Projectos com várias imagens, textos e página pública em /galeria/[slug].
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={createBlankProject}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Novo projecto
          </button>
          <Link
            to="/galeria"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" /> Ver site
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Sem projectos. Clica em «Novo projecto» ou aplica a migração Supabase para importar trabalhos antigos.
            </div>
          ) : (
            projects.map((p) => {
              const cover = (p.gallery_images ?? []).find((i) => i.is_cover) ?? (p.gallery_images ?? [])[0];
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setEditId(p.id)}
                  className={`w-full flex gap-3 rounded-xl border p-3 text-left transition-colors ${
                    editId === p.id ? "border-brand bg-brand/5" : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover ? (
                      <img src={cover.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">{p.category}</span>
                      {p.is_featured && (
                        <span className="text-[10px] rounded bg-gold/20 text-gold px-1.5 py-0.5 font-medium">Destaque</span>
                      )}
                      {p.is_active === false && (
                        <span className="text-[10px] rounded bg-destructive/10 text-destructive px-1.5">Inactivo</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
          {!editId ? (
            <p className="text-sm text-muted-foreground">Selecciona um projecto à esquerda ou cria um novo.</p>
          ) : (
            <>
              <div className="flex justify-between gap-2">
                <h2 className="font-bold text-lg text-brand">Editar projecto</h2>
                <button type="button" onClick={() => setEditId(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Título *</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Slug (URL) *</span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Categoria *</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CAT_IDS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">Data do projecto</span>
                  <input
                    type="date"
                    value={form.project_date}
                    onChange={(e) => setForm((f) => ({ ...f, project_date: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Cliente</span>
                  <input
                    value={form.client_name}
                    onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Descrição *</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Desafio</span>
                  <textarea
                    value={form.challenge}
                    onChange={(e) => setForm((f) => ({ ...f, challenge: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Solução</span>
                  <textarea
                    value={form.solution}
                    onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Resultados</span>
                  <textarea
                    value={form.results}
                    onChange={(e) => setForm((f) => ({ ...f, results: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Tecnologias (separadas por vírgula)</span>
                  <input
                    value={form.technologies}
                    onChange={(e) => setForm((f) => ({ ...f, technologies: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">URL do projecto</span>
                  <input
                    value={form.project_url}
                    onChange={(e) => setForm((f) => ({ ...f, project_url: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-muted-foreground">Depoimento do cliente</span>
                  <textarea
                    value={form.client_testimonial}
                    onChange={(e) => setForm((f) => ({ ...f, client_testimonial: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  />
                  <span className="text-sm">Em destaque na galeria</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  <span className="text-sm">Visível no site</span>
                </label>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-brand text-sm">Imagens do projecto</h3>
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5" /> Adicionar
                  </button>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void uploadImage(f);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(editing?.gallery_images ?? [])
                    .slice()
                    .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))
                    .map((img) => (
                      <div key={img.id} className="relative rounded-lg border border-border overflow-hidden group">
                        <img src={img.image_url} alt="" className="h-28 w-full object-cover" />
                        {img.is_cover && (
                          <span className="absolute top-1 left-1 text-[9px] bg-gold text-gold-foreground px-1.5 py-0.5 rounded font-bold">
                            Capa
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Definir como capa"
                            onClick={() => void setCover(img.id)}
                            className="p-1.5 rounded bg-background/90"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => void deleteImage(img.id)}
                            className="p-1.5 rounded bg-background/90 text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void saveProject()}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => deleteProject(editId)}
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar projecto
                </button>
                <Link
                  to="/galeria/$slug"
                  params={{ slug: form.slug }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" /> Pré-visualizar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
