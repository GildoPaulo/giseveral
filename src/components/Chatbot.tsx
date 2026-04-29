import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

type Msg = { role: "bot" | "user"; text: string };

const WELCOME: Msg = {
  role: "bot",
  text: "Olá! 👋 Sou o Giseveral Assistente. Como posso ajudar hoje? Pode perguntar sobre impressão, informática, redes, papelaria, localização, contactos ou preços.",
};

const QUICK = [
  "Reprografia",
  "Informática",
  "Redes",
  "Papelaria",
  "Localização",
  "Contactos",
  "Preços",
];

function answer(input: string): string {
  const q = input.toLowerCase();

  if (/(ola|olá|oi|bom dia|boa tarde|boa noite|hello|hi)/.test(q))
    return "Olá! 😊 Em que posso ajudar? Posso falar sobre os nossos serviços, preços ou contactos.";

  if (/(reprograf|imprim|impress|fotocop|cópia|copia|digitaliz|scan|plastific|encaderna)/.test(q))
    return "🖨️ Reprografia: fazemos impressões a cores e P&B, fotocópias, digitalização, plastificação e encadernação. Quer um orçamento? Envie a quantidade e o tipo de papel.";

  if (/(informatic|informát|format|window|vírus|virus|software|computador|pc|laptop|repara)/.test(q))
    return "💻 Assistência informática: formatação, instalação de Windows e programas, remoção de vírus, otimização e reparação de computadores.";

  if (/(rede|wifi|wi-fi|router|internet|cabeam|lan)/.test(q))
    return "🌐 Redes e tecnologia: instalação de Wi-Fi, configuração de routers, redes LAN e cabeamento estruturado para casa e empresas.";

  if (/(papelaria|material|caderno|escolar|escritório|escritorio|caneta)/.test(q))
    return "📚 Papelaria: material escolar e de escritório — cadernos, canetas, pastas, papel A4 e muito mais.";

  if (/(design|gráfic|grafic|cartão|cartao|flyer|banner|logo)/.test(q))
    return "🎨 Serviços gráficos: design simples (cartões, flyers, banners) e impressão profissional.";

  if (/(localiza|onde|endereco|endereço|morada|beira)/.test(q))
    return "📍 Estamos localizados na Beira, Moçambique. Visite-nos ou contacte-nos pelo WhatsApp.";

  if (/(contact|telefon|telemóvel|telemovel|whats|email|mail)/.test(q))
    return "📞 Telefone/WhatsApp: 874 383 621\n📧 Email: giseveral.services@outlook.com\nClique no botão verde do WhatsApp para falar connosco agora.";

  if (/(preco|preço|custa|valor|quanto|orcament|orçament)/.test(q))
    return "💰 Os preços variam consoante o serviço. Consulte a página de Preços ou envie a sua necessidade pelo WhatsApp (874 383 621) para um orçamento rápido.";

  if (/(horari|horário|aberto|funciona)/.test(q))
    return "🕒 Atendemos de segunda a sábado em horário comercial. Para horários específicos, contacte-nos pelo WhatsApp.";

  if (/(obrigad|valeu|thanks|thank)/.test(q))
    return "De nada! 🙏 Estamos sempre disponíveis para ajudar.";

  return "Posso ajudar com: 🖨️ Reprografia, 💻 Informática, 🌐 Redes, 📚 Papelaria, 🎨 Design, 📍 Localização, 📞 Contactos e 💰 Preços. Sobre qual gostaria de saber mais?";
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: answer(t) }]);
    }, 350);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chatbot"
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground shadow-elegant transition-smooth hover:scale-110"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-hero px-4 py-3 text-brand-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Giseveral Assistente</div>
                <div className="text-[11px] text-brand-foreground/70">Online • responde já</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-md p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm shadow-card ${
                    m.role === "user"
                      ? "bg-gradient-brand text-brand-foreground rounded-br-sm"
                      : "bg-card text-foreground rounded-bl-sm border border-border"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 bg-muted/30 border-t border-border">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground hover:bg-accent transition-smooth"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva uma mensagem..."
              className="flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              aria-label="Enviar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
