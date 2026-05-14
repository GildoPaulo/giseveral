import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  Award, Zap, ShieldCheck, Briefcase, Eye, Target,
  Printer, Laptop, Network, BookOpen, Palette, CheckCircle2, Phone,
  Users, Clock, Map, TrendingUp, UserCircle,
} from "lucide-react";
import { generateSEOMeta, generateOrganizationSchema, generatePersonSchema, SEO_PRESETS } from "@/lib/seo";

export const Route = createFileRoute("/sobre")({
  head: () => {
    const seo = generateSEOMeta(SEO_PRESETS.sobre());
    return seo;
  },
  component: SobrePage,
});

const valores = [
  { icon: Award,       title: "Qualidade",        desc: "Padrão elevado em cada serviço entregue." },
  { icon: ShieldCheck, title: "Responsabilidade",  desc: "Compromisso com cada cliente e projeto." },
  { icon: Zap,         title: "Rapidez",           desc: "Atendimento ágil e prazos sempre cumpridos." },
  { icon: Briefcase,   title: "Honestidade",       desc: "Transparência total em preços e serviços." },
  { icon: Target,      title: "Inovação",          desc: "Tecnologia atualizada ao seu dispor." },
  { icon: CheckCircle2,title: "Satisfação",        desc: "O cliente em primeiro lugar, sempre." },
];

const oQueFazemos = [
  { icon: Printer,  title: "Reprografia",          desc: "Impressão, fotocópias e digitalização." },
  { icon: Laptop,   title: "Assistência Informática", desc: "Formatação, software e remoção de vírus." },
  { icon: Network,  title: "Redes e Tecnologia",   desc: "Wi-Fi, routers e configuração." },
  { icon: BookOpen, title: "Papelaria",            desc: "Material escolar e de escritório." },
  { icon: Palette,  title: "Serviços Gráficos",   desc: "Design e criação de materiais visuais." },
];

const stats = [
  { icon: Users,     value: "500+",  label: "Clientes satisfeitos" },
  { icon: Clock,     value: "10+",   label: "Anos de experiência" },
  { icon: TrendingUp,value: "5",     label: "Áreas de serviço" },
  { icon: Map,    value: "Beira", label: "Beira, Esturro • Rua Alfredo Lawley" },
];

function SobrePage() {
  // Structured Data para SEO
  const organizationSchema = generateOrganizationSchema();
  const personSchema = generatePersonSchema();

  return (
    <Layout>
      {/* JSON-LD Structured Data para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <PageHero title="Sobre a Giseveral e Services" subtitle="Quem somos, o que fazemos e o que nos move." />

      {/* QUEM SOMOS */}
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase">
            Quem somos
          </span>
          <h2 className="mt-4 font-bold text-brand">
            Empresa moderna e multifuncional na Beira
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A <strong className="text-foreground">Giseveral e Services</strong> é uma empresa moderna e
            multifuncional que atua nas áreas de reprografia, papelaria, assistência informática,
            redes de computadores e serviços gráficos.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Trabalhamos com foco em oferecer soluções rápidas, acessíveis e de qualidade para
            estudantes, empresas e o público em geral na cidade da Beira.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/servicos" className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card transition-smooth hover:shadow-elegant">
              Os nossos serviços
            </Link>
            <Link to="/contactos" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-smooth">
              Falar connosco
            </Link>
          </div>
        </div>

        {/* Stats grid — no people images */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-brand">{s.value}</p>
              <p className="text-sm text-muted-foreground leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSÃO E VISÃO */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-brand">Missão</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Oferecer serviços de qualidade nas áreas de tecnologia, impressão e papelaria,
              garantindo rapidez, eficiência e satisfação dos nossos clientes.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-brand">Visão</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Ser uma empresa de referência na Beira e em Moçambique no setor de serviços
              tecnológicos, reprografia e soluções digitais.
            </p>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-bold text-brand">Os nossos valores</h2>
          <p className="mt-3 text-muted-foreground">Os princípios que guiam o nosso trabalho diário.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {valores.map((v) => (
            <div key={v.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant hover:border-gold/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground transition-smooth group-hover:scale-110">
                <v.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold text-brand">{v.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* O QUE FAZEMOS */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-bold text-brand">O que fazemos</h2>
            <p className="mt-3 text-muted-foreground">Soluções completas num só lugar.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {oQueFazemos.map((s) => (
              <div key={s.title} className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant hover:border-gold/30">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-brand">{s.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CEO / FUNDADOR */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase">
              Liderança
            </span>
            <h2 className="mt-4 font-bold text-brand">Fundador & CEO</h2>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 shadow-elegant">
            <div className="grid md:grid-cols-[auto,1fr] gap-8 items-start">
              {/* Foto do CEO - usar quando disponível */}
              <div className="flex justify-center md:justify-start">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-brand text-brand-foreground shadow-card">
                  <UserCircle className="h-20 w-20" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-brand">Gildo Paulo Correia</h3>
                <p className="text-gold font-semibold mt-1">CEO & Founder</p>

                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Empreendedor moçambicano com paixão por tecnologia e inovação. Fundou a Giseveral e Services
                  com a visão de democratizar o acesso a serviços de qualidade em reprografia, tecnologia e
                  educação na cidade da Beira.
                </p>

                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Com mais de uma década de experiência no setor, Gildo lidera uma equipa dedicada a oferecer
                  soluções completas que combinam eficiência, qualidade e atendimento personalizado. A sua
                  missão é transformar a Giseveral numa referência nacional em serviços digitais e educacionais.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm">
                    <Briefcase className="h-4 w-4 text-brand" />
                    <span className="font-medium">10+ anos de experiência</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm">
                    <Target className="h-4 w-4 text-brand" />
                    <span className="font-medium">Visão: Referência nacional</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-brand" />
                    <span className="font-medium">Inovação & Crescimento</span>
                  </div>
                </div>

                {/* Links - adicionar quando disponíveis
                <div className="mt-6 flex gap-3">
                  <a href="https://linkedin.com/in/gildopaulocorreia" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand transition-colors">
                    LinkedIn
                  </a>
                </div>
                */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-hero p-8 md:p-12 text-brand-foreground shadow-elegant text-center">
          <h2 className="font-bold">"Soluções completas num só lugar."</h2>
          <p className="mt-4 text-brand-foreground/75 max-w-xl mx-auto">
            Trabalhamos todos os dias para garantir que cada cliente receba um serviço
            eficiente, profissional e de confiança.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link to="/servicos" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
              Ver Serviços
            </Link>
            <a href="tel:+258874383621" className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10 transition-smooth">
              <Phone className="h-4 w-4" /> 874 383 621
            </a>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
