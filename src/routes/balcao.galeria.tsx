import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Edit3, Check, X, Image, ExternalLink, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/balcao/galeria")({
  component: BalcaoGaleria,
});

type GalleryItem = {
  id: string;
  url: string;
  title: string;
  description: string;
  client: string;
  category: string;
  rating: number;
  before_url: string | null;
  project_url: string | null;
  created_at: string;
};

const CATEGORIES = ["Impressão", "Informática", "Redes", "Design", "Papelaria", "Outro"];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
          <Star className={`h-4 w-4 transition-colors ${s <= (hover || value) ? "fill-gold text-gold" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}

type ItemForm = { title: string; description: string; client: string; category: string; rating: number; before_url: string; project_url: string };
const emptyForm = (): ItemForm => ({ title: "", description: "", client: "", category: "Impressão", rating: 5, before_url: "", project_url: "" });

function BalcaoGaleria() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemForm>(emptyForm());
  const [addForm, setAddForm] = useState<ItemForm>(emptyForm());
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar galeria");
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  async function handleUpload() {
    if (!selectedFile) { toast.error("Seleciona uma imagem primeiro"); return; }
    if (selectedFile.size > 5 * 1024 * 1024) { toast.error("Imagem demasiado grande (máx 5 MB)"); return; }
    if (!addForm.title.trim()) { toast.error("Título obrigatório"); return; }

    setUploading(true);
    const ext = selectedFile.name.split(".").pop() ?? "jpg";
    const path = `gallery/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("images").upload(path, selectedFile, { upsert: false });
    if (uploadErr) { toast.error("Erro ao carregar: " + uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

    const { data: inserted, error: dbErr } = await (supabase as any)
      .from("gallery_items")
      .insert({
        url: urlData.publicUrl,
        title: addForm.title.trim(),
        description: addForm.description.trim(),
        client: addForm.client.trim(),
        category: addForm.category,
        rating: addForm.rating,
        before_url: addForm.before_url.trim() || null,
        project_url: addForm.project_url.trim() || null,
      })
      .select()
      .single();

    if (dbErr) {
      toast.error("Imagem carregada mas erro ao guardar: " + dbErr.message);
    } else {
      setItems((prev) => [inserted, ...prev]);
      setAddForm(emptyForm());
      setSelectedFile(null);
      setPreviewFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Imagem adicionada à galeria!");
    }
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewFile(URL.createObjectURL(file));
  }

  async function deleteItem(id: string) {
    if (!confirm("Remover esta imagem da galeria?")) return;
    const { error } = await (supabase as any).from("gallery_items").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Imagem removida");
  }

  function startEdit(item: GalleryItem) {
    setEditId(item.id);
    setEditForm({ title: item.title, description: item.description, client: item.client, category: item.category, rating: item.rating, before_url: item.before_url ?? "", project_url: item.project_url ?? "" });
  }

  async function saveEdit() {
    if (!editId) return;
    const { error } = await (supabase as any)
      .from("gallery_items")
      .update({ title: editForm.title, description: editForm.description, client: editForm.client, category: editForm.category, rating: editForm.rating, before_url: editForm.before_url.trim() || null, project_url: editForm.project_url.trim() || null })
      .eq("id", editId);
    if (error) { toast.error("Erro ao actualizar"); return; }
    setItems((prev) => prev.map((i) => i.id === editId ? { ...i, ...editForm } : i));
    setEditId(null);
    toast.success("Imagem actualizada!");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Gestão de Galeria</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} {items.length === 1 ? "trabalho" : "trabalhos"} publicados</p>
        </div>
        <Link to="/galeria" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-smooth">
          <ExternalLink className="h-4 w-4" /> Ver galeria
        </Link>
      </div>

      {/* Upload form */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-6">
        <h2 className="font-bold text-brand mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-gold" /> Adicionar trabalho</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Imagem *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand/50 transition-colors overflow-hidden aspect-video flex items-center justify-center bg-muted/20"
            >
              {previewFile ? (
                <img src={previewFile} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clica para seleccionar</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP · Máx 5 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Título *</label>
              <input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                placeholder="Ex: Impressão de brochuras para empresa"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Breve descrição do trabalho..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
                <input value={addForm.client} onChange={(e) => setAddForm({ ...addForm, client: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Categoria</label>
                <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL imagem "Antes" <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input value={addForm.before_url} onChange={(e) => setAddForm({ ...addForm, before_url: e.target.value })}
                placeholder="https://... (para comparação Antes/Depois)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL do projecto <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input value={addForm.project_url} onChange={(e) => setAddForm({ ...addForm, project_url: e.target.value })}
                placeholder="https://... (link externo para o projecto)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Avaliação do cliente</label>
              <StarPicker value={addForm.rating} onChange={(v) => setAddForm({ ...addForm, rating: v })} />
            </div>
            <button onClick={handleUpload} disabled={uploading || !selectedFile}
              className="w-full rounded-lg bg-gradient-brand py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50 transition-smooth hover:shadow-elegant">
              {uploading ? "A carregar..." : "Adicionar à galeria"}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <Image className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Galeria vazia</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Adiciona o primeiro trabalho acima.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={item.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' fill='%23f0f0f0'%3E%3Crect width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='14'%3ESem imagem%3C/text%3E%3C/svg%3E"; }}
                />
              </div>

              {editId === item.id ? (
                <div className="p-4 space-y-3">
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Descrição"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input value={editForm.client} onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                    placeholder="Cliente"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input value={editForm.before_url} onChange={(e) => setEditForm({ ...editForm, before_url: e.target.value })}
                    placeholder="URL imagem Antes (opcional)"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input value={editForm.project_url} onChange={(e) => setEditForm({ ...editForm, project_url: e.target.value })}
                    placeholder="URL do projecto (opcional)"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <StarPicker value={editForm.rating} onChange={(v) => setEditForm({ ...editForm, rating: v })} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 rounded-md bg-gradient-brand py-2 text-xs font-semibold text-brand-foreground flex items-center justify-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Guardar
                    </button>
                    <button onClick={() => setEditId(null)} className="rounded-md border border-border px-3 py-2">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-brand text-sm leading-snug">{item.title}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{item.category}</span>
                      {item.before_url && <span className="text-[9px] rounded-full bg-brand/10 text-brand px-2 py-0.5 font-medium">Antes/Depois</span>}
                    </div>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mb-1">{item.description}</p>}
                  {item.client && <p className="text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{item.client}</span></p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= item.rating ? "fill-gold text-gold" : "text-border"}`} />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(item)} className="rounded-md border border-border p-1.5 hover:bg-muted transition-smooth">
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="rounded-md border border-border p-1.5 hover:bg-destructive/10 hover:border-destructive/40 transition-smooth">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
