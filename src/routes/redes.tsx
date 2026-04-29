import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Wifi, Cable, Router as RouterIcon, Share2, Activity } from "lucide-react";
import network from "@/assets/network.jpg";
import router from "@/assets/router.jpg";

export const Route = createFileRoute("/redes")({
  head: () => ({
    meta: [
      { title: "Redes — Giseveral e Services" },
      { name: "description", content: "Instalação de redes Wi-Fi e LAN, configuração de routers, cabeamento estruturado e diagnóstico." },
    ],
  }),
  component: RedesPage,
});

const services = [
  { icon: Wifi, title: "Redes domésticas e empresariais", desc: "Planeamento e instalação de redes." },
  { icon: RouterIcon, title: "Configuração de routers", desc: "Wi-Fi seguro e otimizado." },
  { icon: Cable, title: "Cabeamento estruturado", desc: "Cabos UTP/RJ45 organizados." },
  { icon: Share2, title: "Partilha de rede", desc: "Recursos partilhados entre equipamentos." },
  { icon: Activity, title: "Diagnóstico de rede", desc: "Resolução rápida de problemas." },
];

function RedesPage() {
  return (
    <Layout>
      <PageHero title="Redes e Internet" subtitle="A sua casa ou empresa sempre conectada." />
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src={router} alt="Router moderno" loading="lazy" className="rounded-xl shadow-card aspect-square object-cover" />
            <img src={network} alt="Cabeamento de rede" loading="lazy" className="rounded-xl shadow-card aspect-square object-cover mt-10" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-brand">Soluções completas em redes</h2>
            <p className="mt-3 text-muted-foreground">Instalação, configuração e manutenção para o seu Wi-Fi e LAN.</p>
            <div className="mt-6 grid gap-3">
              {services.map((s) => (
                <div key={s.title} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground shrink-0">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/contactos" className="mt-8 inline-flex items-center justify-center rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow">
              Solicitar instalação
            </Link>
          </div>
        </div>
      </section>
      <WhatsAppFab />
    </Layout>
  );
}
