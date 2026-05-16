import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Newspaper, Plus, Pencil, Trash2, Star, Eye,
  Loader2, Save, X, Check, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerAutoNotify } from "@/services/autoNotify";
import { HUB_NEWS } from "@/data/hub-bolsas";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { readJsonOrThrow } from "@/lib/ai-json";

export const Route = createFileRoute("/balcao/noticias")({
  component: BalcaoNoticias,
});

type NewsRow = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  author: string;
  date: string;
  image_url: string | null;
  content_rich: string | null;
  content: string[] | null;
  related_scholarship_id: string | null;
  tags: string[];
  published: boolean;
  comments_enabled: boolean;
  views: number;
  created_at: string;
};

function emptyRow(): NewsRow {
  return {
    id: crypto.randomUUID(),
    title: "", excerpt: "", category: "Bolsas",
    author: "Equipa Giseveral", date: new Date().toISOString().split("T")[0],
    image_url: null, content_rich: null, content: [],
    related_scholarship_id: null, tags: [], published: true,
    comments_enabled: true, views: 0, created_at: new Date().toISOString(),
  };
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
        <button onClick={add} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">+</button>
      </div>
    </div>
  );
}

const CATEGORIES = ["Bolsas", "Universidades", "Prazos", "Oportunidades", "Exames", "Educação", "Geral"];

