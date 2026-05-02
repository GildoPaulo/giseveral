import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Phone, Map, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos — Giseveral e Services" },
      { name: "description", content: "Contacte a Giseveral e Services na Beira: telefone 874 383 621, WhatsApp e formulário online." },
    ],
  }),
  component: ContactosPage,
});

function ContactosPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name");
    const msg = fd.get("message");
    const text = `Olá Giseveral! Sou ${name}. ${msg}`;
    window.open(`https://wa.me/258874383621?text=${encodeURIComponent(String(text))}`, "_blank");
    setSent(true);
  };

  return (
    <Layout>
      <PageHero title="Fale connosco" subtitle="Estamos prontos para responder ao seu pedido." />
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-brand">Informações de contacto</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground"><Phone className="h-5 w-5" /></div>
                <div className="flex-1"><div className="text-sm text-muted-foreground">Telefone</div><div className="font-semibold text-brand">874 383 621</div></div>
              </div>
              <div className="grid grid-cols-2 border-t border-border">
                <a href="tel:+258874383621" className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand transition-smooth hover:bg-muted">
                  <Phone className="h-4 w-4" /> Ligar
                </a>
                <a href="sms:+258874383621" className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand transition-smooth hover:bg-muted border-l border-border">
                  <MessageCircle className="h-4 w-4" /> Enviar SMS
                </a>
              </div>
            </div>
            <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" /></div>
              <div><div className="text-sm text-muted-foreground">WhatsApp</div><div className="font-semibold text-brand">Enviar mensagem</div></div>
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rua+Alfredo+Lawley,+Esturro,+Beira,+Mo%C3%A7ambique"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground"><Map className="h-5 w-5" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Localização</div>
                <div className="font-semibold text-brand">Beira, Esturro • Rua Alfredo Lawley</div>
                <div className="text-xs text-gold mt-0.5">Ver no Google Maps →</div>
              </div>
            </a>
            <a href="mailto:geral@giseveral.com?subject=Contacto%20via%20site&body=Ol%C3%A1%20Giseveral%2C" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground"><Mail className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="text-sm text-muted-foreground">Email</div><div className="font-semibold text-brand break-all">geral@giseveral.com</div></div>
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-4">
          <h2 className="text-2xl font-bold text-brand">Formulário de contacto</h2>
          <div>
            <label className="text-sm font-medium text-foreground">Nome</label>
            <input name="name" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Telefone / Email</label>
            <input name="contact" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Mensagem</label>
            <textarea name="message" required rows={5} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
            Enviar via WhatsApp
          </button>
          {sent && <p className="text-sm text-green-600">Mensagem preparada — finalize o envio no WhatsApp.</p>}
        </form>
      </section>
      <WhatsAppFab />
    </Layout>
  );
}
