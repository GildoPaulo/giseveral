import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useEffect, useState } from "react";
import { X, Calendar, Star, ZoomIn } from "lucide-react";
import printing from "@/assets/printing.jpg";
import repair from "@/assets/computer-repair.jpg";
import network from "@/assets/network.jpg";
import stationery from "@/assets/stationery.jpg";
import design from "@/assets/design.jpg";
import router from "@/assets/router.jpg";
import windows from "@/assets/windows-install.jpg";
import documents from "@/assets/documents.jpg";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria — Giseveral e Services" },
      { name: "description", content: "Portfólio de trabalhos da Giseveral: impressão, reparação de computadores, instalação de redes e mais." },
      { property: "og:title", content: "Galeria de trabalhos — Giseveral e Services" },
      { property: "og:description", content: "Cada serviço realizado é uma prova da nossa qualidade e confiança." },
    ],
  }),
  component: GaleriaPage,
});

type Item = {
  img: string;
  title: string;
  date: string;
  description: string;
  client: string;
  category: string;
};

const items: Item[] = [
  {
    img: documents,
    title: "Impressão de documentos empresariais",
    date: "20/04/2026",
    description: "Impressão de relatórios empresariais em alta qualidade, papel A4 80g e encadernação profissional.",
    client: "Empresa local satisfeita",
    category: "Impressão",
  },
  {
    img: windows,
    title: "Formatação de computador",
    date: "18/04/2026",
    description: "Formatação completa, instalação de Windows e Office, drivers atualizados e otimização do sistema.",
    client: "Cliente particular satisfeito",
    category: "Informática",
  },
  {
    img: router,
    title: "Instalação de rede Wi-Fi",
    date: "15/04/2026",
    description: "Configuração de router e rede doméstica com cobertura total e segurança WPA2.",
    client: "Cliente empresarial satisfeito",
    category: "Redes",
  },
  {
    img: printing,
    title: "Impressão a cores profissional",
    date: "12/04/2026",
    description: "Impressão a cores de brochuras e materiais de marketing com alta definição.",
    client: "Pequena empresa satisfeita",
    category: "Impressão",
  },
  {
    img: repair,
    title: "Reparação de computador",
    date: "10/04/2026",
    description: "Diagnóstico e substituição de componentes, limpeza interna e teste de performance.",
    client: "Cliente particular satisfeito",
    category: "Informática",
  },
  {
    img: network,
    title: "Cabeamento estruturado",
    date: "05/04/2026",
    description: "Instalação de cabeamento de rede em escritório, organização e identificação de pontos.",
    client: "Empresa empresarial satisfeita",
    category: "Redes",
  },
  {
    img: stationery,
    title: "Fornecimento de papelaria",
    date: "02/04/2026",
    description: "Entrega de material escolar e de escritório com preços acessíveis.",
    client: "Cliente escolar satisfeito",
    category: "Papelaria",
  },
  {
    img: design,
    title: "Design gráfico personalizado",
    date: "28/03/2026",
    description: "Criação de cartões de visita e flyers com identidade visual moderna.",
    client: "Empreendedor local satisfeito",
    category: "Design",
  },
];

function GaleriaPage() {
  const [active, setActive] = useState<Item | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <Layout>
      <PageHero
        title="Galeria de trabalhos"
        subtitle="Cada serviço realizado é uma prova da nossa qualidade e confiança."
      />

      <section className="container mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <button
              key={it.title}
              onClick={() => setActive(it)}
              className="group relative overflow-hidden rounded-xl bg-card text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={it.img}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-smooth group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/30 to-transparent opacity-0 group-hover:opacity-100 transition-smooth flex items-end p-5">
                <div className="text-brand-foreground">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold mb-1">
                    <ZoomIn className="h-3.5 w-3.5" /> Ver detalhes
                  </div>
                  <div className="text-base font-bold leading-tight">{it.title}</div>
                </div>
              </div>
              <figcaption className="p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-gold">{it.category}</div>
                <div className="mt-1 text-sm font-semibold text-brand">{it.title}</div>
              </figcaption>
            </button>
          ))}
        </div>

        <p className="mt-12 text-center text-lg italic text-muted-foreground">
          "Cada serviço realizado é uma prova da nossa qualidade e confiança."
        </p>
      </section>

      {/* MODAL */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-fade-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-elegant animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur text-foreground shadow-card hover:bg-card transition-smooth"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={active.img} alt={active.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-6 md:p-8">
              <div className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold uppercase tracking-wider">
                {active.category}
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-brand">{active.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{active.description}</p>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-brand text-brand-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Data</div>
                    <div className="text-sm font-semibold text-brand">{active.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-gold text-gold-foreground">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Cliente</div>
                    <div className="text-sm font-semibold text-brand">{active.client} ⭐</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WhatsAppFab />
    </Layout>
  );
}
