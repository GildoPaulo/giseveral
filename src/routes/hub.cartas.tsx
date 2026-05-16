import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  LETTER_TYPES, fillTemplate, extractPlaceholders, keyToLabel,
  type LetterType, type LetterField,
} from "@/data/hub-cartas";
import {
  Sparkles, ChevronRight, ChevronLeft, Printer, RotateCcw,
  Copy, Check, Wand2, FileText, Star, Upload, X, Download,
  AlertCircle, CheckCircle2, MessageCircle, FileDown, BrainCircuit, Loader2,
} from "lucide-react";
import { callGemini } from "@/services/gemini";
import { LetterStudio } from "@/components/cartas/LetterStudio";

export const Route = createFileRoute("/hub/cartas")({
  head: () => ({
    meta: [
      { title: "Cartas Inteligentes — Giseveral Hub" },
      { name: "description", content: "Gere cartas profissionais em segundos com os nossos modelos guiados." },
    ],
  }),
  component: HubCartasPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Method = "giseveral" | "upload";
type Step = "select" | "method" | "form" | "preview";

type LetterTone = "formal" | "moderno" | "corporativo" | "criativo" | "jovem" | "tech" | "executivo";

const TONE_OPTIONS: { id: LetterTone; label: string; description: string }[] = [
  { id: "formal",       label: "Formal",       description: "Clássico, respeitoso" },
  { id: "moderno",      label: "Moderno",      description: "Profissional descontraído" },
  { id: "corporativo",  label: "Corporativo",  description: "Grande empresa" },
  { id: "criativo",     label: "Criativo",     description: "Voz pessoal, marcante" },
  { id: "jovem",        label: "Jovem",        description: "Estágios, primeiro emprego" },
  { id: "tech",         label: "Tech",         description: "Startups e tecnologia" },
  { id: "executivo",    label: "Executivo",    description: "Cargos de chefia" },
];

const TONE_INSTRUCTIONS: Record<LetterTone, string> = {
  formal:       "Linguagem formal e tradicional, tratamento respeitoso (V. Exas.), estrutura clássica de carta institucional.",
  moderno:      "Tom profissional mas natural, frases directas, evita formalismos pesados, transmite confiança contemporânea.",
  corporativo:  "Vocabulário corporativo, foco em resultados mensuráveis, KPIs, alinhamento estratégico e cultura empresarial.",
  criativo:     "Voz pessoal e marcante, abre com uma frase que prende, mostra personalidade sem perder profissionalismo.",
  jovem:        "Tom entusiasta, foca na motivação para aprender, energia e abertura a novos desafios.",
  tech:         "Linguagem de startup tech: produto, impacto, growth, stack, mindset de builder.",
  executivo:    "Tom autoritário e estratégico, foca em liderança, visão de negócio, transformação e resultados de equipa.",
};

type CustomTemplate = {
  name: string;
  content: string;
  fields: LetterField[];
};

// DB template row shape
type DbTemplate = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  fields: LetterField[];
  template: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

function HubCartasPage() {
  const [allTypes, setAllTypes] = useState<LetterType[]>(LETTER_TYPES);
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);
  const [method, setMethod] = useState<Method>("giseveral");
  const [customTemplate, setCustomTemplate] = useState<CustomTemplate | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveVariant, setImproveVariant] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [tom, setTom] = useState<LetterTone>("formal");
  const [studioOpen, setStudioOpen] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Load DB templates ─────────────────────────────────────────────────────
  useEffect(() => {
    (supabase as any).from("letter_templates").select("*").eq("active", true).order("sort_order")
      .then(({ data }: { data: DbTemplate[] | null }) => {
        if (data && data.length > 0) {
          const dbTypes: LetterType[] = (data as DbTemplate[]).map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            icon: d.icon,
            category: d.category,
            fields: Array.isArray(d.fields) ? d.fields : [],
            template: d.template,
          }));
          // Merge: DB templates first, then static ones not already present
          const dbIds = new Set(dbTypes.map((t) => t.id));
          const merged = [...dbTypes, ...LETTER_TYPES.filter((t) => !dbIds.has(t.id))];
          setAllTypes(merged);
        }
      });
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeFields: LetterField[] =
    method === "upload" && customTemplate
      ? customTemplate.fields
      : selectedType?.fields ?? [];

  const activeTemplate =
    method === "upload" && customTemplate
      ? customTemplate.content
      : selectedType?.template ?? "";

  const generated = formValues["__improved__"] ?? fillTemplate(activeTemplate, formValues);

  // ── Step 1: Select type ───────────────────────────────────────────────────

  function handleSelectType(type: LetterType) {
    setSelectedType(type);
    setFormValues({});
    setErrors({});
    setCustomTemplate(null);
    setUploadError(null);
    setStep("method");
  }

  // ── Step 2: Method ────────────────────────────────────────────────────────

  function handleMethodContinue() {
    if (method === "upload" && !customTemplate) {
      setUploadError("Por favor carregue um ficheiro .txt antes de continuar.");
      return;
    }
    setFormValues({});
    setErrors({});
    setStep("form");
  }

  // ── File upload ───────────────────────────────────────────────────────────

  function parseUploadedTemplate(content: string, filename: string): void {
    setUploadError(null);
    const keys = extractPlaceholders(content);
    if (keys.length === 0) {
      setUploadError(
        "Não foram encontrados campos {{PLACEHOLDER}} no ficheiro. Certifique-se de que usa a sintaxe {{CAMPO}} para marcar os campos variáveis."
      );
      return;
    }
    const fields: LetterField[] = keys.map((k) => ({
      key: k,
      label: keyToLabel(k),
      placeholder: `Preencha: ${keyToLabel(k).toLowerCase()}`,
      type: k.toLowerCase().includes("descri") || k.toLowerCase().includes("motiv") || k.toLowerCase().includes("texto")
        ? "textarea"
        : k.toLowerCase().includes("data")
        ? "date"
        : "text",
    }));
    setCustomTemplate({ name: filename, content, fields });
  }

  function handleFileRead(file: File) {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setUploadError("Apenas ficheiros .txt são suportados. Guarde o seu template como texto simples (.txt).");
      return;
    }
    if (file.size > 512 * 1024) {
      setUploadError("Ficheiro demasiado grande. Máximo 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => parseUploadedTemplate(e.target?.result as string, file.name);
    reader.onerror = () => setUploadError("Erro ao ler o ficheiro. Tente novamente.");
    reader.readAsText(file, "utf-8");
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
    e.target.value = "";
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // ── Step 3: Form ──────────────────────────────────────────────────────────

  function handleChange(key: string, value: string) {
    setFormValues((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    for (const f of activeFields) {
      if (f.required !== false && !formValues[f.key]?.trim()) {
        newErrors[f.key] = "Campo obrigatório";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleGenerate() {
    if (validateForm()) setStep("preview");
  }

  // ── Step 4: Preview actions ───────────────────────────────────────────────

  async function handleCopy() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePdfDirect() {
    const escaped = generated
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${getTitle()}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}
.page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}
@page{margin:2cm}@media print{body{-webkit-print-color-adjust:exact}}</style>
</head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqueado. Permita popups para este site."); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  function getTitle() {
    return method === "upload" && customTemplate
      ? customTemplate.name.replace(/\.txt$/i, "")
      : (selectedType?.title ?? "carta");
  }

  function handleDownloadTxt() {
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getTitle().toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadRtf() {
    // RTF format — compatible with Word, LibreOffice, Google Docs
    const lines = generated.split("\n");
    const rtfLines = lines.map((line) => {
      const escaped = line
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        // Convert non-ASCII to unicode escapes
        .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
      return `${escaped}\\par`;
    }).join("\n");

    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\*\\generator Giseveral Hub;}
\\f0\\fs24\\sl480\\slmult1
${rtfLines}
}`;
    const blob = new Blob([rtf], { type: "application/rtf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getTitle().toLowerCase().replace(/\s+/g, "-")}.rtf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ficheiro .RTF descarregado!", { description: "Abre com Word, LibreOffice ou Google Docs." });
  }

  function handleDownloadHtml() {
    // Styled HTML letter — can be opened in browser and printed as PDF
    const escaped = generated
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>${getTitle()}</title>
<style>
  body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.8;
         color: #000; background: #fff; margin: 0; padding: 0; }
  .page { max-width: 21cm; margin: 0 auto; padding: 2.5cm 2.5cm 3cm; }
  p { margin: 0 0 0.5em; }
  @media print {
    body { margin: 0; }
    .page { padding: 2cm 2.5cm 2.5cm; }
  }
</style>
</head>
<body>
<div class="page"><p>${escaped}</p></div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getTitle().toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Carta HTML descarregada!", { description: "Abra no browser e use Ctrl+P para guardar como PDF." });
  }

  function handleWhatsApp() {
    const docsNote = supportingDocs.length > 0
      ? `\n\n📎 Documentos de suporte: ${supportingDocs.map((f) => f.name).join(", ")}`
      : "";
    const text = encodeURIComponent(`${getTitle()}\n\n${generated}${docsNote}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  async function handleImprove(variant: "polir" | "curto" | "convincente" | "profissional" | "ats" = "polir") {
    if (!generated.trim()) return;
    setImproving(true);
    setImproveVariant(variant);
    try {
      const letterType = method === "upload"
        ? "personalizado"
        : (selectedType?.title ?? "profissional");
      const variantInstruction: Record<typeof variant, string> = {
        polir: "Mantém a estrutura e intenção mas torna o texto mais elegante e fluente.",
        curto: "Encurta o texto pelo menos 30%, mantendo apenas o essencial e os pontos fortes.",
        convincente: "Reescreve para soar mais convincente, com verbos de acção e evidências de impacto.",
        profissional: "Eleva o registo para um tom altamente profissional, executivo e maduro.",
        ats: "Optimiza para sistemas ATS: inclui palavras-chave relevantes da área, evita imagens/tabelas mentais, usa termos padrão da indústria.",
      };
      const prompt = `Reescreve esta carta ${letterType} com TOM "${tom}" (${TONE_INSTRUCTIONS[tom]}).
${variantInstruction[variant]}
Mantém português correcto e estrutura de carta (saudação, corpo, encerramento, assinatura).

Carta actual:
${generated}`;
      const improved = await callGemini("letter_generate", prompt);
      setFormValues((prev) => ({ ...prev, "__improved__": improved }));
      toast.success("Carta actualizada", { description: "Versão revista pela IA." });
    } catch (error) {
      const description = error instanceof Error ? error.message : String(error);
      toast.error("Não foi possível actualizar a carta.", {
        description: description || "Verifique a configuração da API.",
      });
    } finally {
      setImproving(false);
      setImproveVariant(null);
    }
  }

  async function handleAIGenerate() {
    setAiGenerating(true);
    try {
      const letterTitle = method === "upload" && customTemplate
        ? customTemplate.name.replace(/\.txt$/i, "")
        : (selectedType?.title ?? "carta formal");

      const fieldsSummary = activeFields
        .map((f) => `${f.label}: ${formValues[f.key] ?? "(não preenchido)"}`)
        .join("\n");

      const prompt = `Gera uma ${letterTitle} com TOM "${tom}" (${TONE_INSTRUCTIONS[tom]}).
Dados:
${fieldsSummary}

Estrutura: data, saudação, 3-4 parágrafos (introdução com gancho, corpo com evidências/motivação, conclusão com call-to-action), despedida formal e nome.
Português de Moçambique, claro, sem clichés. Comprimento: 250–400 palavras.`;

      const text = await callGemini("letter_generate", prompt);
      setFormValues((prev) => ({ ...prev, "__improved__": text }));
      setStep("preview");
      toast.success("Carta gerada com IA", { description: `Tom ${tom}. Reveja e exporte.` });
    } catch (error) {
      const description = error instanceof Error ? error.message : String(error);
      toast.error("Não foi possível gerar a carta com IA.", {
        description: description || "Verifique a configuração da API.",
      });
    } finally {
      setAiGenerating(false);
    }
  }

  function handleReset() {
    setStep("select");
    setSelectedType(null);
    setMethod("giseveral");
    setCustomTemplate(null);
    setFormValues({});
    setErrors({});
    setUploadError(null);
    setSupportingDocs([]);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const STEP_LABELS = ["Tipo de carta", "Método", "Preencher dados", "Rever e exportar"];
  const STEPS: Step[] = ["select", "method", "form", "preview"];
  const stepIdx = STEPS.indexOf(step);

  // Group types by category for the select screen
  const categories = [...new Set(allTypes.map((t) => t.category))];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand mb-4">
            <Sparkles className="h-4 w-4 text-gold" /> Cartas Inteligentes
          </div>
          <h1 className="text-4xl font-bold text-brand mb-3">Gere a sua carta em segundos</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha um modelo, preencha os dados e exporte como PDF, Word ou partilhe no WhatsApp.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1.5 mb-10 overflow-x-auto pb-1">
          {STEP_LABELS.map((label, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors
                  ${active ? "bg-gradient-brand text-brand-foreground"
                    : done ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"}`}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Select type ──────────────────────────────────────────── */}
        {step === "select" && (
          <div className="space-y-8">
            {categories.map((cat) => {
              const typesInCat = allTypes.filter((t) => t.category === cat);
              return (
                <div key={cat}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                    {cat}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typesInCat.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type)}
                        className="group text-left rounded-2xl border border-border bg-card p-5 hover:border-brand/40 hover:shadow-elegant transition-smooth"
                      >
                        <div className="text-3xl mb-3">{type.icon}</div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-foreground text-sm leading-tight">{type.title}</h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-brand transition-colors flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STEP 2: Choose method ────────────────────────────────────────── */}
        {step === "method" && selectedType && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl">{selectedType.icon}</span>
              <div>
                <h2 className="font-bold text-lg text-foreground">{selectedType.title}</h2>
                <p className="text-sm text-muted-foreground">Como quer criar a sua carta?</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Option A: Giseveral template */}
              <button
                onClick={() => { setMethod("giseveral"); setCustomTemplate(null); setUploadError(null); }}
                className={`group text-left rounded-xl border-2 p-5 transition-smooth
                  ${method === "giseveral" ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-colors
                  ${method === "giseveral" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-foreground">Usar template Giseveral</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Preencha um formulário e geramos a carta completa. Rápido e profissional.
                </p>
                {method === "giseveral" && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Seleccionado
                  </div>
                )}
              </button>

              {/* Option B: Upload own template */}
              <button
                onClick={() => setMethod("upload")}
                className={`group text-left rounded-xl border-2 p-5 transition-smooth
                  ${method === "upload" ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-colors
                  ${method === "upload" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-foreground">Enviar meu template</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Carregue o seu próprio ficheiro <code className="bg-muted px-1 rounded">.txt</code> com campos <code className="bg-muted px-1 rounded">{"{{CAMPO}}"}</code>.
                </p>
                {method === "upload" && customTemplate && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Seleccionado
                  </div>
                )}
              </button>
            </div>

            {/* Upload area */}
            {method === "upload" && (
              <div className="mb-6">
                {!customTemplate ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-smooth
                      ${isDragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/40 hover:bg-muted/40"}`}
                  >
                    <Upload className={`h-8 w-8 ${isDragging ? "text-brand" : "text-muted-foreground/50"}`} />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Arraste o ficheiro aqui</p>
                      <p className="text-xs text-muted-foreground mt-1">ou clique para seleccionar · apenas .txt · máx 512 KB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{customTemplate.name}</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-500">
                          {customTemplate.fields.length} campos detectados
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setCustomTemplate(null); setUploadError(null); }}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{uploadError}</p>
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-muted/50 border border-border p-4">
                  <p className="text-xs font-semibold text-foreground mb-2">Formato do template:</p>
                  <pre className="text-[11px] text-muted-foreground leading-relaxed overflow-x-auto">{`Maputo, {{DATA}}

Assunto: Pedido de {{ASSUNTO}}

Eu, {{NOME_COMPLETO}}, venho solicitar...
{{DESCRICAO}}

Atentamente,
{{NOME_COMPLETO}}`}</pre>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setStep("select")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button
                onClick={handleMethodContinue}
                disabled={method === "upload" && !customTemplate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Form ─────────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                {method === "upload" ? (
                  <>
                    <Upload className="h-6 w-6 text-brand" />
                    <div>
                      <h2 className="font-bold text-lg text-foreground">{customTemplate?.name}</h2>
                      <p className="text-sm text-muted-foreground">Template personalizado · {activeFields.length} campos</p>
                    </div>
                  </>
                ) : selectedType ? (
                  <>
                    <span className="text-2xl">{selectedType.icon}</span>
                    <div>
                      <h2 className="font-bold text-lg text-foreground">{selectedType.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                    </div>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setStudioOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-foreground to-brand px-4 py-2.5 text-sm font-bold text-background shadow-lg hover:opacity-90 transition-opacity"
                title="Abre o assistente IA em modo conversacional com preview A4 ao lado"
              >
                <Sparkles className="h-4 w-4" /> Abrir AI Studio
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {activeFields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    {field.label}
                    <span className="text-destructive ml-1">*</span>
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth resize-y
                        ${errors[field.key] ? "border-destructive" : "border-border"}`}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth
                        ${errors[field.key] ? "border-destructive" : "border-border"}`}
                    >
                      <option value="">Seleccionar…</option>
                      {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formValues[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-smooth
                        ${errors[field.key] ? "border-destructive" : "border-border"}`}
                    />
                  )}
                  {errors[field.key] && (
                    <p className="text-[10px] text-destructive mt-1">{errors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Supporting documents */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Documentos de suporte <span className="font-normal text-muted-foreground">(opcional)</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Anexe ficheiros que acompanham a carta: BI, diplomas, CV, fotos, PDF…
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-smooth flex-shrink-0 ml-4"
                >
                  <Upload className="h-3.5 w-3.5" /> Adicionar ficheiro
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setSupportingDocs((prev) => {
                      const combined = [...prev, ...files];
                      return combined.slice(0, 5);
                    });
                    e.target.value = "";
                  }}
                />
              </div>
              {supportingDocs.length === 0 ? (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-border py-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-brand/40 hover:bg-muted/30 transition-smooth"
                >
                  <FileDown className="h-6 w-6 opacity-40" />
                  <span className="text-xs">PDF, Word, Excel, imagem — máx 5 ficheiros</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {supportingDocs.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-brand flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSupportingDocs((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-2 rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {supportingDocs.length < 5 && (
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-brand/40 hover:text-brand transition-smooth"
                    >
                      + Adicionar mais ({supportingDocs.length}/5)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tom selector — controls IA voice */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tom da carta</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">A IA usa este tom para gerar e ajustar o texto.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map((t) => {
                  const active = tom === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTom(t.id)}
                      title={t.description}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-foreground text-background"
                          : "bg-card border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border gap-3">
              <button
                onClick={() => setStep("method")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  title="Gerar carta automaticamente com IA"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold hover:bg-gold/20 shadow-card transition-smooth disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  {aiGenerating ? "A gerar…" : "✨ Gerar com IA"}
                </button>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-glow transition-smooth"
                >
                  <Wand2 className="h-4 w-4" /> Gerar carta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preview ───────────────────────────────────────────────── */}
        {step === "preview" && (
          <div className="space-y-5">
            {/* Supporting docs strip (if any) */}
            {supportingDocs.length > 0 && (
              <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
                <p className="text-xs font-semibold text-gold mb-2.5 flex items-center gap-1.5">
                  <FileDown className="h-3.5 w-3.5" /> Documentos de suporte anexos
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportingDocs.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-1.5">
                      <FileText className="h-3.5 w-3.5 text-brand flex-shrink-0" />
                      <span className="text-xs text-foreground">{f.name}</span>
                      <span className="text-[10px] text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-3">
                  Leve estes ficheiros quando entregar a carta na Giseveral, ou envie via WhatsApp.
                </p>
              </div>
            )}
            {/* Action toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {method === "upload" ? (
                  <><Upload className="h-4 w-4 text-brand" /> {customTemplate?.name}</>
                ) : (
                  <><span>{selectedType?.icon}</span> {selectedType?.title}</>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "polir",        label: "Polir",        title: "Polir texto, manter intenção" },
                  { id: "curto",        label: "Mais curto",   title: "Reduzir comprimento ~30%" },
                  { id: "convincente",  label: "Convincente",  title: "Mais persuasivo, verbos de acção" },
                  { id: "profissional", label: "Profissional", title: "Eleva o registo para executivo" },
                  { id: "ats",          label: "ATS",          title: "Optimizar para sistemas de recrutamento" },
                ].map((v) => {
                  const busy = improving && improveVariant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleImprove(v.id as "polir" | "curto" | "convincente" | "profissional" | "ats")}
                      disabled={improving}
                      title={v.title}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      {busy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-gold" />
                      )}
                      {v.label}
                    </button>
                  );
                })}
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card px-5 py-3">
              <span className="text-xs font-semibold text-muted-foreground self-center mr-1">Exportar:</span>
              <button
                onClick={handleDownloadRtf}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth"
                title="Abre com Word, LibreOffice ou Google Docs"
              >
                <FileDown className="h-3.5 w-3.5" /> Word / .RTF
              </button>
              <button
                onClick={handlePdfDirect}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth"
                title="Abre o diálogo de impressão numa janela limpa"
              >
                <Printer className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
              >
                <Download className="h-3.5 w-3.5" /> .TXT
              </button>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white shadow-card hover:shadow-glow transition-smooth"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Nova carta
              </button>
            </div>

            {/* Letter preview */}
            <div
              ref={previewRef}
              className="rounded-2xl border border-border bg-white dark:bg-card shadow-elegant p-8 sm:p-12 min-h-[580px]"
            >
              <pre className="font-serif text-[13px] sm:text-sm leading-[1.9] text-foreground whitespace-pre-wrap break-words">
                {generated}
              </pre>
            </div>

            {/* Tips */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 flex items-start gap-2">
                <FileDown className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Word / RTF:</strong> Abre directamente no Microsoft Word ou LibreOffice para editar.
                </p>
              </div>
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-2">
                <Printer className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  <strong>PDF:</strong> Clique em PDF para abrir o diálogo de impressão — seleccione "Guardar como PDF" sem cabeçalhos do browser.
                </p>
              </div>
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700 dark:text-green-400">
                  <strong>WhatsApp:</strong> Envie o texto directamente para a Giseveral ou para a empresa.
                </p>
              </div>
            </div>

            {/* Edit link */}
            <div className="text-center">
              <button
                onClick={() => setStep("form")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Editar campos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Letter Studio — conversational mode */}
      {studioOpen && (
        <LetterStudio
          templateName={
            method === "upload" && customTemplate
              ? customTemplate.name.replace(/\.txt$/i, "")
              : selectedType?.title ?? "Carta"
          }
          fields={activeFields}
          template={activeTemplate}
          tone={tom}
          onClose={() => setStudioOpen(false)}
          onComplete={(text, values) => {
            // Push the studio result into the form state + go to preview.
            setFormValues((prev) => ({ ...prev, ...values, __improved__: text }));
            setStudioOpen(false);
            setStep("preview");
            toast.success("Carta importada do AI Studio");
          }}
        />
      )}
    </Layout>
  );
}
