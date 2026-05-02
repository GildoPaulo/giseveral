import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Printer, BookOpen, Palette, Laptop, Network, ArrowRight, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Giseveral e Services | Beira, Moçambique" },
      { name: "description", content: "Reprografia, papelaria, design gráfico, assistência informática e redes na Beira. Conheça todos os serviços profissionais da Giseveral e Services." },
      { name: "keywords", content: "serviços Beira, reprografia Beira, informática Beira, redes Wi-Fi Beira, design gráfico Beira, papelaria Beira" },
    ],
  }),
  component: ServicosPage,
});

const categorias = [
  {
    slug: "reprografia",
    icon: Printer,
    title: "Reprografia",
    subtitle: "Impressão, fotocópias, digitalização e encadernação",
    items: ["Impressão a cores e preto e branco", "Fotocópias rápidas", "Digitalização de documentos", "Encadernação e plastificação"],
    badge: "Mais popular",
  },
  {
    slug: "papelaria",
    icon: BookOpen,
    title: "Papelaria",
    subtitle: "Material escolar e de escritório completo",
    items: ["Material escolar e cadernos", "Material de escritório", "Pastas, canetas e estojos", "Resmas de papel e blocos"],
    badge: null,
  },
  {
    slug: "design-grafico",
    icon: Palette,
    title: "Design Gráfico",
    subtitle: "Criamos a identidade visual da tua marca",
    items: ["Flyers e panfletos", "Cartazes e banners", "Logos e identidade visual", "Convites personalizados"],
    badge: null,
  },
  {
    slug: "informatica",
    icon: Laptop,
    title: "Assistência Informática",
    subtitle: "Formatação, Windows, vírus e reparação",
    items: ["Formatação de computadores", "Instalação de Windows e programas", "Remoção de vírus e malware", "Optimização e upgrade"],
    badge: null,
  },
  {
    slug: "redes",
    icon: Network,
    title: "Redes e Tecnologia",
    subtitle: "Internet, Wi-Fi, cabeamento e routers",
    items: ["Instalação de Wi-Fi e LAN", "Configuração de routers", "Cabeamento estruturado", "Diagnóstico de rede"],
    badge: null,
  },
];

function ServicosPage() {
  return (
    <Layout>
      <PageHero
        title="Os nossos serviços"
        subtitle="Soluções completas em reprografia, papelaria, design, informática e redes na Beira."
      />

      {/* Service cards grid */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6">
          {categorias.map((cat) => (
            <Link
              key={cat.slug}
              to="/servicos/$slug"
              params={{ slug: cat.slug }}
              className="group relative rounded-2xl border border-border bg-card shadow-card overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-1"
            >
              {/* Brand accent bar */}
              <div className="h-1 w-full bg-gradient-brand" />

              {cat.badge && (
                <span className="absolute top-5 right-4 rounded-full bg-gold text-gold-foreground text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                  {cat.badge}
                </span>
              )}

              <div className="p-6">
                {/* Icon + title */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-card transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-brand">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{cat.subtitle}</p>
                  </div>
                </div>

                {/* Sub-items */}
                <ul className="mt-5 space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-6">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-card group-hover:bg-gradient-gold group-hover:shadow-glow transition-smooth">
                    Ver detalhes e preços <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Contact card (fills last col on odd count) */}
          <div className="rounded-2xl bg-gradient-hero text-brand-foreground p-6 flex flex-col justify-between shadow-elegant">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Precisa de ajuda?</p>
              <h3 className="text-2xl font-bold">Fala connosco</h3>
              <p className="mt-2 text-brand-foreground/80 text-sm">
                Não encontraste o que procuras? Contacta-nos directamente — temos solução para o teu problema.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <a
                href="https://wa.me/258874383621"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white w-full justify-center hover:opacity-90 transition-smooth"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp 874 383 621
              </a>
              <Link
                to="/contactos"
                className="flex items-center gap-2 rounded-lg border border-brand-foreground/30 px-4 py-2.5 text-sm font-semibold text-brand-foreground w-full justify-center hover:bg-brand-foreground/10 transition-smooth"
              >
                Ver página de contactos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-muted/40 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              { num: "10+", label: "Anos de experiência" },
              { num: "500+", label: "Clientes satisfeitos" },
              { num: "1 dia", label: "Entrega rápida" },
              { num: "📍", label: "Beira, Esturro • Rua Alfredo Lawley" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-2xl font-bold text-brand">{stat.num}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
