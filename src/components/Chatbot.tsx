import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";

type Msg = { role: "bot" | "user"; text: string };

/* ── Gemini config ───────────────────────────────────────── */
const GEMINI_KEY = (typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_KEY : undefined) ?? "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `Você é o assistente virtual da Giseveral e Services, empresa em Beira, Moçambique.
Responda SEMPRE em Português. Respostas curtas (máx 3 frases). Seja amigável e direto.

EMPRESA: Beira, Esturro • Rua Alfredo Lawley · Tel/WhatsApp: 874 383 621 · Seg-Sáb 8h-17h

PREÇOS:
- Impressão P&B: 5 MZN/pág · Cores: 15 MZN/pág · Fotocópia: 3 MZN/pág (50+ pág: -10%, 100+ pág: -20%)
- Digitalização: 5 MZN/pág · Encadernação: 50-150 MZN · Plastificação A4: 30 MZN
- Formatação PC: 500 MZN · Windows: 700 MZN · Vírus: 400 MZN · Programas: 200 MZN
- Router Wi-Fi: 1.500 MZN · Cabeamento/ponto: 200 MZN · Extensão Wi-Fi: 800 MZN
- Logotipo: 1.500 MZN · Cartão visita: 300 MZN · Panfleto A5: 400 MZN

Se quiserem pedir/orçamento: sugira WhatsApp 874 383 621 ou loja online.
Trabalhos urgentes: +30% acréscimo.`;

/* ── rule-based fallback ─────────────────────────────────── */
function ruleAnswer(input: string): string {
  const q = input.toLowerCase();
  if (/(ola|olá|oi|bom dia|boa tarde|hello|hi)/.test(q))
    return "Olá! 😊 Posso ajudar com informações sobre impressão, informática, redes, papelaria, preços ou localização.";
  if (/(reprograf|imprim|impress|fotocop|cópia|copia|digitaliz|plastific|encaderna)/.test(q))
    return "🖨️ Impressão P&B: 5 MZN/pág · Cores: 15 MZN/pág · Fotocópia: 3 MZN/pág. Descontos de volume a partir de 50 páginas! Quer fazer um pedido?";
  if (/(format|window|vírus|virus|computador|pc|laptop|repara)/.test(q))
    return "💻 Formatação: 500 MZN · Windows: 700 MZN · Remoção de vírus: 400 MZN. Quer agendar? Ligue: 874 383 621.";
  if (/(rede|wifi|wi-fi|router|internet|cabo|lan)/.test(q))
    return "🌐 Router/Wi-Fi: 1.500 MZN · Cabeamento por ponto: 200 MZN · Extensão Wi-Fi: 800 MZN. Para redes empresariais pedimos orçamento.";
  if (/(design|gráfic|logo|cartão|flyer|banner)/.test(q))
    return "🎨 Logotipo: 1.500 MZN · Cartão de visita: 300 MZN · Panfleto A5: 400 MZN. Quer saber mais?";
  if (/(localiza|onde|endereco|endereço|beira)/.test(q))
    return "📍 Estamos na Beira, Esturro • Rua Alfredo Lawley, Moçambique. Atendemos Seg–Sáb, 8h–17h.";
  if (/(contact|telefon|whats|email)/.test(q))
    return "📞 WhatsApp/Tel: 874 383 621\n📧 geral@giseveral.com";
  if (/(preco|preço|quanto|custa|valor|orcament)/.test(q))
    return "💰 Diga-me qual serviço precisa e dou o preço exacto! Ou consulte a página Preços do site.";
  if (/(horari|aberto|funciona)/.test(q))
    return "🕒 Seg–Sáb, 8h–17h. Para urgências, contacte pelo WhatsApp: 874 383 621.";
  if (/(pedido|encomendar|comprar|fazer pedido)/.test(q))
    return "🛒 Pode fazer o pedido pela loja online do site ou via WhatsApp: 874 383 621. Qual prefere?";
  if (/(obrigad|valeu|thanks)/.test(q))
    return "De nada! 🙏 Estamos sempre disponíveis para ajudar.";
  return "Posso ajudar com: 🖨️ Reprografia, 💻 Informática, 🌐 Redes, 📚 Papelaria, 🎨 Design, 📍 Localização ou 💰 Preços. Sobre o que precisa de informação?";
}

/* ── Gemini call ─────────────────────────────────────────── */
async function getReply(history: Msg[], userText: string): Promise<string> {
  if (!GEMINI_KEY) return ruleAnswer(userText);
  try {
    const contents = [
      ...history.map((m) => ({
        role: m.role === "bot" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: userText }] },
    ];
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 200 },
      }),
    });
    if (!res.ok) return ruleAnswer(userText);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ruleAnswer(userText);
  } catch {
    return ruleAnswer(userText);
  }
}

/* ── quick replies ───────────────────────────────────────── */
const QUICK = ["💰 Preços", "🖨️ Impressão", "💻 Informática", "🌐 Redes", "📍 Localização", "🛒 Fazer pedido"];

const WELCOME: Msg = {
  role: "bot",
  text: "Olá! 👋 Sou o assistente da Giseveral. Como posso ajudar hoje?",
};

/* ── component ───────────────────────────────────────────── */
export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir assistente"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground shadow-elegant transition-smooth hover:scale-110 hover:shadow-glow"
        >
          <MessageSquare className="h-6 w-6" />
          {GEMINI_KEY && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-gold-foreground">
              AI
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-hero px-4 py-3 text-brand-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
                {GEMINI_KEY ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">Giseveral Assistente</div>
                <div className="text-[11px] text-brand-foreground/70">
                  {GEMINI_KEY ? "IA Gemini • responde já" : "Assistente • responde já"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-md p-1.5 hover:bg-white/15 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/20 min-h-48 max-h-72">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card ${
                    m.role === "user"
                      ? "bg-gradient-brand text-brand-foreground rounded-tr-sm"
                      : "bg-card text-foreground rounded-tl-sm border border-border"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1.5 bg-card border-t border-border">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q.replace(/^[^ ]+ /, ""))}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-brand/50 hover:text-brand transition-smooth"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Enviar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-card transition-smooth hover:shadow-glow disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
