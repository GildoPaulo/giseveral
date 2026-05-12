import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Check, Loader2, AlertTriangle, Zap } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  TEMPLATE_META,
  DEFAULT_CV_DATA,
  exportCvToPdf,
  downloadBlob,
  Sidebar,
  TopBar,
  Preview,
} from "@/components/cv-builder";
import type { CvData, CvTemplate, CvDesign } from "@/components/cv-builder";
import { PreviewAPI } from "@/components/cv-builder/editor/PreviewAPI";
import { fetchAPITemplates, generateAPIPdf } from "@/services/reactiveApi";
import type { APITemplate } from "@/services/reactiveApi";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hub/cv")({
  component: CVBuilderPage,
});

type TemplateSource = "local" | "api";

const API_TEMPLATE_TO_LOCAL: Record<string, CvTemplate> = {
  azurill: "azurill",
  bronzor: "bronzor",
  onyx: "onyx",
  ditto: "ditto",
  pikachu: "pikachu",
  kakuna: "modern",
  slategray: "modern",
  chikorita: "modern",
  elegant: "azurill",
  gengar: "onyx",
  glalie: "onyx",
  leafish: "azurill",
  nosepass: "bronzor",
  porcelain: "azurill",
  rhyhorn: "bronzor",
};

function CVBuilderPage() {
  const [view, setView] = useState<"gallery" | "editor">("gallery");
  const [template, setTemplate] = useState<CvTemplate>("azurill");
  const [apiTemplateId, setApiTemplateId] = useState<string | null>(null);
  const [templateSource, setTemplateSource] = useState<TemplateSource>("local");
  const [cvData, setCvData] = useState<CvData>(DEFAULT_CV_DATA);
  const [exporting, setExporting] = useState(false);

  function selectLocalTemplate(t: CvTemplate) {
    setTemplate(t);
    setTemplateSource("local");
    setApiTemplateId(null);
    const meta = TEMPLATE_META.find(m => m.id === t);
    if (meta) {
      setCvData(prev => ({ ...prev, design: { ...prev.design, primaryColor: meta.accent } }));
    }
    setView("editor");
  }

  function selectAPITemplate(t: APITemplate) {
    const mapped = API_TEMPLATE_TO_LOCAL[t.id];
    if (mapped) {
      selectLocalTemplate(mapped);
      return;
    }

    setApiTemplateId(t.id);
    setTemplateSource("api");
    setView("editor");
  }

  function handleDesignChange(patch: Partial<CvDesign>) {
    setCvData(prev => ({ ...prev, design: { ...prev.design, ...patch } }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      let blob: Blob;
      if (templateSource === "api" && apiTemplateId) {
        blob = await generateAPIPdf(cvData, apiTemplateId);
      } else {
        blob = await exportCvToPdf(cvData, template);
      }
      const name = cvData.personal.nome.replace(/\s+/g, "-").toLowerCase() || "cv";
      downloadBlob(blob, `${name}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF", { description: String(e) });
    } finally {
      setExporting(false);
    }
  }

  const currentTemplateName =
    templateSource === "api"
      ? apiTemplateId ?? "API Template"
      : (TEMPLATE_META.find(m => m.id === template)?.label ?? template);

  if (view === "editor") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <TopBar
          template={templateSource === "local" ? template : "azurill"}
          design={cvData.design}
          exporting={exporting}
          onBack={() => setView("gallery")}
          onDesignChange={handleDesignChange}
          onExport={handleExport}
          customTemplateName={templateSource === "api" ? currentTemplateName : undefined}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar data={cvData} onChange={setCvData} />
          {templateSource === "api" && apiTemplateId ? (
            <PreviewAPI templateId={apiTemplateId} data={cvData} />
          ) : (
            <Preview template={template} data={cvData} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Gallery
        onSelectLocal={selectLocalTemplate}
        onSelectAPI={selectAPITemplate}
        selectedLocal={template}
        selectedApiId={apiTemplateId}
        templateSource={templateSource}
      />
    </Layout>
  );
}

type DbTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  reactive_id: string | null;
};

interface GalleryProps {
  onSelectLocal: (t: CvTemplate) => void;
  onSelectAPI: (t: APITemplate) => void;
  selectedLocal: CvTemplate;
  selectedApiId: string | null;
  templateSource: TemplateSource;
}

function Gallery({ onSelectLocal, onSelectAPI, selectedLocal, selectedApiId, templateSource }: GalleryProps) {
  const [apiTemplates, setApiTemplates] = useState<APITemplate[]>([]);
  const [loadingAPI, setLoadingAPI] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    setLoadingAPI(true);
    fetchAPITemplates()
      .then(ts => setApiTemplates(ts))
      .catch(e => setApiError(String(e)))
      .finally(() => setLoadingAPI(false));
  }, []);

  useEffect(() => {
    supabase
      .from("cv_templates" as any)
      .select("id, name, slug, description, category, preview_url, is_premium, is_active, sort_order, reactive_id")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setDbTemplates(data as DbTemplate[]);
        setLoadingDb(false);
      })
      .catch(() => setLoadingDb(false));
  }, []);

  function selectDbTemplate(t: DbTemplate) {
    const localIds = TEMPLATE_META.map(m => m.id);
    if (t.reactive_id) {
      const mapped = API_TEMPLATE_TO_LOCAL[t.reactive_id];
      if (mapped) {
        onSelectLocal(mapped);
        return;
      }
      onSelectAPI({ id: t.reactive_id, name: t.name, description: t.description });
      return;
    }

    if (localIds.includes(t.slug as CvTemplate)) {
      onSelectLocal(t.slug as CvTemplate);
    } else {
      onSelectLocal("azurill");
    }
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border px-6 py-10 text-center">
        <div className="inline-flex items-center gap-2 text-brand text-sm font-semibold mb-3">
          <Sparkles size={15} />
          CV Builder
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cria o teu currículo profissional</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Escolhe um template, preenche os teus dados e exporta em PDF — sem marcas d'água, sem registo.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* ── Managed / local templates ── */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
            {dbTemplates.length > 0 ? "Templates geridos" : "Templates locais"}
          </h2>

          {loadingDb && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 size={15} className="animate-spin" />
              A carregar templates...
            </div>
          )}

          {!loadingDb && dbTemplates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {dbTemplates.map(t => (
                <TemplateCard
                  key={t.id}
                  label={t.name}
                  desc={t.description}
                  accent="#1d4ed8"
                  preview={t.preview_url ?? `/templates/${t.slug}.jpg`}
                  tag={t.is_premium ? "Premium" : t.category}
                  selected={
                    (templateSource === "local" && selectedLocal === t.slug) ||
                    (templateSource === "api" && selectedApiId === t.reactive_id)
                  }
                  onSelect={() => selectDbTemplate(t)}
                />
              ))}
            </div>
          )}

          {!loadingDb && dbTemplates.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {TEMPLATE_META.map(t => (
                <TemplateCard
                  key={t.id}
                  label={t.label}
                  desc={t.desc}
                  accent={t.accent}
                  preview={t.preview}
                  tag={t.tag}
                  selected={templateSource === "local" && selectedLocal === t.id}
                  onSelect={() => onSelectLocal(t.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── API templates ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Templates via API</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Zap size={9} />
              BETA
            </span>
          </div>

          {loadingAPI && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 size={15} className="animate-spin" />
              A carregar templates da API...
            </div>
          )}

          {apiError && (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">Templates da API indisponíveis</p>
                  <p className="text-muted-foreground text-xs mb-3">{apiError}</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione{" "}
                    <code className="bg-muted rounded px-1 py-0.5 font-mono">REACTIVE_API_KEY</code>{" "}
                    nas <strong>variáveis de ambiente</strong> do Cloudflare Pages
                    (Settings → Environment variables → Production). Entretanto, usa os templates locais acima.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loadingAPI && !apiError && apiTemplates.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {apiTemplates.map(t => {
                const mapped = API_TEMPLATE_TO_LOCAL[t.id];
                return (
                  <TemplateCard
                    key={t.id}
                    label={t.name}
                    desc={t.description ?? "Template via Reactive Resume API"}
                    accent="#6366f1"
                    preview={t.preview ?? `/templates/${t.id}.jpg`}
                    tag={mapped ? "Local" : "API"}
                    selected={
                      mapped
                        ? templateSource === "local" && selectedLocal === mapped
                        : templateSource === "api" && selectedApiId === t.id
                    }
                    onSelect={() => selectAPITemplate(t)}
                  />
                );
              })}
            </div>
          )}

          {!loadingAPI && !apiError && apiTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Nenhum template da API encontrado.</p>
          )}
        </section>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  label: string;
  desc: string;
  accent: string;
  preview: string;
  tag?: string;
  selected: boolean;
  onSelect: () => void;
}

function TemplateCard({ label, desc, accent, preview, tag, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all hover:shadow-lg focus:outline-none ${
        selected ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-brand/40"
      }`}
    >
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "210/297" }}>
        <img
          src={preview}
          alt={label}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: accent }} />
        {tag && (
          <div className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: accent }}>
            {tag}
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-brand/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg">
              <Check size={18} className="text-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
            Usar template
          </span>
        </div>
      </div>
      <div className="p-3 bg-card">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: accent }} />
          <span className="text-sm font-bold text-foreground">{label}</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </button>
  );
}
