import { useParams, Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNews, NEWS, getScholarship } from "@/data/bolsas";
import { ArrowLeft, Calendar, User, Tag, ArrowRight, GraduationCap, Share2 } from "lucide-react";
import { toast } from "sonner";

const NoticiaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const n = id ? getNews(id) : undefined;

  if (!n) return <Navigate to="/bolsas" replace />;

  const related = NEWS.filter((x) => x.id !== n.id && x.category === n.category).slice(0, 3);
  const linkedScholarship = n.relatedScholarship ? getScholarship(n.relatedScholarship) : undefined;
  const dateStr = new Date(n.date).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.title,
    description: n.excerpt,
    datePublished: n.date,
    dateModified: n.date,
    author: { "@type": "Organization", name: n.author ?? "Giseveral Hub" },
    publisher: {
      "@type": "Organization",
      name: "Giseveral Hub",
      logo: { "@type": "ImageObject", url: "https://lovable.dev/opengraph-image-p98pqg.png" },
    },
    articleSection: n.category,
    keywords: n.tags?.join(", "),
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: n.title, text: n.excerpt, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <Layout>
      <SEO
        title={`${n.title} | Giseveral Hub`}
        description={n.excerpt}
        type="article"
        jsonLd={jsonLd}
      />

      <article className="container mx-auto container-px py-10 max-w-4xl">
        <Link to="/bolsas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar a notícias
        </Link>

        <Badge className="mb-4">{n.category}</Badge>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-5 text-balance leading-tight">
          {n.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6 mb-8">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {dateStr}</span>
          {n.author && <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {n.author}</span>}
          <button onClick={handleShare} className="ml-auto inline-flex items-center gap-1.5 hover:text-primary transition-smooth">
            <Share2 className="h-4 w-4" /> Partilhar
          </button>
        </div>

        <p className="text-lg text-foreground/90 mb-6 leading-relaxed font-medium">{n.excerpt}</p>

        <div className="prose prose-lg max-w-none space-y-5 text-foreground/85 leading-relaxed">
          {n.content?.map((p, i) => (
            <p key={i} className="text-base sm:text-lg">{p}</p>
          ))}
        </div>

        {linkedScholarship && (
          <div className="mt-10 rounded-2xl bg-gradient-hero text-primary-foreground p-6 shadow-elegant">
            <div className="flex items-start gap-4">
              <GraduationCap className="h-8 w-8 text-accent shrink-0" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Bolsa relacionada</p>
                <h3 className="font-display font-bold text-xl mb-2">{linkedScholarship.title}</h3>
                <p className="text-sm opacity-90 mb-4">Veja todos os detalhes, requisitos e processo de candidatura.</p>
                <Button asChild variant="hero" size="sm">
                  <Link to={`/bolsas/${linkedScholarship.id}`}>
                    Ver bolsa completa <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {n.tags && n.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-border">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {n.tags.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        )}
      </article>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container mx-auto container-px pb-16">
          <h2 className="font-display font-bold text-2xl mb-5">Notícias relacionadas</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/noticias/${r.id}`}
                className="group rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth"
              >
                <Badge variant="secondary" className="mb-3">{r.category}</Badge>
                <h3 className="font-display font-bold text-lg group-hover:text-primary transition-smooth mb-2">
                  {r.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default NoticiaDetail;
