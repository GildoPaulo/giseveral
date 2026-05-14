import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TO_GALLERY_CATEGORIES } from "@/data/gallery-categories";

type ImageRow = { image_url: string; is_cover: boolean | null; step_order: number | null };
type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  gallery_images: ImageRow[] | null;
};

function coverFrom(images: ImageRow[] | null | undefined): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
  const cover = sorted.find((i) => i.is_cover) ?? sorted[sorted.length - 1];
  return cover?.image_url;
}

export function RelatedPortfolioSection({ serviceSlug }: { serviceSlug: string }) {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cats = SERVICE_TO_GALLERY_CATEGORIES[serviceSlug];
    if (!cats?.length) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("gallery_projects")
        .select("id, slug, title, category, gallery_images(image_url, is_cover, step_order)")
        .eq("is_active", true)
        .in("category", cats)
        .order("project_date", { ascending: false })
        .limit(6);
      if (!cancelled) {
        setRows((data as ProjectRow[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceSlug]);

  if (loading || rows.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 max-w-5xl">
      <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">Trabalhos recentes</h2>
      <p className="text-muted-foreground mb-8">
        Projectos do nosso portfólio relacionados com este serviço. Cada trabalho tem contexto e descrição na galeria.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rows.map((p) => {
          const src = coverFrom(p.gallery_images);
          if (!src) return null;
          return (
            <Link
              key={p.id}
              to="/galeria/$slug"
              params={{ slug: p.slug }}
              className="group rounded-xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elegant transition-smooth"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={src}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-brand group-hover:underline">{p.title}</h3>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <Link to="/galeria" className="text-sm font-semibold text-brand hover:underline">
          Ver todos os trabalhos →
        </Link>
      </div>
    </section>
  );
}
