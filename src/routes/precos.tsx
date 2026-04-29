import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Printer, Laptop, Network, Palette, MessageCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Preços — Giseveral e Services" },
      { name: "description", content: "Tabela de preços de impressão, fotocópias, formatação, instalação de Windows e configuração de redes na Beira." },
    ],
  }),
  component: PrecosPage,
});

const categorias = [
  {
    icon: Printer,
    title: "Reprografia & Impressão",
    cor: "bg-gradient-brand text-brand-foreground",
    servicos: [
      { nome: "Impressão Preto & Branco",      preco: "5 MZN",       unidade: "por página",   destaque: false },
      { nome: "Impressão a Cores",              preco: "15 MZN",      unidade: "por página",   destaque: false },
      { nome: "Fotocópias",                     preco: "3 MZN",       unidade: "por página",   destaque: false },
      { nome: "Digitalização de documentos",    preco: "5 MZN",       unidade: "por página",   destaque: false },
      { nome: "Encadernação simples",           preco: "50 MZN",      unidade: "por trabalho", destaque: false },
      { nome: "Encadernação com capa dura",     preco: "150 MZN",     unidade: "por trabalho", destaque: true  },
      { nome: "Plastificação A4",               preco: "30 MZN",      unidade: "por folha",    destaque: false },
      { nome: "Impressão de banners / cartazes","preco": "Orçamento", unidade: "sob consulta", destaque: false },
    ],
  },
  {
    icon: Laptop,
    title: "Assistência Informática",
    cor: "bg-gradient-gold text-gold-foreground",
    servicos: [
      { nome: "Formatação de PC / Laptop",   preco: "500 MZN",    unidade: "inclui backup",   destaque: true  },
      { nome: "Instalação de Windows",       preco: "700 MZN",    unidade: "com drivers",      destaque: false },
      { nome: "Remoção de vírus / malware",  preco: "400 MZN",    unidade: "diagnóstico incl.",destaque: false },
      { nome: "Instalação de programas",     preco: "200 MZN",    unidade: "pacote básico",    destaque: false },
      { nome: "Recuperação de dados",        preco: "Orçamento",  unidade: "sob consulta",     destaque: false },
      { nome: "Reparação de hardware",       preco: "Orçamento",  unidade: "avaliação grátis", destaque: false },
    ],
  },
  {
    icon: Network,
    title: "Redes & Tecnologia",
    cor: "bg-gradient-brand text-brand-foreground",
    servicos: [
      { nome: "Configuração de router/Wi-Fi",      preco: "1.500 MZN", unidade: "residencial",    destaque: false },
      { nome: "Instalação de rede empresarial",    preco: "Orçamento", unidade: "sob consulta",   destaque: false },
      { nome: "Cabeamento estruturado",            preco: "200 MZN",   unidade: "por ponto",      destaque: true  },
      { nome: "Extensão de sinal Wi-Fi",           preco: "800 MZN",   unidade: "por repetidor",  destaque: false },
      { nome: "Assistência técnica no local",      preco: "300 MZN",   unidade: "deslocação incl.",destaque: false },
    ],
  },
  {
    icon: Palette,
    title: "Design Gráfico",
    cor: "bg-gradient-gold text-gold-foreground",
    servicos: [
      { nome: "Logotipo / identidade visual",  preco: "1.500 MZN", unidade: "inclui ficheiros", destaque: true  },
      { nome: "Cartão de visita (design)",     preco: "300 MZN",   unidade: "frente e verso",   destaque: false },
      { nome: "Panfleto / flyer A5",           preco: "400 MZN",   unidade: "design + impressão",destaque: false },
      { nome: "Banner digital para redes",     preco: "250 MZN",   unidade: "por peça",         destaque: false },
      { nome: "Edição de documentos / PDF",    preco: "200 MZN",   unidade: "por trabalho",     destaque: false },
    ],
  },
];

function PrecosPage() {
  return (
    <Layout>
      <PageHero
        title="Tabela de Preços"
        subtitle="Preços acessíveis e transparentes. Para trabalhos especiais, solicite orçamento personalizado."
      />

      <section className="container mx-auto px-4 py-12 space-y-10">
        {/* Grid de categorias */}
        <div className="grid lg:grid-cols-2 gap-8">
          {categorias.map(({ icon: Icon, title, cor, servicos }) => (
            <div key={title} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              {/* Category header */}
              <div className={`flex items-center gap-3 px-6 py-4 ${cor}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-base">{title}</h2>
              </div>

              {/* Services list */}
              <div className="divide-y divide-border">
                {servicos.map((s) => (
                  <div
                    key={s.nome}
                    className={`flex items-center justify-between px-6 py-3.5 transition-smooth hover:bg-muted/30 ${s.destaque ? "bg-gold/5" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {s.destaque && <CheckCircle2 className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                      <span className={`text-sm ${s.destaque ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {s.nome}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-sm font-bold ${s.preco === "Orçamento" ? "text-muted-foreground" : "text-brand"}`}>
                        {s.preco}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">{s.unidade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-5">
          <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Preços indicativos — podem variar</p>
            <p className="mt-0.5 text-muted-foreground">
              Os preços podem variar conforme a quantidade, complexidade e materiais usados.
              Trabalhos urgentes podem ter acréscimo. Desconto para encomendas em volume.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-hero p-8 md:p-10 text-brand-foreground text-center shadow-elegant">
          <h3 className="text-xl md:text-2xl font-bold">Precisa de orçamento personalizado?</h3>
          <p className="mt-2 text-brand-foreground/75 text-sm max-w-md mx-auto">
            Para projetos especiais, grandes quantidades ou combinações de serviços, contacte-nos
            diretamente e enviamos orçamento em minutos.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              to="/contactos"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
            >
              Pedir Orçamento
            </Link>
            <a
              href="https://wa.me/258874383621?text=Olá! Gostaria de pedir um orçamento."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 bg-white/10 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-white/20 transition-smooth"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
