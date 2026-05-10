import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { triggerAutoNotify } from "@/services/autoNotify";
import { DOC_CATEGORIES, type DocCategory } from "@/data/hub-documents";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Crown,
  FileText, Download, CheckCircle2, AlertTriangle, Search, Filter,
  ThumbsUp, ThumbsDown, Clock, User,
} from "lucide-react";

export const Route = createFileRoute("/balcao/hub")({
  component: BalcaoHub,
});

type HubDoc = {
  id: string;
  title: string;
  author: string;
  category: string;
  pages: number;
  description: string;
  tags: string[];
  cover_hue: number;
  cover_image_url?: string | null;
  premium: boolean;
  published: boolean;
  downloads: number;
  views: number;
  file_url: string | null;
  user_id: string | null;
  created_at: string;
};

type FormData = {
  title: string;
  author: string;
  category: DocCategory | "";
  pages: string;
  description: string;
  tags: string;
  cover_hue: string;
  cover_image_url: string | null;
  premium: boolean;
  published: boolean;
};

const EMPTY: FormData = {
  title: "", author: "Giseveral Editorial", category: "", pages: "1",
  description: "", tags: "", cover_hue: "210", cover_image_url: null,
  premium: false, published: true,
};

type Tab = "todos" | "publicados" | "pendentes";

