import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Loader2, X, Check, Sparkles, Printer, Download, Copy, RotateCcw,
  FileText, FileType, FileCode, ClipboardCopy,
} from "lucide-react";
import { toast } from "sonner";
import { callGemini } from "@/services/gemini";
import { fillTemplate, type LetterField } from "@/data/hub-cartas";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

type Message = {
  id: string;
  role: "ai" | "user" | "system";
  text: string;
};

export type LetterTone = "formal" | "moderno" | "corporativo" | "criativo" | "jovem" | "tech" | "executivo";

const TONE_HINTS: Record<LetterTone, string> = {
  formal: "Linguagem formal, V. Exas., estrutura clássica.",
  moderno: "Profissional descontraído, frases directas.",
  corporativo: "Vocabulário corporativo, KPIs, foco em resultados.",
  criativo: "Voz pessoal, abre com gancho forte.",
  jovem: "Entusiasmo, motivação para aprender.",
  tech: "Linguagem startup: produto, growth, builder mindset.",
  executivo: "Liderança, visão de negócio, transformação.",
};

interface Props {
  templateName: string;
  fields: LetterField[];
  template: string;
  tone: LetterTone;
  onClose: () => void;
  onComplete: (text: string, values: Record<string, string>) => void;
}

export function LetterStudio({ templateName, fields, template, tone, onClose, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [finalText, setFinalText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isDone = currentIndex >= fields.length;
  const currentField = fields[currentIndex];
  const liveTemplate = finalText ?? fillTemplate(template, values);

  // Seed the conversation with the AI greeting + first question.
  useEffect(() => {
    if (messages.length > 0 || fields.length === 0) return;
    const first = fields[0];
    setMessages([
      {
        id: "greet",
        role: "ai",
        text: `Olá! Vou ajudar-te a preencher a tua **${templateName}**. Tom escolhido: **${tone}** — ${TONE_HINTS[tone]}\n\nVamos passo a passo, pergunta a pergunta. No fim, gero a carta completa.`,
      },
      {
        id: "q-0",
        role: "ai",
        text: `**${first.label}** — ${first.placeholder ?? "preenche este campo"}.`,
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  // Auto-open the feedback popup once the AI finishes polishing.
  useEffect(() => {
    if (finalText && !feedbackOpen) {
      const id = setTimeout(() => setFeedbackOpen(true), 600);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalText]);

  function pushAI(text: string) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "ai", text }]);
  }

  function submitAnswer(answer: string) {
    if (!currentField) return;
    const trimmed = answer.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setValues((v) => ({ ...v, [currentField.key]: trimmed }));
    setInput("");

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex < fields.length) {
      const next = fields[nextIndex];
      setThinking(true);
      setTimeout(() => {
        pushAI(`Boa. Próxima: **${next.label}** — ${next.placeholder ?? "preenche este campo"}.`);
        setThinking(false);
      }, 400);
    } else {
      // All fields collected — auto-trigger AI polish.
      setThinking(true);
      setTimeout(() => {
        pushAI("✅ Tenho todos os dados. Vou gerar a versão final com IA, respeitando o template e o tom escolhido…");
        setThinking(false);
        polishWithAi({ ...values, [currentField.key]: trimmed });
      }, 400);
    }
  }

  async function polishWithAi(allValues: Record<string, string>) {
    setGenerating(true);
    try {
      const filled = fillTemplate(template, allValues);
      const prompt = `Reescreve esta carta de forma profissional, **expandindo o conteúdo** para preencher uma folha A4 completa.
TOM: ${tone}. ${TONE_HINTS[tone]}

Regras:
- Mantém a estrutura: saudação, corpo em 4–5 parágrafos sólidos, despedida formal, assinatura.
- Expande o corpo com detalhes concretos, exemplos, motivação, capacidades transferíveis e visão de contributo.
- Cada parágrafo do corpo deve ter 4–7 frases (não frases telegráficas).
- Não inventes dados pessoais que não estejam preenchidos — usa exactamente os valores do utilizador.
- Polir gramática, fluência, profissionalismo. Português de Moçambique.
- **Comprimento alvo: 450–650 palavras** (suficiente para preencher A4 com Times New Roman 12pt margens 2.5cm).

Dados originais já preenchidos no template (mantém placeholders no resultado, NÃO os reescrevas):
${filled}`;
      const text = await callGemini("letter_generate", prompt);
      setFinalText(text);
      pushAI("Carta gerada. Confere o preview à direita e exporta quando estiveres satisfeito.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro a contactar a IA";
      pushAI(`⚠️ A IA falhou (${msg}). Usei o template preenchido tal como está — podes editar à mão antes de exportar.`);
      setFinalText(fillTemplate(template, allValues));
    } finally {
      setGenerating(false);
    }
  }

  async function regenerate() {
    if (Object.keys(values).length === 0) return;
    setFinalText(null);
    await polishWithAi(values);
  }

  function copyToClipboard() {
    if (!liveTemplate) return;
    navigator.clipboard.writeText(liveTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
    toast.success("Copiado");
  }

  function printPreview() {
    const escaped = liveTemplate
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${templateName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff}
  .page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}
  p{margin:0 0 0.5em}
  @page{margin:2cm}
  @media print{body{-webkit-print-color-adjust:exact}}
</style></head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permite popups para imprimir"); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  function fileBase() {
    return templateName.toLowerCase().replace(/\s+/g, "-");
  }

  function downloadBlob(blob: Blob, ext: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileBase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadTxt() {
    downloadBlob(new Blob([liveTemplate], { type: "text/plain;charset=utf-8" }), "txt");
    toast.success("Descarregado .txt");
  }

  function downloadRtf() {
    // RTF format — abre em Word, LibreOffice, Google Docs.
    const lines = liveTemplate.split("\n");
    const rtfLines = lines.map((line) => {
      const escaped = line
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
      return `${escaped}\\par`;
    }).join("\n");
    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}
{\\*\\generator Giseveral AI Letter Studio;}
\\f0\\fs24\\sl480\\slmult1
${rtfLines}
}`;
    downloadBlob(new Blob([rtf], { type: "application/rtf" }), "rtf");
    toast.success("Descarregado .rtf", { description: "Abre com Word, LibreOffice ou Google Docs." });
  }

  function downloadDoc() {
    // Word-compatible HTML wrapped as .doc — opens directly in MS Word.
    const escaped = liveTemplate
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>${templateName}</title>
<style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8}p{margin:0 0 0.5em}@page WordSection1{size:21cm 29.7cm;margin:2.5cm 2.5cm 3cm}div.WordSection1{page:WordSection1}</style>
</head><body><div class='WordSection1'><p>${escaped}</p></div></body></html>`;
    downloadBlob(new Blob([html], { type: "application/msword" }), "doc");
    toast.success("Descarregado .doc", { description: "Abre directamente no Microsoft Word." });
  }

  function downloadHtml() {
    const escaped = liveTemplate
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${templateName}</title>
<style>
  body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.8;color:#000;background:#fff;margin:0;padding:0}
  .page{max-width:21cm;margin:0 auto;padding:2.5cm 2.5cm 3cm}
  p{margin:0 0 0.5em}
  @media print{.page{padding:2cm 2.5cm}}
</style></head><body><div class="page"><p>${escaped}</p></div></body></html>`;
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), "html");
    toast.success("Descarregado .html");
  }

  function finalize() {
    onComplete(liveTemplate, values);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">AI Letter Studio</p>
            <p className="text-[11px] text-muted-foreground truncate">{templateName} · tom <span className="font-semibold">{tone}</span></p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">

        {/* ── Chat panel ──────────────────────────────────────── */}
        <div className="flex flex-col border-r border-border bg-muted/20 min-h-0">
          {/* Progress */}
          <div className="border-b border-border bg-background px-4 py-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-bold text-foreground tabular-nums">
                {Math.min(currentIndex, fields.length)} / {fields.length}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${(Math.min(currentIndex, fields.length) / Math.max(fields.length, 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-brand to-gold"
              />
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "ai" && (
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-foreground text-background rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm"
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                  />
                </motion.div>
              ))}
              {(thinking || generating) && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); submitAnswer(input); }}
            className="border-t border-border bg-card p-3"
          >
            {isDone ? (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" /> Regenerar com IA
                </button>
                <button
                  type="button"
                  onClick={finalize}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <Check className="h-3.5 w-3.5" /> Usar esta carta
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer(input);
                    }
                  }}
                  rows={2}
                  placeholder={currentField?.placeholder ?? "Responde aqui…"}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* ── A4 Preview panel ────────────────────────────────── */}
        <div className="flex flex-col bg-[#e9e9e9] dark:bg-muted/40 min-h-0">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background/80 backdrop-blur px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pré-visualização A4</p>
            <div className="flex items-center gap-1">
              {/* Manual reopen — once user dismissed the popup */}
              {finalText && !feedbackOpen && (
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold hover:bg-muted transition-colors"
                  title="Avaliar / pedir revisão humana"
                >
                  <Sparkles className="h-3 w-3 text-gold" /> Avaliar
                </button>
              )}
              <DownloadMenu
                disabled={!liveTemplate}
                onWord={downloadDoc}
                onRtf={downloadRtf}
                onTxt={downloadTxt}
                onHtml={downloadHtml}
              />
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!liveTemplate}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                title="Copiar texto"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copiar
              </button>
              <button
                type="button"
                onClick={printPreview}
                disabled={!liveTemplate}
                className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-2 py-1 text-[11px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Printer className="h-3 w-3" /> Imprimir / PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Real A4 sheet */}
            <div className="mx-auto bg-white text-[#111] shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-sm" style={a4Style}>
              {generating ? (
                <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm rounded-sm">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">A polir com IA…</p>
                  </div>
                </div>
              ) : null}
              <pre className="whitespace-pre-wrap font-serif" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "12pt", lineHeight: 1.8 }}>
                {liveTemplate || (currentField ? `[${currentField.label}: aguarda…]` : "")}
              </pre>
              {!liveTemplate && Object.keys(values).length === 0 && (
                <div className="mt-6 rounded border border-dashed border-[#ccc] p-4 text-xs text-[#666]" style={{ fontFamily: "sans-serif" }}>
                  ⓘ À medida que respondes às perguntas do assistente, a carta vai aparecendo aqui, página A4 real,
                  com Times New Roman 12pt e margens 2,5 cm.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-popup after IA finishes — feedback + download / print quick actions */}
      {finalText && (
        <FeedbackWidget
          source="letter"
          sourceTitle={`Carta — ${templateName} (${tone})`}
          output={liveTemplate}
          prompt={`Template: ${templateName}\nTom: ${tone}\nDados: ${JSON.stringify(values)}`}
          metadata={{ templateName, tone, values }}
          hideInline
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          quickActions={[
            { label: "Copiar texto",   icon: ClipboardCopy, onClick: () => { copyToClipboard(); } },
            { label: "Word (.doc)",    icon: FileType,      onClick: () => { downloadDoc(); } },
            { label: ".rtf · LibreOffice", icon: FileText,  onClick: () => { downloadRtf(); } },
            { label: "Imprimir / PDF", icon: Printer,       onClick: () => { printPreview(); } },
          ]}
          onAction={async (action) => {
            if (action.kind === "ai_improve" || action.kind === "ai_regenerate") {
              setFeedbackOpen(false);
              await regenerate();
            }
          }}
        />
      )}
    </div>
  );
}

const a4Style: React.CSSProperties = {
  width: "21cm",
  minHeight: "29.7cm",
  maxWidth: "100%",
  padding: "2.5cm 2.5cm 3cm",
  position: "relative",
};

// Tiny markdown-ish renderer for **bold** and line breaks.
function renderMarkdown(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

// ── Download menu dropdown ───────────────────────────────────────

function DownloadMenu({
  disabled, onWord, onRtf, onTxt, onHtml,
}: {
  disabled?: boolean;
  onWord: () => void;
  onRtf: () => void;
  onTxt: () => void;
  onHtml: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
      >
        <Download className="h-3 w-3" /> Descarregar
      </button>
      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-[60] min-w-[180px] rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
          <MenuItem icon={FileType} label=".doc — Microsoft Word"     hint="Recomendado" onClick={() => { onWord(); setOpen(false); }} />
          <MenuItem icon={FileText} label=".rtf — Word / LibreOffice" onClick={() => { onRtf(); setOpen(false); }} />
          <MenuItem icon={FileCode} label=".html — web"               onClick={() => { onHtml(); setOpen(false); }} />
          <MenuItem icon={FileText} label=".txt — texto simples"      onClick={() => { onTxt(); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon, label, hint, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
    >
      <span className="inline-flex items-center gap-2 text-foreground font-semibold">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </span>
      {hint && <span className="text-[10px] font-bold text-brand">{hint}</span>}
    </button>
  );
}
