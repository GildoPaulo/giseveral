import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Trash2, Edit3, ArrowUp, ArrowDown, ImagePlus, UploadCloud,
  Check, Eye, EyeOff, Loader2, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useHeroAdmin, type HeroImage, type HeroImageInput, type HeroPage } from "@/hooks/useHeroImages";

export const Route = createFileRoute("/balcao/hero")({
  head: () => ({ meta: [{ title: "Imagens Hero — Balcão Giseveral" }] }),
  component: BalcaoHero,
});

const PAGE_LABELS: Record<HeroPage, string> = {
  home: "Página inicial",
  loja: "Loja",
  servicos: "Serviços",
};

const EMPTY_FORM: HeroImageInput = {
  title: null,
  subtitle: null,
  cta_label: null,
  cta_url: null,
  image_url: "",
  page: "home",
  active: true,
};

function BalcaoHero() {
  const { images, isLoading, refresh, upload, create, update, remove, move, toggleActive } = useHeroAdmin();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<HeroImage | null>(null);
  const [form, setForm] = useState<HeroImageInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<HeroImage | null>(null);
  const [filterPage, setFilterPage] = useState<"all" | HeroPage>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (filterPage === "all") return images;
    return images.filter((i) => i.page === filterPage);
  }, [images, filterPage]);

  const groupedByPage = useMemo(() => {
    const groups: Record<string, HeroImage[]> = {};
    for (const img of filtered) {
      const key = img.page;
      if (!groups[key]) groups[key] = [];
      groups[key].push(img);
    }
    return groups;
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(img: HeroImage) {
    setEditing(img);
    setForm({
      title: img.title,
      subtitle: img.subtitle,
      cta_label: img.cta_label,
      cta_url: img.cta_url,
      image_url: img.image_url,
      page: img.page,
      active: img.active,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploading(false);
    setUploadProgress(0);
  }

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem demasiado grande. Máximo 5 MB.");
      return;
    }
    setUploading(true);
    setUploadProgress(10);
    const fakeInterval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 7 : p));
    }, 200);
    try {
      const publicUrl = await upload(file);
      setForm((f) => ({ ...f, image_url: publicUrl }));
      setUploadProgress(100);
      toast.success("Imagem carregada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      toast.error(msg);
    } finally {
      clearInterval(fakeInterval);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 400);
    }
  }

  async function handleSave() {
    if (!form.image_url) {
      toast.error("Adiciona uma imagem antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, form);
        toast.success("Imagem actualizada");
      } else {
        await create(form);
        toast.success("Imagem adicionada");
      }
      closeDrawer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(img: HeroImage) {
    setConfirmDelete(null);
    const t = toast.loading("A remover…");
    try {
      await remove(img.id);
      toast.success("Imagem removida com sucesso", { id: t });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao remover";
      toast.error(msg, { id: t });
    }
  }

  async function handleMove(img: HeroImage, direction: "up" | "down") {
    try {
      await move(img.id, direction);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao reordenar";
      toast.error(msg);
    }
  }

  async function handleToggle(img: HeroImage) {
    try {
      await toggleActive(img.id);
      toast.success(img.active ? "Imagem ocultada" : "Imagem activada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar estado";
      toast.error(msg);
    }
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Gestão de Imagens Hero</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Imagens dos banners e collages da homepage, loja e serviços.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
        >
          <Plus className="h-4 w-4" /> Adicionar imagem
        </button>
      </div>

      {/* Page filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "home", "loja", "servicos"] as const).map((p) => {
          const active = filterPage === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPage(p)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-smooth ${
                active
                  ? "bg-brand text-brand-foreground shadow-card"
                  : "bg-card border border-border text-foreground hover:border-brand/40"
              }`}
            >
              {p === "all" ? "Todas" : PAGE_LABELS[p]}
              <span className={`ml-2 text-[10px] ${active ? "text-brand-foreground/80" : "text-muted-foreground"}`}>
                {p === "all" ? images.length : images.filter((i) => i.page === p).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-3 animate-pulse">
              <div className="aspect-video rounded-xl bg-muted mb-3" />
              <div className="h-3 w-2/3 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="space-y-8">
          {(Object.keys(groupedByPage) as HeroPage[]).map((page) => {
            const items = groupedByPage[page];
            return (
              <div key={page}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand">
                    {PAGE_LABELS[page]}
                  </h2>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((img, idx) => (
                    <HeroCard
                      key={img.id}
                      img={img}
                      onEdit={() => openEdit(img)}
                      onDelete={() => setConfirmDelete(img)}
                      onUp={idx > 0 ? () => handleMove(img, "up") : undefined}
                      onDown={idx < items.length - 1 ? () => handleMove(img, "down") : undefined}
                      onToggle={() => handleToggle(img)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer (add/edit) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={closeDrawer}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-md bg-background shadow-2xl overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-5 py-4">
                <h2 className="text-base font-bold text-foreground">
                  {editing ? "Editar imagem" : "Nova imagem hero"}
                </h2>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Upload area */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Imagem
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-brand/40 transition-smooth p-5 text-center cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">Arrasta ou clica</p>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP até 5 MB</p>
                  </div>

                  {uploading && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand to-gold transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> A carregar — {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {form.image_url && !uploading && (
                    <div className="mt-3 relative rounded-2xl border border-border overflow-hidden">
                      <img src={form.image_url} alt="Pré-visualização" className="w-full aspect-video object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                        className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-smooth"
                        aria-label="Remover imagem"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Text inputs */}
                <Field label="Título" placeholder="ex: Equipa Giseveral"
                  value={form.title ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, title: v || null }))}
                />
                <Field label="Subtítulo" placeholder="ex: Atendimento personalizado"
                  value={form.subtitle ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, subtitle: v || null }))}
                />
                <Field label="Texto do botão CTA" placeholder="ex: Ver serviços"
                  value={form.cta_label ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, cta_label: v || null }))}
                />
                <Field label="URL do botão CTA" placeholder="/servicos ou https://…"
                  value={form.cta_url ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, cta_url: v || null }))}
                />

                {/* Page select */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Página
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["home", "loja", "servicos"] as HeroPage[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, page: p }))}
                        className={`rounded-xl py-2 text-xs font-semibold border transition-smooth ${
                          form.page === p
                            ? "bg-brand text-brand-foreground border-brand shadow-card"
                            : "bg-card border-border text-foreground hover:border-brand/40"
                        }`}
                      >
                        {PAGE_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Activa</p>
                    <p className="text-xs text-muted-foreground">Imagens inactivas não aparecem no site.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                    role="switch"
                    aria-checked={form.active}
                    className={`relative h-6 w-11 rounded-full transition-smooth ${form.active ? "bg-brand" : "bg-muted-foreground/40"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.active ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
              </div>

              <div className="sticky bottom-0 z-10 flex gap-3 border-t border-border bg-background/95 backdrop-blur p-4">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploading || !form.image_url}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-brand-foreground shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Guardar alterações" : "Adicionar"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="fixed left-1/2 top-1/2 z-[71] w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl border border-border"
              role="dialog"
              aria-modal="true"
            >
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-center text-base font-bold text-foreground">Remover imagem?</h3>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Esta acção é permanente. O ficheiro e o registo serão apagados.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90 transition-smooth"
                >
                  Remover
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function HeroCard({
  img, onEdit, onDelete, onUp, onDown, onToggle,
}: {
  img: HeroImage;
  onEdit: () => void;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-2xl border ${img.active ? "border-border" : "border-dashed border-muted-foreground/30 opacity-70"} bg-card shadow-card overflow-hidden flex flex-col`}>
      <div className="relative aspect-video bg-muted">
        {img.image_url ? (
          <img src={img.image_url} alt={img.title ?? "Hero"} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${img.active ? "bg-emerald-500 text-white" : "bg-muted-foreground/80 text-white"}`}>
            {img.active ? "Activa" : "Inactiva"}
          </span>
          <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            #{img.position}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-1">
          {img.title || <span className="italic text-muted-foreground">Sem título</span>}
        </p>
        {img.subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{img.subtitle}</p>
        )}
        {img.cta_label && (
          <p className="mt-1.5 text-[11px] text-brand font-semibold">
            ▸ {img.cta_label}
            {img.cta_url && <span className="text-muted-foreground"> → {img.cta_url}</span>}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onUp}
            disabled={!onUp}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            title="Subir"
          >
            <ArrowUp className="h-3 w-3" /> Subir
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={!onDown}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            title="Descer"
          >
            <ArrowDown className="h-3 w-3" /> Descer
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:bg-muted transition-smooth"
            title={img.active ? "Ocultar" : "Activar"}
          >
            {img.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {img.active ? "Ocultar" : "Activar"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand px-2 py-1.5 text-[11px] font-bold text-brand-foreground hover:opacity-90 transition-smooth"
            title="Editar"
          >
            <Edit3 className="h-3 w-3" /> Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-2 py-1.5 text-[11px] font-semibold hover:bg-destructive/10 transition-smooth"
            title="Remover"
          >
            <Trash2 className="h-3 w-3" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
      />
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-brand/10 text-brand">
        <ImagePlus className="h-10 w-10" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Adiciona a primeira imagem hero</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Carrega imagens que vão alimentar o collage da homepage e os slides da loja —
        podes definir a ordem e activar/desactivar a qualquer momento.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
      >
        <Plus className="h-4 w-4" /> Adicionar imagem
      </button>
    </div>
  );
}
