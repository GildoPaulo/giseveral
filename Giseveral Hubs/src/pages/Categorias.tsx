import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CATEGORIES, getDocsByCategory } from "@/data/documents";
import { ArrowRight } from "lucide-react";

const Categorias = () => {
  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container mx-auto container-px">
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2">Categorias</h1>
          <p className="opacity-90">Navegue por área de interesse.</p>
        </div>
      </section>

      <section className="container mx-auto container-px py-12">
        <div className="grid sm:grid-cols-2 gap-6">
          {CATEGORIES.map((c) => {
            const count = getDocsByCategory(c.id).length;
            return (
              <Link
                key={c.id}
                to={`/explorar?cat=${c.id}`}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth"
              >
                <div className="absolute -right-6 -top-6 text-9xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-bounce">
                  {c.icon}
                </div>
                <div className="relative">
                  <div className="text-5xl mb-4">{c.icon}</div>
                  <h2 className="font-display font-bold text-2xl mb-2 group-hover:text-primary-glow transition-smooth">{c.label}</h2>
                  <p className="text-muted-foreground mb-4 max-w-md">{c.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    {count} documentos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </Layout>
  );
};

export default Categorias;
