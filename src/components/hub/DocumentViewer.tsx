import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Loader2, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// react-pdf is loaded lazily on the client only — it pulls in pdfjs which
// touches browser-only APIs at module load on some versions.
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js worker via jsDelivr CDN — pinned to the exact pdfjs version that
// ships with react-pdf, with correct MIME for .mjs (Vite's local bundle was
// failing with "Failed to resolve module specifier 'pdf.worker.mjs'").
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const BUCKET = "hub-documents";

type Props = {
  /**
   * Full Supabase public URL OR storage path for the PDF.
   * The component extracts the path and requests a signed URL so the raw
   * URL is never exposed in the HTML.
   */
  fileUrl: string;
  /** Display name in the toolbar. */
  title?: string;
  /** Initial scale (0.6 – 1.5). */
  initialScale?: number;
  /** Optional pre-known page count for the placeholder. */
  knownPages?: number;
};

function urlToStoragePath(fileUrl: string): string {
  // If it already looks like a relative path, keep it.
  if (!/^https?:\/\//i.test(fileUrl)) return fileUrl.replace(/^\/+/, "");
  const marker = `/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return fileUrl;
  return fileUrl.substring(idx + marker.length).split("?")[0];
}

export function DocumentViewer({ fileUrl, title, initialScale = 1, knownPages }: Props) {
  const [mounted, setMounted] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedError, setSignedError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(knownPages ?? 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [fullscreen, setFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(720);
  // If react-pdf fails to render (worker issue, bad PDF, network), fall back to
  // the browser's native <embed> viewer — works in every browser.
  const [fallbackEmbed, setFallbackEmbed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Client-only render.
  useEffect(() => { setMounted(true); }, []);

  // Resolve a signed URL on mount (and whenever the source changes).
  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;
    (async () => {
      const path = urlToStoragePath(fileUrl);
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (cancelled) return;
      if (error || !data?.signedUrl) {
        // Fall back to the original URL only if the bucket happens to be public.
        setSignedUrl(/^https?:\/\//i.test(fileUrl) ? fileUrl : null);
        setSignedError(error?.message ?? "URL não acessível");
        return;
      }
      setSignedUrl(data.signedUrl);
      setSignedError(null);
    })();
    return () => { cancelled = true; };
  }, [fileUrl]);

  // Track the container width so each page renders at the right size.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 720;
      setContainerWidth(Math.max(280, Math.min(w - 24, 920)));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mounted]);

  // Fullscreen.
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Block Ctrl/Cmd+S, Ctrl/Cmd+P inside the viewer to discourage screen-print
  // and "save page". Users must use the official credit-gated download button.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("keydown", block, true);
    return () => el.removeEventListener("keydown", block, true);
  }, [mounted]);

  const onLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
  }, []);

  // Scroll to the active page when navigation buttons are used.
  useEffect(() => {
    if (!mounted || !numPages) return;
    const el = document.getElementById(`pdf-page-${currentPage}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage, mounted, numPages]);

  const onLoadError = useCallback((err: Error) => {
    setSignedError(err.message);
    setFallbackEmbed(true);
  }, []);

  const pages = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);
  // No cMap URL: most ASCII/Latin PDFs render fine without it, and external
  // unpkg dependency was a single point of failure.
  const pdfOptions = useMemo(() => ({}), []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col rounded-2xl bg-[#f5f5f5] dark:bg-muted/50 border border-border overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur px-3 py-2">
        <p className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
          {title ?? "Documento"}
        </p>

        <div className="flex items-center gap-2 text-xs">
          {/* Zoom out */}
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Reduzir"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="tabular-nums font-semibold text-foreground min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2)))}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Aumentar"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <span className="mx-1 h-4 w-px bg-border" />

          {/* Page nav */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="tabular-nums font-semibold text-foreground min-w-[52px] text-center">
            {currentPage} / {numPages || "—"}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages || p, p + 1))}
            disabled={!numPages || currentPage >= numPages}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <span className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={fullscreen ? "Sair fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Page list */}
      <div
        className="flex-1 overflow-auto py-4 px-2 sm:px-4"
        style={{ minHeight: 420, maxHeight: fullscreen ? "calc(100vh - 60px)" : "70vh" }}
      >
        {!mounted ? (
          <ViewerSkeleton />
        ) : signedError && !signedUrl ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-600 mb-3">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Não foi possível abrir o ficheiro</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">{signedError}</p>
          </div>
        ) : !signedUrl ? (
          <ViewerSkeleton />
        ) : fallbackEmbed ? (
          // STRICT: no native embed viewer (bypassed the credit system).
          // Show actionable error + retry instead.
          <div className="grid place-items-center py-12 text-center px-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-600 mb-3">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Pré-visualização indisponível</p>
            {signedError && (
              <p className="mt-1 max-w-md text-[11px] text-muted-foreground/80 font-mono break-all">
                {signedError}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground max-w-md">
              Verifica a tua ligação ou tenta novamente. Se persistir, usa o botão oficial <span className="font-semibold">"Descarregar PDF"</span> ao lado.
            </p>
            <button
              type="button"
              onClick={() => {
                setFallbackEmbed(false);
                setSignedError(null);
                // Trigger reload of the signed URL
                setSignedUrl(null);
                // Re-resolve on next tick
                setTimeout(() => {
                  const path = urlToStoragePath(fileUrl);
                  supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data, error }) => {
                    if (error || !data?.signedUrl) {
                      setSignedError(error?.message ?? "URL não acessível");
                      setFallbackEmbed(true);
                    } else {
                      setSignedUrl(data.signedUrl);
                    }
                  });
                }, 50);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Loader2 className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        ) : (
          <Document
            file={signedUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={<ViewerSkeleton />}
            error={<ViewerError />}
            options={pdfOptions}
          >
            <div className="flex flex-col items-center gap-4">
              {pages.map((p) => (
                <motion.div
                  key={p}
                  id={`pdf-page-${p}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white shadow-md rounded-sm"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <Page
                    pageNumber={p}
                    width={containerWidth * scale}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={<div style={{ width: containerWidth * scale, height: 600 }} className="bg-muted animate-pulse" />}
                  />
                </motion.div>
              ))}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="grid place-items-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="mt-3 text-xs text-muted-foreground">A preparar o documento…</p>
    </div>
  );
}

function ViewerError() {
  return (
    <div className="grid place-items-center py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-600 mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">Falha ao carregar o PDF</p>
      <p className="mt-1 text-xs text-muted-foreground">Verifica a tua ligação e tenta de novo.</p>
    </div>
  );
}

// Tiny utility wrapper used by the doc-card thumbnail (first-page preview).
export function DocumentThumbnail({ fileUrl, width = 160, fallback }: { fileUrl: string; width?: number; fallback?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;
    (async () => {
      const path = urlToStoragePath(fileUrl);
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (cancelled) return;
      setSignedUrl(data?.signedUrl ?? (/^https?:\/\//i.test(fileUrl) ? fileUrl : null));
    })();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (!mounted || !signedUrl) return <div style={{ width, aspectRatio: "1/1.414" }} className="bg-muted animate-pulse rounded-sm" />;
  if (failed) return <>{fallback}</>;

  return (
    <Document
      file={signedUrl}
      loading={<div style={{ width, aspectRatio: "1/1.414" }} className="bg-muted animate-pulse rounded-sm" />}
      onLoadError={() => setFailed(true)}
      onSourceError={() => setFailed(true)}
    >
      <Page
        pageNumber={1}
        width={width}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        loading={<div style={{ width, aspectRatio: "1/1.414" }} className="bg-muted animate-pulse rounded-sm" />}
      />
    </Document>
  );
}
