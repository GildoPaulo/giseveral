import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel } from "@/data/gallery-categories";
import { ArrowLeft, ExternalLink, Loader2, Share2 } from "lucide-react";

export const Route = createFileRoute("/galeria/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Galeria — ${params.slug} | Giseveral e Services` }],
  }),
  component: GaleriaDetalhePage,
});

type GalleryImage = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  step_order: number | null;
  step_label: string | null;
  is_cover: boolean | null;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  client_testimonial: string | null;
  category: string;
  description: string;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  technologies: string[] | null;
  project_url: string | null;
  project_date: string | null;
  gallery_images: GalleryImage[] | null;
};

function sortedImages(images: GalleryImage[] | null | undefined) {
  if (!images?.length) return [];
  return [...images].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
}

function GaleriaDetalhePage() {
  const { slug } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMissing(false);
      const { data, error } = await supabase
        .from("gallery_projects")
        .select("*, gallery_images(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setMissing(true);
        setProject(null);
      } else {
        setProject(data as Project);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!project?.title) return;
    document.title = `${project.title} — Galeria | Giseveral`;
  }, [project?.title]);

  const [related, setRelated] = useState<
    Pick<Project, "id" | "slug" | "title" | "gallery_images">[]
  >([]);

  useEffect(() => {
    if (!project) return;
    (async () => {
      const { data } = await supabase
        .from("gallery_projects")
        .select("id, slug, title, gallery_images(image_url, is_cover, step_order)")
        .eq("is_active", true)
        .eq("category", project.category)
        .neq("id", project.id)
        .limit(3);
      setRelated((data as typeof related) ?? []);
    })();
  }, [project]);

  if (missing) {
    return (
      <Layout>
        <section className="container mx-auto px-4 py-24 text-center max-w-lg">
          <h1 className="text-2xl font-bold text-brand">Projecto não encontrado</h1>
          <Link
            to="/galeria"
            className="mt-6 inline-block text-sm font-semibold text-brand hover:underline"
          >
            ← Voltar à galeria
          </Link>
        </section>
      </Layout>
    );
  }

  if (loading || !project) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const images = sortedImages(project.gallery_images);
  const cover = images.find((i) => i.is_cover) ?? images[images.length - 1];
  const processImages = images.filter((i) => !i.is_cover || images.length === 1);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const wa = `https://wa.me/258874383621?text=${encodeURIComponent(`Vi o projecto "${project.title}" na vossa galeria: ${shareUrl}`)}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/galeria"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Galeria
        </Link>

        {cover && (
          <div className="relative h-72 md:h-96 rounded-xl overflow-hidden mb-8 bg-muted">
            <img src={cover.image_url} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/45 flex items-end">
              <div className="p-6 md:p-10 w-full">
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  {categoryLabel(project.category)}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">{project.title}</h1>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-muted/40 rounded-xl p-6 grid sm:grid-cols-2 gap-4 text-sm">
              {project.client_name && (
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{project.client_name}</p>
                </div>
              )}
              {project.project_date && (
                <div>
                  <span className="text-muted-foreground">Data</span>
                  <p className="font-medium">{project.project_date}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Categoria</span>
                <p className="font-medium">{categoryLabel(project.category)}</p>
              </div>
              {project.technologies && project.technologies.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Tecnologias / materiais</span>
                  <p className="font-medium">{project.technologies.join(", ")}</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand mb-3">Sobre o projecto</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {project.challenge && (
              <div>
                <h2 className="text-xl font-bold text-brand mb-3">Desafio</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.challenge}
                </p>
              </div>
            )}
            {project.solution && (
              <div>
                <h2 className="text-xl font-bold text-brand mb-3">Solução</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.solution}
                </p>
              </div>
            )}
            {project.results && (
              <div>
                <h2 className="text-xl font-bold text-brand mb-3">Resultados</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.results}
                </p>
              </div>
            )}

            {processImages.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-brand mb-4">Galeria do processo</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {processImages.map((img) => (
                    <figure
                      key={img.id}
                      className="rounded-lg overflow-hidden border border-border bg-card"
                    >
                      <img
                        src={img.image_url}
                        alt={img.title || img.step_label || ""}
                        className="w-full h-40 object-cover"
                      />
                      <figcaption className="p-2 text-xs text-muted-foreground">
                        {img.step_label && (
                          <span className="font-semibold text-foreground">{img.step_label}</span>
                        )}
                        {img.title && img.step_label && " · "}
                        {img.title}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {project.client_testimonial && (
              <div className="rounded-xl p-6 border-l-4 border-gold bg-brand/5">
                <p className="italic text-muted-foreground leading-relaxed">
                  "{project.client_testimonial}"
                </p>
                {project.client_name && (
                  <p className="mt-3 font-semibold text-brand">— {project.client_name}</p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="font-bold text-brand">Partilhar</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </a>
                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver online
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="text-xl font-bold text-brand mb-6">Na mesma categoria</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => {
                const imgs = sortedImages(r.gallery_images as GalleryImage[] | null);
                const c = imgs.find((i) => i.is_cover) ?? imgs[imgs.length - 1];
                if (!c) return null;
                return (
                  <Link
                    key={r.id}
                    to="/galeria/$slug"
                    params={{ slug: r.slug }}
                    className="group rounded-lg overflow-hidden border border-border shadow-card"
                  >
                    <img
                      src={c.image_url}
                      alt={r.title}
                      className="h-36 w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <p className="p-3 text-sm font-semibold text-brand group-hover:underline">
                      {r.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <WhatsAppFab />
    </Layout>
  );
}
