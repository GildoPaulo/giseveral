import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { CvData } from "../types";
import { generateAPIPreview } from "@/services/reactiveApi";

interface Props {
  templateId: string;
  data: CvData;
}

export function PreviewAPI({ templateId, data }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce preview generation — 600ms after last change
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      loadPreview();
    }, 600);
    return () => clearTimeout(timerRef.current);
  }, [data, templateId]);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAPIPreview(data, templateId);
      setHtml(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // Inject HTML into iframe
  useEffect(() => {
    if (!html || !iframeRef.current) return;
    const iframe = iframeRef.current;
    iframe.srcdoc = html;
  }, [html]);

  if (error) {
    return (
      <div className="flex-1 bg-[#e8eaed] flex items-center justify-center p-8">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
          <h3 className="font-bold text-foreground mb-2">Não foi possível carregar o preview da API</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="text-xs text-muted-foreground mb-5 bg-muted rounded-lg p-3 text-left">
            <p className="font-semibold mb-1">Possíveis causas:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Chave <code>VITE_REACTIVE_API_KEY</code> não configurada no <code>.env</code></li>
              <li>API <code>rxresu.me</code> indisponível ou endpoint inválido</li>
              <li>Limite de pedidos excedido</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={loadPreview}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-[#e8eaed] flex flex-col items-center py-8 px-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-[#e8eaed]/80 flex items-center justify-center z-10">
          <div className="bg-card border border-border rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <Loader2 size={18} className="animate-spin text-brand" />
            <span className="text-sm font-medium">A gerar preview...</span>
          </div>
        </div>
      )}
      {html ? (
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 shadow-2xl bg-white"
          style={{ maxWidth: 794, borderRadius: 2 }}
          sandbox="allow-same-origin"
          title="CV Preview"
        />
      ) : !loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">A carregar preview...</p>
        </div>
      ) : null}
    </div>
  );
}
