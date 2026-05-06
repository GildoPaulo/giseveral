import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Eye, Heart, Users, Printer, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { SITE } from "@/data/site";
import { SEO } from "@/components/SEO";

const Sobre = () => {
  return (
    <Layout>
      <SEO
        title="Sobre o Giseveral Hub — A nossa missão em Moçambique"
        description="Conheça a história, missão e valores do Giseveral Hub: a ponte entre documentos digitais e impressão profissional em Moçambique."
      />
      {/* HERO */}
      <section className="relative bg-gradient-hero text-primary-foreground py-20 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="container mx-auto container-px relative animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> SOBRE NÓS
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-5 max-w-3xl text-balance">
            A ponte entre o documento digital e a impressão em Moçambique
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            O Giseveral Hub nasceu para resolver um problema real: estudantes moçambicanos
            sem acesso fácil a materiais académicos partilhados pela comunidade.
          </p>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="container mx-auto container-px py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-3xl mb-5">A nossa história</h2>
            <div className="space-y-4 text-foreground/80 leading-relaxed">
              <p>
                Tudo começou na <strong>Gráfica Giseveral & Services</strong>, em Maputo, onde
                diariamente atendemos dezenas de estudantes a precisar de imprimir trabalhos,
                exames e sebentas.
              </p>
              <p>
                Percebemos que a maioria perdia horas a procurar documentos espalhados por
                grupos de WhatsApp, pen drives e e-mails. Faltava um sítio único, organizado e
                de confiança.
              </p>
              <p>
                Foi assim que nasceu o <strong>Giseveral Hub</strong> — uma plataforma feita por
                moçambicanos, para moçambicanos, que centraliza documentos académicos e os liga
                directamente ao serviço de impressão da gráfica.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {[
              { icon: Target, title: "Missão", text: "Democratizar o acesso a materiais académicos em Moçambique." },
              { icon: Eye, title: "Visão", text: "Ser a maior biblioteca digital estudantil do país." },
              { icon: Heart, title: "Valores", text: "Comunidade, qualidade e confiança em primeiro lugar." },
              { icon: Users, title: "Comunidade", text: "+12.000 estudantes activos de todas as universidades." },
            ].map((c, i) => (
              <div
                key={c.title}
                style={{ animationDelay: `${200 + i * 80}ms` }}
                className="rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth animate-scale-in"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground mb-3">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE OFERECEMOS */}
      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto container-px">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-3xl mb-3">O que oferecemos</h2>
            <p className="text-muted-foreground">Mais que um repositório, um ecossistema completo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, t: "Documentos moderados", d: "Cada upload é revisto pela equipa para garantir qualidade." },
              { icon: Users, t: "Sistema de créditos justo", d: `Envie 1 documento, ganhe ${SITE.creditsPerUpload} créditos. Cada download custa ${SITE.creditsPerDownload}.` },
              { icon: Printer, t: "Impressão num clique", d: "Ligação directa à Gráfica Giseveral via WhatsApp com orçamento na hora." },
            ].map((f, i) => (
              <div
                key={f.t}
                style={{ animationDelay: `${i * 100}ms` }}
                className="rounded-2xl bg-card border border-border p-6 shadow-card animate-fade-in"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-hero text-primary-foreground mb-4 shadow-elegant">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto container-px py-16">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <h3 className="font-display font-extrabold text-3xl sm:text-4xl mb-3 relative">Faça parte da comunidade</h3>
          <p className="opacity-90 max-w-xl mx-auto mb-6 relative">
            Crie a sua conta, partilhe documentos e ajude milhares de estudantes moçambicanos.
          </p>
          <div className="flex flex-wrap gap-3 justify-center relative">
            <Button asChild size="xl" variant="hero">
              <Link to="/login">Criar conta grátis <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground hover:text-primary">
              <Link to="/contactos">Falar connosco</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Sobre;
