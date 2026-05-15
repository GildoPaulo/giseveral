import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  MessageCircle, Sparkles, FileText, Phone, X, Bot, Loader2, Send,
} from "lucide-react";

type Msg = { role: "bot" | "user"; text: string };

// Local fallback so the menu works even when the proxy is down.
function ruleAnswer(input: string): string {
  const q = input.toLowerCase();
  if (/(ol[aá]|oi|bom dia|hello|hi)/.test(q))
    return "Olá! Posso ajudar com reprografia, informática, papelaria, hub académico ou preços. O que precisa?";
  if (/(imprim|impress|fotocop|c[oó]pia)/.test(q))
    return "Impressão P&B 5 MZN/pág · cores 15 MZN/pág · fotocópia 3 MZN/pág. Quer fazer um pedido?";
  if (/(format|window|v[ií]rus|computador|pc)/.test(q))
    return "Formatação 500 MZN · Windows 700 MZN · remoção de vírus 400 MZN. Marcamos? WhatsApp 874 383 621.";
  if (/(rede|wifi|wi-fi|router)/.test(q))
    return "Router/Wi-Fi 1.500 MZN · cabeamento/ponto 200 MZN. Empresas: orçamento sob medida.";
  if (/(bolsa|scholarship|estudar)/.test(q))
    return "Visite /hub/bolsas para dezenas de bolsas internacionais.";
  if (/(cv|currículo|curriculo)/.test(q))
    return "Crie um CV profissional em minutos em /hub/cv.";
  if (/(localiz|onde|endere[cç]o)/.test(q))
    return "Beira, Esturro · Rua Alfredo Lawley · Seg–Sáb 8h–17h.";
  if (/(contact|telefon|whats|email)/.test(q))
    return "WhatsApp 874 383 621 · geral@giseveral.com";
  if (/(pre[cç]o|quanto|custa|or[cç]ament)/.test(q))
    return "Diga o serviço e respondo com o preço exacto, ou veja /precos.";
  return "Posso ajudar com reprografia, informática, redes, hub académico, bolsas, CVs ou preços. O que precisa?";
}

async function getReply(history: Msg[], userText: string): Promise<string> {
  try {
    const resp = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "chat",
        prompt: userText,
        context: history.length > 1
          ? history.slice(-4).map((m) => `${m.role === "bot" ? "Bot" : "User"}: ${m.text}`).join("\n")
          : undefined,
      }),
    });
    if (!resp.ok) return ruleAnswer(userText);
    const data = await resp.json() as { text?: string };
    return data.text?.trim() || ruleAnswer(userText);
  } catch {
    return ruleAnswer(userText);
  }
}

const WELCOME: Msg = {
  role: "bot",
  text: "Olá! Sou o assistente da Giseveral. Em que posso ajudar?",
};

const QUICK = ["Preços", "Impressão", "Informática", "Bolsas", "CV"];

type Pane = "menu" | "chat";

export function AssistantFab() {
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<Pane>("menu");
  const [hintShown, setHintShown] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // After 8s, peek a friendly hint above the FAB. Only once per session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("giseveral.assistant.hinted") === "1") return;
    const id = setTimeout(() => {
      setHintShown(true);
      sessionStorage.setItem("giseveral.assistant.hinted", "1");
      setTimeout(() => setHintShown(false), 6000);
    }, 8000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setLoading(true);
    const reply = await getReply(messages, t);
    setMessages((m) => [...m, { role: "bot", text: reply }]);
    setLoading(false);
  }

  function openMenu() {
    setOpen(true);
    setPane("menu");
    setHintShown(false);
  }

  return (
    <>
      {/* Peek hint */}
      <AnimatePresence>
        {hintShown && !open && (
          <motion.button
            type="button"
            onClick={openMenu}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed right-3 bottom-[140px] md:bottom-[88px] z-40 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold shadow-elegant hover:opacity-90 max-w-[220px]"
          >
            <span className="mr-1">👋</span> Precisa de ajuda? Estamos aqui.
          </motion.button>
        )}
      </AnimatePresence>

      {/* The button itself */}
      {!open && (
        <motion.button
          type="button"
          onClick={openMenu}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          aria-label="Abrir assistente"
          className="fixed bottom-20 right-3 z-40 grid h-11 w-11 place-items-center rounded-full bg-foreground text-background shadow-elegant hover:scale-105 active:scale-95 transition-transform md:bottom-6 md:right-6 md:h-12 md:w-12"
        >
          <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-1.5rem)] sm:w-[360px] max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-border bg-card shadow-elegant overflow-hidden"
            role="dialog"
            aria-modal="false"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background">
                  {pane === "chat" ? <Bot className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-foreground">
                    {pane === "chat" ? "Assistente IA" : "Como podemos ajudar?"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {pane === "chat" ? "Pergunta o que quiseres" : "Escolhe uma opção"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setPane("menu"); }}
                aria-label="Fechar"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu pane */}
            {pane === "menu" && (
              <div className="p-3 space-y-2">
                <MenuItem
                  icon={Sparkles}
                  title="Perguntar à IA"
                  subtitle="Resposta instantânea 24/7"
                  onClick={() => setPane("chat")}
                  accent
                />
                <MenuItem
                  icon={MessageCircle}
                  title="Abrir WhatsApp"
                  subtitle="+258 874 383 621"
                  href="https://wa.me/258874383621"
                  external
                />
                <MenuItem
                  icon={FileText}
                  title="Pedir orçamento"
                  subtitle="Cotação personalizada"
                  to="/orcamento"
                />
                <MenuItem
                  icon={Phone}
                  title="Falar com suporte"
                  subtitle="Beira · Seg–Sáb 8h–17h"
                  to="/contactos"
                />
              </div>
            )}

            {/* Chat pane */}
            {pane === "chat" && (
              <>
                <button
                  type="button"
                  onClick={() => setPane("menu")}
                  className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors border-b border-border"
                >
                  ← Voltar
                </button>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/15 min-h-48 max-h-64">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "bot" && (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-foreground text-background rounded-tr-sm"
                            : "bg-card text-foreground rounded-tl-sm border border-border"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {messages.length <= 1 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1.5 bg-card border-t border-border">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-foreground/40 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escreve a tua mensagem…"
                    className="flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    aria-label="Enviar"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuItem({
  icon: Icon, title, subtitle, onClick, href, to, external, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick?: () => void;
  href?: string;
  to?: string;
  external?: boolean;
  accent?: boolean;
}) {
  const inner = (
    <>
      <div className={`grid h-9 w-9 place-items-center rounded-full ${accent ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </>
  );
  const cls = "flex items-center gap-3 w-full rounded-xl border border-border bg-background hover:bg-muted/60 transition-colors px-3 py-2.5 text-left";

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    );
  }
  if (to) {
    return <Link to={to} className={cls}>{inner}</Link>;
  }
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