function BalcaoHub() {
  const [docs, setDocs] = useState<HubDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("todos");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<DocCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HubDoc | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hub_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocs((data ?? []) as HubDoc[]);
    } catch (e: unknown) {
      toast.error("Erro ao carregar documentos", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const pending = docs.filter((d) => !d.published && !!d.user_id);

  const visible = docs.filter((d) => {
    if (tab === "publicados" && !d.published) return false;
    if (tab === "pendentes" && !((!d.published) && !!d.user_id)) return false;
    const matchCat = catFilter === "all" || d.category === catFilter;
    const matchSearch = !search.trim() || d.title.toLowerCase().includes(search.toLowerCase()) || d.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFile(null);
    setShowForm(true);
  }

  function openEdit(d: HubDoc) {
    setEditing(d);
    setForm({
      title: d.title, author: d.author, category: d.category as DocCategory,
      pages: String(d.pages), description: d.description,
      tags: d.tags.join(", "), cover_hue: String(d.cover_hue),
      cover_image_url: d.cover_image_url ?? null,
      premium: d.premium, published: d.published,
    });
    setFile(null);
    setShowForm(true);
  }

  function setField<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // ── Save (create / update) ────────────────────────────────────────────────

  async function handleSave() {
    if (!form.title.trim() || !form.category) {
      toast.error("Título e categoria são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      let fileUrl = editing?.file_url ?? null;

      // Upload PDF if provided
      if (file) {
        const path = `admin/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("hub-documents").upload(path, file);
        if (upErr) throw upErr;
        fileUrl = supabase.storage.from("hub-documents").getPublicUrl(path).data.publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || "Giseveral Editorial",
        category: form.category,
        pages: Math.max(1, parseInt(form.pages) || 1),
        description: form.description.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        cover_hue: Math.min(360, Math.max(0, parseInt(form.cover_hue) || 210)),
        premium: form.premium,
        published: form.published,
        ...(fileUrl !== undefined && { file_url: fileUrl }),
      };
      // cover_image_url requires DB column: ALTER TABLE hub_documents ADD COLUMN cover_image_url TEXT;
      const payloadWithCover = { ...payload, cover_image_url: form.cover_image_url };

      if (editing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("hub_documents") as any)
          .update(payloadWithCover)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Documento actualizado!");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("hub_documents") as any)
          .insert({ ...payloadWithCover, user_id: user?.id ?? null });
        if (error) throw error;
        toast.success("Documento criado!");
      }

      setShowForm(false);
      load();
    } catch (e: unknown) {
      toast.error("Erro ao guardar", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle publish ────────────────────────────────────────────────────────

  async function togglePublish(d: HubDoc) {
    const { error } = await supabase
      .from("hub_documents")
      .update({ published: !d.published })
      .eq("id", d.id);
    if (error) { toast.error("Erro ao actualizar."); return; }
    setDocs((prev) => prev.map((x) => x.id === d.id ? { ...x, published: !x.published } : x));
    toast.success(d.published ? "Documento ocultado." : "Documento publicado.");
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este documento permanentemente?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("hub_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Documento eliminado.");
    } catch (e: unknown) {
      toast.error("Erro ao eliminar", { description: (e as Error).message });
    } finally {
      setDeletingId(null);
    }
  }

  // ── Approve user-submitted document ──────────────────────────────────────

  async function handleApprove(d: HubDoc) {
    setApprovingId(d.id);
    try {
      const { error: pubErr } = await supabase
        .from("hub_documents")
        .update({ published: true })
        .eq("id", d.id);
      if (pubErr) throw pubErr;

      // Grant +2 credits to the submitter
      if (d.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("hub_credits")
          .eq("id", d.user_id)
          .single();
        const current = (profile as { hub_credits?: number } | null)?.hub_credits ?? 0;
        await supabase
          .from("profiles")
          .update({ hub_credits: current + 2 })
          .eq("id", d.user_id);
      }

      setDocs((prev) => prev.map((x) => x.id === d.id ? { ...x, published: true } : x));
      toast.success("Documento aprovado! +2 créditos atribuídos ao autor.");
      if (d.user_id) {
        triggerAutoNotify({
          event_type: "doc_aprovado",
          title: "O teu documento foi aprovado! 🎉",
          body: `"${d.title}" está agora disponível no Hub. +2 créditos adicionados à tua conta.`,
          url: `/hub/documento/${d.id}`,
          channels: ["push", "email", "inapp"],
          target: "user",
          user_id: d.user_id,
          notif_type: "done",
        });
      }
    } catch (e: unknown) {
      toast.error("Erro ao aprovar", { description: (e as Error).message });
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(d: HubDoc) {
    if (!confirm(`Rejeitar e eliminar "${d.title}"?`)) return;
    setDeletingId(d.id);
    try {
      const { error } = await supabase.from("hub_documents").delete().eq("id", d.id);
      if (error) throw error;
      setDocs((prev) => prev.filter((x) => x.id !== d.id));
      toast.success("Documento rejeitado e eliminado.");
    } catch (e: unknown) {
      toast.error("Erro ao rejeitar", { description: (e as Error).message });
    } finally {
      setDeletingId(null);
    }
  }

  // ── Send notification helper ──────────────────────────────────────────────

  const stats = {
    total: docs.length,
    published: docs.filter((d) => d.published).length,
    pendingCount: pending.length,
    downloads: docs.reduce((s, d) => s + d.downloads, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hub — Gestão de Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie, edite e publique documentos académicos.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-4 py-2.5 text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Novo documento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: FileText, cls: "text-brand" },
          { label: "Publicados", value: stats.published, icon: CheckCircle2, cls: "text-emerald-600" },
          { label: "Pendentes", value: stats.pendingCount, icon: Clock, cls: stats.pendingCount > 0 ? "text-amber-500" : "text-muted-foreground" },
          { label: "Downloads", value: stats.downloads.toLocaleString(), icon: Download, cls: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.cls} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { id: "todos", label: "Todos", count: docs.length },
          { id: "publicados", label: "Publicados", count: stats.published },
          { id: "pendentes", label: "Pendentes", count: stats.pendingCount, alert: stats.pendingCount > 0 },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold min-w-[20px] ${
              tab === t.id ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
            } ${"alert" in t && t.alert ? "bg-amber-100 text-amber-700" : ""}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar título ou autor…"
            className="w-full pl-9 pr-4 h-9 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as DocCategory | "all")}
            className="h-9 rounded-md border border-border bg-background text-sm px-3 focus:outline-none"
          >
            <option value="all">Todas as categorias</option>
            {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <span className="text-xs text-muted-foreground">{visible.length} resultado{visible.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 flex items-center justify-center">
          <span className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {(tab === "pendentes"
                ? ["Título / Autor", "Categoria", "Submetido por", "Estado", "Acções"]
                : ["Título / Autor", "Categoria", "Páginas", "Downloads", "Estado", "Acções"]
              ).map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum documento encontrado.
                    </td>
                  </tr>
                ) : visible.map((d) => {
                  const cat = DOC_CATEGORIES.find((c) => c.id === d.category);
                  return (
                    <tr key={d.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${!d.published && d.user_id ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-md flex-shrink-0 grid place-items-center"
                            style={{ background: `linear-gradient(135deg, hsl(${d.cover_hue} 55% 48%), hsl(${d.cover_hue} 65% 30%))` }}
                          >
                            <FileText className="h-4 w-4 text-white/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[220px]">{d.title}</p>
                            <p className="text-xs text-muted-foreground">{d.author}</p>
                          </div>
                          {d.premium && <Crown className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{cat?.icon} {cat?.label}</td>
                      {tab === "pendentes" ? (
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {d.user_id ? d.user_id.slice(0, 8) + "…" : "Admin"}
                          </div>
                          <div className="text-[10px] mt-0.5">{new Date(d.created_at).toLocaleDateString("pt-PT")}</div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{d.pages}</td>
                          <td className="px-4 py-3 text-xs">{d.downloads.toLocaleString()}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium
                          ${d.published
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : d.user_id
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {d.published ? "Publicado" : d.user_id ? "Pendente" : "Rascunho"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Approve/Reject for pending user submissions */}
                          {!d.published && d.user_id && (
                            <>
                              <button
                                onClick={() => handleApprove(d)}
                                disabled={approvingId === d.id}
                                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                                title="Aprovar (+2 créditos)"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(d)}
                                disabled={deletingId === d.id}
                                className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                title="Rejeitar e eliminar"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <Link
                            to="/hub/documento/$id"
                            params={{ id: d.id }}
                            target="_blank"
                            className="rounded p-1.5 text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                            title="Ver no site"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => openEdit(d)}
                            className="rounded p-1.5 text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => togglePublish(d)}
                            className={`rounded p-1.5 transition-colors ${d.published ? "text-emerald-600 hover:bg-emerald-100" : "text-muted-foreground hover:bg-muted"}`}
                            title={d.published ? "Ocultar" : "Publicar"}
                          >
                            {d.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Form Modal ────────────────────────────────────────────────────── */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto bg-card rounded-2xl border border-border shadow-elegant w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-bold text-foreground">
                  {editing ? "Editar documento" : "Novo documento"}
                </h2>
                <button onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Ficheiro PDF {!editing && <span className="text-destructive">*</span>}
                  </label>
                  {file ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{file.name}</span>
                      <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-brand/50 p-6 flex flex-col items-center gap-2 transition-colors hover:bg-muted/30"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {editing?.file_url ? "Substituir PDF (opcional)" : "Clique para seleccionar PDF"}
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }}
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Título <span className="text-destructive">*</span></label>
                  <input
                    value={form.title} onChange={(e) => setField("title", e.target.value)}
                    placeholder="Título do documento"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>

                {/* Author + Category */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Autor</label>
                    <input
                      value={form.author} onChange={(e) => setField("author", e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Categoria <span className="text-destructive">*</span></label>
                    <select
                      value={form.category} onChange={(e) => setField("category", e.target.value as DocCategory)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="">Seleccionar…</option>
                      {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cover image */}
                <ImageUpload
                  value={form.cover_image_url}
                  onChange={(v) => setField("cover_image_url", v)}
                  label="Imagem de capa (opcional)"
                  hint="Se não tiver imagem, será usada a cor da capa abaixo."
                  bucket="images"
                  folder="hub-covers"
                />

                {/* Pages + Cover hue */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Número de páginas</label>
                    <input
                      type="number" min={1} value={form.pages}
                      onChange={(e) => setField("pages", e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      Cor da capa (fallback)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={360} value={form.cover_hue}
                        onChange={(e) => setField("cover_hue", e.target.value)}
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <div
                        className="h-9 w-9 rounded-md flex-shrink-0"
                        style={{ background: `hsl(${form.cover_hue} 60% 45%)` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Descrição</label>
                  <textarea
                    rows={3} value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 resize-y"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    value={form.tags} onChange={(e) => setField("tags", e.target.value)}
                    placeholder="Ex: matemática, UEM, 2024"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={form.premium}
                      onChange={(e) => setField("premium", e.target.checked)}
                      className="rounded"
                    />
                    <Crown className="h-4 w-4 text-gold" />
                    <span className="text-sm font-medium">Premium</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={form.published}
                      onChange={(e) => setField("published", e.target.checked)}
                      className="rounded"
                    />
                    <Eye className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Publicar imediatamente</span>
                  </label>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand text-brand-foreground px-5 py-2 text-sm font-semibold disabled:opacity-60 hover:bg-brand/90 transition-colors"
                >
                  {saving ? (
                    <><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> A guardar…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> {editing ? "Guardar alterações" : "Criar documento"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
