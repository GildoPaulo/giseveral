import { useState, FormEvent } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone, MessageCircle, Clock, Send } from "lucide-react";
import { SITE } from "@/data/site";
import { SEO } from "@/components/SEO";

const Contactos = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const text = `Olá Giseveral! Sou ${form.name} (${form.email}).%0A%0AAssunto: ${form.subject || "Contacto"}%0A%0A${form.message}`;
      window.open(`https://wa.me/${SITE.whatsappPrint}?text=${text}`, "_blank");
      toast({ title: "Mensagem pronta!", description: "A redireccionar para o WhatsApp..." });
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 600);
  };

  return (
    <Layout>
      <SEO
        title="Contactos — Giseveral Hub e Gráfica Giseveral & Services"
        description="Fale connosco por WhatsApp, email ou visite-nos em Maputo. Atendimento rápido para impressão e suporte."
      />
      <section className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto container-px animate-fade-in">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-3">Contacte-nos</h1>
          <p className="text-lg opacity-90 max-w-xl">
            Tem dúvidas, sugestões ou quer reportar algo? Responderemos rapidamente.
          </p>
        </div>
      </section>

      <section className="container mx-auto container-px py-12">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8">
          {/* INFO CARDS */}
          <div className="space-y-4 animate-fade-in">
            {[
              { icon: MessageCircle, title: "WhatsApp", value: "+258 87 438 3621", href: `https://wa.me/${SITE.whatsappPrint}`, color: "text-success" },
              { icon: Mail, title: "E-mail", value: "contacto@giseveral.co.mz", href: "mailto:contacto@giseveral.co.mz", color: "text-primary" },
              { icon: Phone, title: "Telefone", value: "+258 87 438 3621", href: "tel:+258874383621", color: "text-primary" },
              { icon: MapPin, title: "Endereço", value: "Maputo, Moçambique — Gráfica Giseveral & Services", color: "text-accent" },
              { icon: Clock, title: "Horário", value: "Seg–Sex: 08h–18h · Sáb: 09h–13h", color: "text-muted-foreground" },
            ].map((c, i) => {
              const Inner = (
                <div className="flex gap-4 rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-card-hover transition-smooth">
                  <div className={`grid h-11 w-11 place-items-center rounded-lg bg-secondary shrink-0 ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold mb-0.5">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.value}</div>
                  </div>
                </div>
              );
              return c.href ? (
                <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className="block animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
                  {Inner}
                </a>
              ) : (
                <div key={c.title} className="animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
                  {Inner}
                </div>
              );
            })}
          </div>

          {/* FORM */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-card space-y-5 animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            <div>
              <h2 className="font-display font-bold text-2xl mb-1">Envie-nos uma mensagem</h2>
              <p className="text-sm text-muted-foreground">Responderemos via WhatsApp dentro de poucas horas.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="O seu nome" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Assunto</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Em que podemos ajudar?" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Descreva o seu pedido..." required />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              <Send className="h-4 w-4" /> {loading ? "A enviar..." : "Enviar via WhatsApp"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contactos;
