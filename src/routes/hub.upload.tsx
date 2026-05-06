import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { DOC_CATEGORIES, type DocCategory } from "@/data/hub-documents";
import { uploadHubDocument } from "@/lib/hub";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, FileText, X, CheckCircle2, AlertCircle, LogIn,
  ChevronLeft, Sparkles, Lock, Tag, BookOpen,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

export const Route = createFileRoute("/hub/upload")({
  head: () => ({
    meta: [
      { title: "Partilhar documento — Giseveral Hub" },
      { name: "description", content: "Contribua com a comunidade partilhando exames, sebentas e trabalhos académicos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HubUploadPage,
});

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type FormState = {
  title: string;
  author: string;
  category: DocCategory | "";
  description: string;
  tags: string;
  pages: number;
};

const EMPTY_FORM: FormState = { title: "", author: "", category: "", description: "", tags: "", pages: 0 };

function HubUploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pagesAuto, setPagesAuto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── File handling ──────────────────────────────────────────────────────────

  async function validateAndSetFile(f: File) {
    setFileError(null);
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Apenas ficheiros PDF são aceites.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileError(`Ficheiro demasiado grande. Máximo ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
    // Auto-fill title from filename
    const updates: Partial<FormState> = {};
    if (!form.title) {
      updates.title = f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ").trim();
    }
    // Auto-detect page count
    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      updates.pages = pdf.numPages;
      setPagesAuto(true);
    } catch {
      // silent — user can enter manually
    }
    if (Object.keys(updates).length > 0) setForm((p) => ({ ...p, ...updates }));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) void validateAndSetFile(f);
  }, [form.title]);

  // ── Form handling ──────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.category) e.category = "Seleccione uma categoria";
    if (!form.description.trim() || form.description.trim().length < 30)
      e.description = "Adicione uma descrição com pelo menos 30 caracteres";
    if (!file && !fileError) setFileError("Por favor carregue o ficheiro PDF.");
    setErrors(e);
    return Object.keys(e).length === 0 && !!file;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Precisa de entrar para partilhar documentos.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);

    const { url, error: uploadError } = await uploadHubDocument(file!, user.id);
    if (uploadError) {
      toast.error("Erro ao carregar ficheiro.", { description: uploadError });
      setSubmitting(false);
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error: insertError } = await supabase.from("hub_documents").insert({
      title: form.title.trim(),
      author: form.author.trim() || user.email?.split("@")[0] || "Anónimo",
      category: form.category as string,
      description: form.description.trim(),
      tags,
      file_url: url,
      pages: form.pages > 0 ? form.pages : 1,
      user_id: user.id,
      published: false,
      cover_hue: Math.floor(Math.random() * 360),
    });

    if (insertError) {
      toast.error("Erro ao submeter documento.", { description: insertError.message });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    toast.success("Documento submetido para revisão!", {
      description: "A equipa Giseveral irá verificar e publicar em breve. Ganhou 2 créditos!",
      duration: 6000,
    });
  }

  // ── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-brand mb-3">Acesso restrito</h1>
          <p className="text-muted-foreground mb-6">Precisa de ter uma conta para partilhar documentos com a comunidade.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card"
            >
              <LogIn className="h-4 w-4" /> Entrar / Criar conta
            </Link>
            <Link
              to="/hub"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar ao Hub
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 mx-auto mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-brand mb-3">Documento enviado!</h1>
          <p className="text-muted-foreground mb-2">
            Obrigado por contribuir com a comunidade. O documento será revisto e publicado em até 24 horas.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 text-gold-foreground px-4 py-2 text-sm font-semibold mb-8">
            <Sparkles className="h-4 w-4 text-gold" /> +2 créditos adicionados à sua conta
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); setFile(null); }}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card"
            >
              <Upload className="h-4 w-4" /> Enviar outro documento
            </button>
            <Link
              to="/hub/explorar"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              Explorar documentos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Upload form ────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <Link
          to="/hub"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-smooth mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Giseveral Hub
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">Partilhar documento</h1>
          <p className="text-muted-foreground">
            Contribua com exames, sebentas, trabalhos e PDFs académicos.{" "}
            <span className="text-brand font-medium">Ganhe 2 créditos</span> por cada documento aprovado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload zone */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Ficheiro PDF <span className="text-destructive">*</span>
            </label>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 transition-smooth
                  ${isDragging ? "border-brand bg-brand/5" : fileError ? "border-destructive bg-destructive/5" : "border-border hover:border-brand/50 hover:bg-muted/40"}`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isDragging ? "bg-brand/15" : "bg-muted"}`}>
                  <Upload className={`h-7 w-7 ${isDragging ? "text-brand" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Arraste o PDF aqui ou clique para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Apenas PDF · máximo {MAX_SIZE_MB} MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void validateAndSetFile(f); e.target.value = ""; }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                    <p className="text-xs text-emerald-600/70">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setPagesAuto(false); setForm((p) => ({ ...p, pages: 0 })); }}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remover ficheiro"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {fileError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {fileError}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-2">
              Título do documento <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Ex: Exame de Cálculo I — UEM 2024 (com resolução)"
              maxLength={120}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth ${errors.title ? "border-destructive" : "border-border"}`}
            />
            {errors.title && <p className="text-[11px] text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Author + Category */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="author" className="block text-sm font-semibold text-foreground mb-2">Autor / Fonte</label>
              <input
                id="author"
                type="text"
                value={form.author}
                onChange={(e) => setField("author", e.target.value)}
                placeholder="Ex: Prof. João Sithole / Ministério da Educação"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
                Categoria <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value as DocCategory | "")}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth ${errors.category ? "border-destructive" : "border-border"}`}
              >
                <option value="">Seleccionar categoria…</option>
                {DOC_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-[11px] text-destructive mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Pages */}
          <div>
            <label htmlFor="pages" className="block text-sm font-semibold text-foreground mb-2">
              <BookOpen className="inline h-3.5 w-3.5 mr-1" />
              Número de páginas
              {pagesAuto && (
                <span className="ml-2 text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  ✓ detectado automaticamente
                </span>
              )}
            </label>
            <input
              id="pages"
              type="number"
              min={1}
              max={9999}
              value={form.pages || ""}
              onChange={(e) => { setPagesAuto(false); setForm((p) => ({ ...p, pages: parseInt(e.target.value) || 0 })); }}
              placeholder="Ex: 24"
              className="w-full sm:w-40 rounded-lg border border-border px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Preenchido automaticamente ao carregar o PDF. Pode editar se necessário.</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
              Descrição <span className="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descreva o conteúdo, quem pode beneficiar e qualquer informação relevante para os outros estudantes…"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth resize-y ${errors.description ? "border-destructive" : "border-border"}`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description
                ? <p className="text-[11px] text-destructive">{errors.description}</p>
                : <span />}
              <span className="text-[11px] text-muted-foreground">{form.description.length}/500</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-foreground mb-2">
              <Tag className="inline h-3.5 w-3.5 mr-1" />
              Tags (separadas por vírgula)
            </label>
            <input
              id="tags"
              type="text"
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
              placeholder="Ex: matemática, UEM, 2024, exame, engenharia"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth"
            />
            <p className="text-[11px] text-muted-foreground mt-1">As tags ajudam outros estudantes a encontrar o documento mais facilmente.</p>
          </div>

          {/* Guidelines */}
          <div className="rounded-xl bg-muted/60 border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Directrizes de publicação
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                "Apenas documentos académicos (exames, trabalhos, sebentas, CVs).",
                "Não partilhe documentos com dados pessoais ou informação confidencial.",
                "Certifique-se de ter direito a partilhar o conteúdo.",
                "Documentos de baixa qualidade ou spam serão rejeitados.",
                "Ao submeter, aceita os Termos de Utilização do Giseveral Hub.",
              ].map((g) => (
                <li key={g} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/hub/explorar"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="inline h-4 w-4 mr-1" /> Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> A enviar…</>
              ) : (
                <><Upload className="h-4 w-4" /> Submeter documento</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