function BalcaoNoticias() {
  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateWithAi() {
    if (!editing) return;
    const topic = window.prompt("Tema da notícia para a IA escrever:");
    if (!topic?.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/news/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category: editing.category }),
      });
      const data = await readJsonOrThrow<{
        error?: string;
        title?: string;
        excerpt?: string;
        content?: string;
        tags?: string[];
        hashtags?: string[];
      }>(res);
      if (!res.ok) throw new Error(data.error || "Erro ao gerar");

      upd((p) => ({
        ...p,
        title: data.title || p.title,
        excerpt: data.excerpt ?? p.excerpt,
        content_rich: data.content || p.content_rich,
        tags: [
          ...(Array.isArray(data.tags) ? data.tags : []),
          ...(Array.isArray(data.hashtags) ? data.hashtags.map((h) => h.replace(/^#/, "")) : []),
        ].filter(Boolean).slice(0, 8),
      }));
      toast.success("Notícia gerada — revê antes de guardar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar com IA");
    } finally {
      setGenerating(false);
    }
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hub_news")
      .select("*")
      .order("date", { ascending: false });

    if (error || !data || data.length === 0) {
      setItems(HUB_NEWS.map((n) => ({
        id: n.id, title: n.title, excerpt: n.excerpt ?? null,
        category: n.category, author: n.author ?? "Equipa Giseveral",
        date: n.date, image_url: null, content_rich: null,
        content: n.content ?? [], related_scholarship_id: n.relatedScholarship ?? null,
        tags: n.tags ?? [], published: true, comments_enabled: true,
        views: 0, created_at: new Date().toISOString(),
      })));
    } else {
      setItems(data as NewsRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleField(id: string, field: "published" | "comments_enabled", val: boolean) {
    const payload: { published?: boolean; comments_enabled?: boolean } =
      field === "published" ? { published: val } : { comments_enabled: val };
    const { error } = await supabase.from("hub_news").update(payload).eq("id", id);
    if (error) { toast.error("Erro ao actualizar"); return; }
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, [field]: val } : n));
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta notícia? Esta acção não pode ser desfeita.")) return;
    setDeleting(id);
    const { error } = await supabase.from("hub_news").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); setDeleting(null); return; }
    setItems((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notícia eliminada.");
    setDeleting(null);
  }

  async function handleSave(form: NewsRow) {
    if (!form.title.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    setSaving(true);
    const isNew = !items.find((n) => n.id === form.id);
    const payload = {
      title: form.title, excerpt: form.excerpt || null,
      category: form.category, author: form.author || "Equipa Giseveral",
      date: form.date, image_url: form.image_url || null,
      content_rich: form.content_rich || null,
      content: form.content ?? [],
      related_scholarship_id: form.related_scholarship_id || null,
      tags: form.tags, published: form.published, comments_enabled: form.comments_enabled,
    };

    const { error } = await (supabase as any).from("hub_news").upsert(
      { id: form.id, ...payload },
      { onConflict: "id" },
    );

    if (error) {
      toast.error("Erro ao guardar: " + error.message);
    } else {
      if (isNew) setItems((prev) => [form, ...prev]);
      else setItems((prev) => prev.map((n) => n.id === form.id ? form : n));
      toast.success("Notícia guardada!");
      setEditing(null);
      if (isNew && form.published) {
        triggerAutoNotify({
          event_type: "nova_noticia",
          title: `Nova notícia: ${form.title}`,
          body: form.excerpt || form.title,
          url: `/hub/noticias`,
          channels: ["push", "email"],
          target: "all",
        });
      }
    }
    setSaving(false);
  }

  function upd(fn: (p: NewsRow) => NewsRow) {
    setEditing((prev) => prev ? fn(prev) : prev);
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
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-brand transition-colors">
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-brand flex-1">
            {items.find((n) => n.id === f.id) ? "Editar notícia" : "Nova notícia"}
          </h2>
          <button
            onClick={generateWithAi}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
            title="Gerar título, resumo, conteúdo e tags com IA a partir do tema"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "A gerar…" : "Gerar com IA"}
          </button>
          <button
            onClick={() => handleSave(f)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título *</label>
            <input value={f.title} onChange={(e) => upd((p) => ({ ...p, title: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</label>
              <select value={f.category} onChange={(e) => upd((p) => ({ ...p, category: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Autor</label>
              <input value={f.author} onChange={(e) => upd((p) => ({ ...p, author: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</label>
              <input type="date" value={f.date} onChange={(e) => upd((p) => ({ ...p, date: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo (excerpt)</label>
            <textarea value={f.excerpt ?? ""} onChange={(e) => upd((p) => ({ ...p, excerpt: e.target.value }))} rows={2}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>

          <div>
            <RichTextEditor
              value={f.content_rich ?? ""}
              onChange={(html) => upd((p) => ({ ...p, content_rich: html }))}
              label="Conteúdo completo"
              hint="Formate o artigo, adicione imagens, links, tabelas e vídeos."
              placeholder="Comece a escrever o conteúdo do artigo..."
              bucket="images"
              folder="noticias"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <ImageUpload
                value={f.image_url}
                onChange={(url) => upd((p) => ({ ...p, image_url: url }))}
                label="Imagem de capa"
                hint="Arraste um ficheiro ou cole uma URL externa."
                bucket="images"
                folder="noticias"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bolsa relacionada (ID)</label>
              <input value={f.related_scholarship_id ?? ""} onChange={(e) => upd((p) => ({ ...p, related_scholarship_id: e.target.value || null }))}
                placeholder="ex: chevening-2026"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.published} onChange={(e) => upd((p) => ({ ...p, published: e.target.checked }))} className="rounded" />
              Publicada
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.comments_enabled} onChange={(e) => upd((p) => ({ ...p, comments_enabled: e.target.checked }))} className="rounded" />
              Comentários activos
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <ArrayEditor label="Tags" value={f.tags} onChange={(v) => upd((p) => ({ ...p, tags: v }))} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <ArrayEditor label="Parágrafos de conteúdo (legacy)" value={f.content ?? []} onChange={(v) => upd((p) => ({ ...p, content: v }))} />
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
            <Newspaper className="h-6 w-6 text-gold" /> Notícias Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} notícias · visíveis em /hub/bolsas e /hub/noticias
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyRow())}
          className="flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
        >
          <Plus className="h-4 w-4" /> Nova notícia
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium">Sem notícias ainda</p>
          <button onClick={() => setEditing(emptyRow())} className="mt-3 text-sm text-brand hover:underline">
            + Adicionar notícia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card hover:shadow-elegant transition-smooth">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{n.title}</p>
                  <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-semibold">{n.category}</span>
                  {!n.published && (
                    <span className="text-[10px] font-bold rounded-full bg-muted text-muted-foreground px-2 py-0.5">Rascunho</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{n.author}</span>
                  <span>·</span>
                  <span>{new Date(n.date).toLocaleDateString("pt-PT")}</span>
                  {n.views > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {n.views}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Toggle published */}
                <button
                  onClick={() => toggleField(n.id, "published", !n.published)}
                  title={n.published ? "Despublicar" : "Publicar"}
                  className={`p-1.5 rounded-md transition-colors ${n.published ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                >
                  {n.published ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>

                {/* Toggle featured (comments) */}
                <button
                  onClick={() => toggleField(n.id, "comments_enabled", !n.comments_enabled)}
                  title={n.comments_enabled ? "Desactivar comentários" : "Activar comentários"}
                  className={`p-1.5 rounded-md transition-colors ${n.comments_enabled ? "text-brand" : "text-muted-foreground hover:text-brand"}`}
                >
                  <Star className={`h-4 w-4 ${n.comments_enabled ? "fill-current" : ""}`} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditing(n)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={deleting === n.id}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {deleting === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
