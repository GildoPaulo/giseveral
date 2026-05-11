import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  Printer, BookOpen, Palette, Laptop, Network, ArrowRight, MessageCircle, Map,
  Wrench, Camera, Cpu, Phone, FileText, ShoppingBag, Monitor, Wifi, Globe, Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/servicos/")({
  head: () => ({
    meta: [
      { title: "Serviços — Giseveral e Services | Beira, Moçambique" },
      { name: "description", content: "Reprografia, papelaria, design gráfico, assistência informática e redes na Beira. Conheça todos os serviços profissionais da Giseveral e Services." },
      { name: "keywords", content: "serviços Beira, reprografia Beira, informática Beira, redes Wi-Fi Beira, design gráfico Beira, papelaria Beira" },
    ],
  }),
  component: ServicosPage,
});

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon_name: string;
  price_from: string;
  features: string[];
  badge: string | null;
  active: boolean;
  sort_order: number;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  printer: Printer,
  "book-open": BookOpen,
  palette: Palette,
  laptop: Laptop,
  network: Network,
  wrench: Wrench,
  camera: Camera,
  cpu: Cpu,
  phone: Phone,
  "file-text": FileText,
  "shopping-bag": ShoppingBag,
  monitor: Monitor,
  wifi: Wifi,
  globe: Globe,
  settings: Settings,
};

// Fallback static data if Supabase returns nothing
const FALLBACK: ServiceRow[] = [
  { id: "1", slug: "reprografia", title: "Reprografia", subtitle: "Impressão, fotocópias e digitalização", icon_name: "printer", price_from: "3 MZN/pág", features: ["Impressão a cores e preto e branco", "Fotocópias rápidas", "Digitalização de documentos", "Encadernação e plastificação"], badge: "Mais popular", active: true, sort_order: 1 },
  { id: "2", slug: "papelaria", title: "Papelaria", subtitle: "Material escolar e de escritório completo", icon_name: "book-open", price_from: "55 MZN", features: ["Material escolar e cadernos", "Material de escritório", "Pastas, canetas e estojos", "Resmas de papel e blocos"], badge: null, active: true, sort_order: 2 },
  { id: "3", slug: "design-grafico", title: "Design Gráfico", subtitle: "Criamos a identidade visual da tua marca", icon_name: "palette", price_from: "400 MZN", features: ["Flyers e panfletos", "Cartazes e banners", "Logos e identidade visual", "Convites personalizados"], badge: null, active: true, sort_order: 3 },
  { id: "4", slug: "informatica", title: "Assistência Informática", subtitle: "Formatação, Windows, vírus e reparação", icon_name: "laptop", price_from: "300 MZN", features: ["Formatação de computadores", "Instalação de Windows e programas", "Remoção de vírus e malware", "Optimização e upgrade"], badge: null, active: true, sort_order: 4 },
  { id: "5", slug: "redes", title: "Redes e Tecnologia", subtitle: "Internet, Wi-Fi, cabeamento e routers", icon_name: "network", price_from: "400 MZN", features: ["Instalação de Wi-Fi e LAN", "Configuração de routers", "Cabeamento estruturado", "Diagnóstico de rede"], badge: null, active: true, sort_order: 5 },
];

function ServicosPage() {
  const [services, setServices] = useState<ServiceRow[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("services" as never)
      .select("id,slug,title,subtitle,icon_name,price_from,features,badge,active,sort_order")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && (data as ServiceRow[]).length > 0) {
          setServices(data as ServiceRow[]);
        }
      });
  }, []);

  return (
    <Layout>
      <PageHero
        title="Os nossos serviços"
        subtitle="Soluções completas em reprografia, papelaria, design, informática e redes na Beira."
      />

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((svc) => {
            const Icon = ICON_MAP[svc.icon_name] ?? Wrench;
            return (
              <Link
                key={svc.id}
                to="/servicos/$slug"
                params={{ slug: svc.slug }}
                className="group relative rounded-2xl border border-border bg-card shadow-card overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-1"
              >
                <div className="h-1 w-full bg-gradient-brand" />

                {svc.badge && (
                  <span className="absolute top-5 right-4 rounded-full bg-gold text-gold-foreground text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                    {svc.badge}
                  </span>
                )}

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-card transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-brand">{svc.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{svc.subtitle}</p>
                      {svc.price_from && (
                        <p className="text-xs font-semibold text-gold mt-1">a partir de {svc.price_from}</p>
                      )}
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2">
                    {svc.features.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-card group-hover:bg-gradient-gold group-hover:shadow-glow transition-smooth">
                      Ver detalhes e preços <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

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

      <section className="bg-muted/40 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              { num: "10+", label: "Anos de experiência" },
              { num: "500+", label: "Clientes satisfeitos" },
              { num: "1 dia", label: "Entrega rápida" },
              { icon: Map, label: "Beira, Esturro • Rua Alfredo Lawley" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                {"icon" in stat
                  ? <stat.icon className="h-7 w-7 text-brand mx-auto" />
                  : <p className="text-2xl font-bold text-brand">{stat.num}</p>
                }
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
