import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, PageHero } from "@/components/Layout";
import { useFavorites, type FavoriteItem } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Award, Newspaper, Package, FileText, LogIn, ExternalLink, Trash2 } from "lucide-react";

export const Route = createFileRoute("/hub/favoritos")({
  head: () => ({
    meta: [
      { title: "Os meus favoritos — Giseveral Hub" },
      { name: "description", content: "Bolsas, notícias e conteúdo que guardou no Giseveral Hub." },
    ],
  }),
  component: HubFavoritosPage,
});

const TYPE_META: Record<FavoriteItem["item_type"], { label: string; Icon: React.ElementType; color: string }> = {
  bolsa:   { label: "Bolsas",   Icon: Award,      color: "text-blue-600" },
  noticia: { label: "Notícias", Icon: Newspaper,   color: "text-brand" },
  produto: { label: "Produtos", Icon: Package,     color: "text-amber-600" },
  exame:   { label: "Exames",   Icon: FileText,    color: "text-purple-600" },
};

function HubFavoritosPage() {
  const { user } = useAuth();
  const { favorites, loading, toggleFavorite } = useFavorites();

  if (!user) {
    return (
      <Layout>
        <PageHero title="Os meus favoritos" subtitle="Bolsas, notícias e conteúdo guardado" />
        <div className="container mx-auto px-4 py-20 max-w-5xl flex flex-col items-center">
          <div className="rounded-2xl bg-card border border-border shadow-card p-10 flex flex-col items-center gap-4 text-center max-w-sm w-full">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-brand">Inicia sessão para guardar favoritos</h2>
            <p className="text-sm text-muted-foreground">Guarda bolsas, notícias e outros conteúdos para aceder rapidamente.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-card hover:shadow-elegant transition-smooth"
            >
              <LogIn className="h-4 w-4" /> Iniciar sessão
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <PageHero title="Os meus favoritos" subtitle="Bolsas, notícias e conteúdo guardado" />
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (favorites.length === 0) {
    return (
      <Layout>
        <PageHero title="Os meus favoritos" subtitle="Bolsas, notícias e conteúdo guardado" />
        <div className="container mx-auto px-4 py-20 max-w-5xl flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold text-brand">Sem favoritos ainda</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Clique no coração nas bolsas e notícias para as guardar aqui.
          </p>
          <Link
            to="/hub/bolsas"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-accent transition-smooth"
          >
            Ver bolsas de estudo
          </Link>
        </div>
      </Layout>
    );
  }

  // Group by item_type
  const types = (["bolsa", "noticia", "produto", "exame"] as FavoriteItem["item_type"][]).filter(
    (t) => favorites.some((f) => f.item_type === t)
  );

  return (
    <Layout>
      <PageHero title="Os meus favoritos" subtitle="Bolsas, notícias e conteúdo guardado" />
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
        {/* Stats line */}
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{favorites.length}</span>{" "}
          {favorites.length === 1 ? "favorito guardado" : "favoritos guardados"}
        </p>

        {types.map((type) => {
          const { label, Icon, color } = TYPE_META[type];
          const group = favorites.filter((f) => f.item_type === type);
          return (
            <section key={type}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`h-5 w-5 ${color}`} />
                <h2 className="text-lg font-bold text-brand">{label}</h2>
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {group.length}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {group.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card shadow-card p-4 hover:shadow-elegant transition-smooth"
                  >
                    <div className={`shrink-0 h-9 w-9 rounded-lg bg-muted flex items-center justify-center`}>
                      <Icon className={`h-4.5 w-4.5 ${color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand truncate">{item.item_title || "Sem título"}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.item_url}</p>
                    </div>

                    {/* External link */}
                    <a
                      href={item.item_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-brand hover:bg-accent transition-smooth"
                      aria-label="Abrir"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    {/* Remove button */}
                    <button
                      onClick={() => toggleFavorite(item.item_type, item.item_id, item.item_title, item.item_url)}
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                      aria-label="Remover favorito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
