import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, ImagePlus, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ImageUploadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  hint?: string;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  accept?: string;
};

export function ImageUpload({
  value,
  onChange,
  label = "Imagem de capa",
  hint = "Arraste ou escolha um ficheiro. Também funciona com URL externa.",
  bucket = "images",
  folder = "uploads",
  maxSizeMB = 5,
  accept = "image/*",
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) {
      setUrlInput(value ?? "");
    }
  }, [value, uploading]);

  useEffect(() => {
    if (!localPreview) return;
    return () => {
      URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const previewUrl = localPreview || value;
  const previewName = useMemo(() => {
    if (!previewUrl) return null;
    try {
      return new URL(previewUrl).pathname.split("/").pop() ?? null;
    } catch {
      return null;
    }
  }, [previewUrl]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Selecione um ficheiro de imagem válido.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Imagem demasiado grande. Máximo ${maxSizeMB} MB.`);
      return;
    }
    setError(null);
    setLocalPreview(URL.createObjectURL(file));
    uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `${folder}/${filename}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (uploadError) {
      setError(`Erro no upload: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      setError("Impossível obter URL pública da imagem.");
      setUploading(false);
      return;
    }

    onChange(data.publicUrl);
    toast.success("Imagem carregada com sucesso!");
    setUploading(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleSelectFile() {
    inputRef.current?.click();
  }

  function removeImage() {
    setLocalPreview(null);
    setUrlInput("");
    onChange(null);
  }

  function commitUrl(value: string) {
    const trimmed = value.trim();
    setUrlInput(trimmed);
    onChange(trimmed || null);
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{label}</label>
      <div
        className={`rounded-2xl border-2 ${dragActive ? "border-brand bg-brand/5" : "border-border bg-background"} p-4 text-center transition-colors cursor-pointer`}
        onClick={handleSelectFile}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-brand shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">Clique ou arraste uma imagem aqui</p>
        <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, WEBP até {maxSizeMB}MB</p>
        <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            onBlur={() => commitUrl(urlInput)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitUrl(urlInput); } }}
            placeholder="URL externa da imagem"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
            <Link2 className="h-4 w-4" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => commitUrl(urlInput)}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-muted px-3 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {uploading && (
        <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">A carregar imagem...</div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {previewUrl && (
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-brand">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <p>{previewName ?? "Imagem selecionada"}</p>
                <p className="text-[11px] text-muted-foreground">Pré-visualização</p>
              </div>
            </div>
            <button type="button" onClick={removeImage} className="rounded-full border border-border p-2 text-muted-foreground hover:text-destructive hover:border-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-black/5">
            <img
              src={previewUrl}
              alt={label}
              className="h-48 w-full object-contain bg-black/5"
              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
