import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen, Pen, FolderOpen, GraduationCap, FileText,
  Printer, Laptop, Wifi, Palette, ArrowRight, ShoppingBag,
  Star, Truck, Shield, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, PageHero } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/loja/")({
  head: () => ({
    meta: [
      { title: "Loja – Giseveral e Services" },
      { name: "description", content: "Compre produtos de papelaria e peça serviços de impressão, informática e redes. Entrega ao domicílio na Beira." },
    ],
  }),
  component: LojaIndex,
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Pen, FolderOpen, GraduationCap, FileText,
  Printer, Laptop, Wifi, Palette,
};

type Product = Tables<"products"> & {
  product_categories: { name: string; slug: string } | null;
};

function LojaIndex() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setFeatured((data as Product[]) ?? []));
  }, []);

  const handleAdd = (p: Product) => {
    addItem({
      id: p.id,
      type: "produto",
      productId: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      brand: p.brand ?? undefined,
      image: p.image_url ?? undefined,
    });
    toast.success(`"${p.name}" adicionado ao carrinho`);
  };

  const productCategories = [
    { slug: "cadernos", icon: "BookOpen", label: "Cadernos" },
    { slug: "canetas-lapis", icon: "Pen", label: "Canetas e Lápis" },
    { slug: "pastas-arquivos", icon: "FolderOpen", label: "Pastas" },
    { slug: "material-escolar", icon: "GraduationCap", label: "Material Escolar" },
    { slug: "papel-blocos", icon: "FileText", label: "Papel e Blocos" },
  ];

  const serviceCategories = [
    { slug: "impressao", icon: "Printer", label: "Impressão", price: "A partir de 5 MZN/pág" },
    { slug: "formatacao-pc", icon: "Laptop", label: "Formatação PC", price: "A partir de 500 MZN" },
    { slug: "redes-wifi", icon: "Wifi", label: "Redes e Wi-Fi", price: "A partir de 1.500 MZN" },
    { slug: "design-grafico", icon: "Palette", label: "Design Gráfico", price: "A partir de 300 MZN" },
  ];

  return (
    <Layout>
      <PageHero
        title="Loja Giseveral"
        subtitle="Compre produtos de papelaria, peça serviços e receba tudo com rapidez na Beira."
      />

      {/* Benefits bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            {[
              { icon: Truck, text: "Entrega ao domicílio" },
              { icon: Shield, text: "Produtos de qualidade" },
              { icon: Clock, text: "Serviço rápido" },
              { icon: Star, text: "Clientes satisfeitos" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 justify-center">
                <Icon className="h-4 w-4 text-gold" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand">Papelaria</h2>
          <Link
            to="/loja/papelaria"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand/80"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {productCategories.map(({ slug, icon, label }) => {
            const Icon = iconMap[icon];
            return (
              <Link
                key={slug}
                to="/loja/papelaria"
                search={{ categoria: slug }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-smooth hover:-translate-y-1 hover:border-gold/50 hover:shadow-elegant"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  {Icon && <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand">Novidades em Destaque</h2>
              <Link
                to="/loja/papelaria"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand/80"
              >
                Ver tudo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-xl border border-border bg-card shadow-card transition-smooth hover:shadow-elegant"
                >
                  <div className="aspect-square overflow-hidden rounded-t-xl bg-muted flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-4">
                    {p.product_categories && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                        {p.product_categories.name}
                      </span>
                    )}
                    <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2">{p.name}</h3>
                    {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-brand">
                        {p.price.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.stock > 5 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {p.stock > 5 ? "Em stock" : p.stock > 0 ? "Pouco stock" : "Esgotado"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={p.stock === 0}
                      className="mt-3 w-full rounded-md bg-gradient-brand py-2 text-xs font-semibold text-brand-foreground transition-smooth hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-brand mb-6">Serviços Disponíveis</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceCategories.map(({ slug, icon, label, price }) => {
            const Icon = iconMap[icon];
            return (
              <Link
                key={slug}
                to="/loja/papelaria"
                search={{ tipo: "servico", categoria: slug }}
                className="group rounded-xl border border-border bg-card p-6 transition-smooth hover:-translate-y-1 hover:shadow-elegant hover:border-gold/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground transition-smooth group-hover:bg-gradient-gold group-hover:text-gold-foreground">
                  {Icon && <Icon className="h-6 w-6" />}
                </div>
                <h3 className="mt-4 font-semibold text-brand">{label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{price}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
                  Pedir serviço <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA delivery */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-gradient-hero p-8 text-brand-foreground flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Entrega ao Domicílio na Beira</h2>
            <p className="mt-2 text-brand-foreground/75 text-sm">
              Receba os seus produtos em casa. Tempo estimado: 30 min a 2 horas conforme a zona.
            </p>
          </div>
          <Link
            to="/loja/papelaria"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card whitespace-nowrap hover:shadow-glow"
          >
            <ShoppingBag className="h-4 w-4" /> Começar a Comprar
          </Link>
        </div>
      </section>
    </Layout>
  );
}
