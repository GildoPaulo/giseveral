import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  Award, Zap, ShieldCheck, Briefcase, Eye, Target,
  Printer, Laptop, Network, BookOpen, Palette, CheckCircle2, Phone,
} from "lucide-react";
import technician from "@/assets/technician.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Nós — Giseveral e Services" },
      { name: "description", content: "Empresa moderna na Beira: reprografia, papelaria, assistência informática, redes e serviços gráficos. Conheça a nossa missão, visão e valores." },
      { property: "og:title", content: "Sobre a Giseveral e Services" },
      { property: "og:description", content: "Soluções completas em tecnologia, impressão e papelaria — rapidez, qualidade e confiança." },
    ],
  }),
  component: SobrePage,
});

const valores = [
  { icon: Award, title: "Qualidade", desc: "Padrão elevado em cada serviço entregue." },
  { icon: ShieldCheck, title: "Responsabilidade", desc: "Compromisso com cada cliente e projeto." },
  { icon: Zap, title: "Rapidez", desc: "Atendimento ágil e prazos cumpridos." },
  { icon: Briefcase, title: "Honestidade", desc: "Transparência em preços e serviços." },
  { icon: Target, title: "Inovação", desc: "Tecnologia atualizada ao seu dispor." },
  { icon: CheckCircle2, title: "Satisfação", desc: "O cliente em primeiro lugar, sempre." },
];

const oQueFazemos = [
  { icon: Printer, title: "Reprografia", desc: "Impressão, fotocópias e digitalização." },
  { icon: Laptop, title: "Assistência Informática", desc: "Formatação, software e remoção de vírus." },
  { icon: Network, title: "Redes e Tecnologia", desc: "Wi-Fi, routers e configuração." },
  { icon: BookOpen, title: "Papelaria", desc: "Material escolar e de escritório." },
  { icon: Palette, title: "Serviços Gráficos", desc: "Design simples e impressão." },
];

function SobrePage() {
  return (
    <Layout>
      <PageHero title="Sobre a Giseveral e Services" subtitle="Quem somos, o que fazemos e o que nos move." />

      {/* QUEM SOMOS */}
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase">
            Quem somos
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-brand">
            Empresa moderna e multifuncional na Beira
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A <strong>Giseveral e Services</strong> é uma empresa moderna e multifuncional que atua nas áreas de
            reprografia, papelaria, assistência informática, redes de computadores e serviços gráficos.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Trabalhamos com foco em oferecer soluções rápidas, acessíveis e de qualidade para estudantes,
            empresas e o público em geral.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
          <img src={technician} alt="Técnico Giseveral a reparar um computador" className="relative w-full rounded-2xl shadow-elegant" loading="lazy" />
        </div>
      </section>

      {/* MISSÃO E VISÃO */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-brand">Missão</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Oferecer serviços de qualidade nas áreas de tecnologia, impressão e papelaria, garantindo
              rapidez, eficiência e satisfação dos nossos clientes.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-brand">Visão</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Ser uma empresa de referência na Beira e em Moçambique no setor de serviços tecnológicos,
              reprografia e soluções digitais.
            </p>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-brand">Os nossos valores</h2>
          <p className="mt-3 text-muted-foreground">Os princípios que guiam o nosso trabalho diário.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {valores.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-brand">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* O QUE FAZEMOS */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-brand">O que fazemos</h2>
            <p className="mt-3 text-muted-foreground">Soluções completas num só lugar.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {oQueFazemos.map((s) => (
              <div key={s.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-smooth hover:shadow-elegant">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MENSAGEM FINAL */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-hero p-8 md:p-12 text-brand-foreground shadow-elegant text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            "Soluções completas num só lugar."
          </h2>
          <p className="mt-4 text-brand-foreground/80 max-w-2xl mx-auto">
            Trabalhamos todos os dias para garantir que cada cliente receba um serviço eficiente,
            profissional e de confiança.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link to="/servicos" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
              Ver Serviços
            </Link>
            <a href="tel:+258874383621" className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10">
              <Phone className="h-4 w-4" /> 874 383 621
            </a>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
