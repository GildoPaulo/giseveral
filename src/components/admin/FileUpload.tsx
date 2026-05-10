import { useRef, useState } from "react";
import { UploadCloud, FileText, Link2, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  hint?: string;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  accept?: string;
};

export function FileUpload({
  value,
  onChange,
  label = "Ficheiro",
  hint = "Arraste ou escolha um ficheiro",
  bucket = "hub-documents",
  folder = "uploads",
  maxSizeMB = 20,
  accept = ".pdf,.doc,.docx,.xlsx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileName = value
    ? (() => { try { return decodeURIComponent(new URL(value).pathname.split("/").pop() ?? "ficheiro"); } catch { return "ficheiro"; } })()
    : null;

  async function handleFile(file: File) {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ficheiro demasiado grande. Máximo ${maxSizeMB} MB.`);
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (uploadErr) {
      setError(`Erro no upload: ${uploadErr.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      setError("Não foi possível obter URL pública.");
      setUploading(false);
      return;
    }
    onChange(data.publicUrl);
    setUrlInput(data.publicUrl);
    toast.success("Ficheiro carregado!");
    setUploading(false);
  }

  function commitUrl(v: string) {
    const trimmed = v.trim();
    setUrlInput(trimmed);
    onChange(trimmed || null);
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{label}</label>

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
          dragActive ? "border-brand bg-brand/5" : "border-border hover:border-brand/40 hover:bg-muted/30"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-brand">
            <Loader2 className="h-5 w-5 animate-spin" /> A carregar...
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Clique ou arraste o ficheiro</p>
            <p className="text-xs text-muted-foreground mt-1">{hint} · máx {maxSizeMB} MB</p>
          </>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onBlur={() => commitUrl(urlInput)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitUrl(urlInput); } }}
            placeholder="Ou cole o URL externo do ficheiro"
            className="w-full rounded-lg border border-border bg-background px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <Link2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
        {value && (
          <button type="button" onClick={() => { onChange(null); setUrlInput(""); }}
            className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            title="Remover ficheiro">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Current file preview */}
      {value && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40 px-4 py-3">
          <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">{fileName}</p>
            <p className="text-[11px] text-emerald-600/70">Ficheiro guardado</p>
          </div>
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 flex-shrink-0" title="Abrir ficheiro">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
