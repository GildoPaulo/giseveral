import { useParams, Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getScholarship, SCHOLARSHIPS } from "@/data/bolsas";
import {
  ArrowLeft, Calendar, MapPin, Languages, Wallet, Globe2, ExternalLink,
  CheckCircle2, BookOpen, ListChecks, FileText, Lightbulb, Building2, ArrowRight,
} from "lucide-react";

const BolsaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const s = id ? getScholarship(id) : undefined;

  if (!s) return <Navigate to="/bolsas" replace />;

  const deadline = new Date(s.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgent = daysLeft >= 0 && daysLeft <= 30;
  const expired = daysLeft < 0;

  const related = SCHOLARSHIPS.filter((x) => x.id !== s.id && (x.country === s.country || x.level === s.level)).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalProgram",
      name: s.title,
      description: s.description ?? s.title,
      provider: { "@type": "Organization", name: s.institution },
      educationalLevel: s.level,
      inLanguage: s.language,
      applicationDeadline: s.deadline,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: "/" },
        { "@type": "ListItem", position: 2, name: "Bolsas", item: "/bolsas" },
        { "@type": "ListItem", position: 3, name: s.title },
      ],
    },
  ];

  return (
    <Layout>
      <SEO
        title={`${s.title} — Como candidatar-se | Giseveral Hub`}
        description={(s.description ?? s.title).slice(0, 160)}
        type="article"
        jsonLd={jsonLd}
      />

      {/* HERO */}
      <section className="bg-gradient-hero text-primary-foreground py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="container mx-auto container-px relative">
          <Link to="/bolsas" className="inline-flex items-center gap-1 text-sm opacity-90 hover:opacity-100 mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar às bolsas
          </Link>
          <div className="flex items-start gap-4 mb-4">
            <div className="text-6xl">{s.flag}</div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-accent text-accent-foreground">{s.level}</Badge>
                <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-0">{s.coverage}</Badge>
                {expired ? (
                  <Badge variant="destructive">Encerrada</Badge>
                ) : urgent ? (
                  <Badge variant="destructive">Termina em {daysLeft}d</Badge>
                ) : null}
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3 text-balance">
                {s.title}
              </h1>
              <p className="text-base opacity-90 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {s.institution}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild variant="hero" size="lg" className="font-bold">
              <a href={s.applyUrl} target="_blank" rel="noopener noreferrer">
                Candidatar-se agora <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/bolsas">Ver mais bolsas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* QUICK FACTS */}
      <section className="container mx-auto container-px -mt-8 relative z-10 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl bg-card border border-border p-5 shadow-card">
          <Fact icon={<MapPin className="h-4 w-4" />} label="País" value={s.country} />
          <Fact icon={<Globe2 className="h-4 w-4" />} label="Área" value={s.area} />
          <Fact icon={<Languages className="h-4 w-4" />} label="Idioma" value={s.language} />
          <Fact icon={<Calendar className="h-4 w-4" />} label="Prazo" value={deadline.toLocaleDateString("pt-PT")} highlight={urgent} />
        </div>
      </section>

      {/* CONTENT */}
      <section className="container mx-auto container-px pb-16">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div className="space-y-10">
            {s.description && (
              <Block icon={<BookOpen className="h-5 w-5" />} title="Sobre a bolsa">
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </Block>
            )}

            <Block icon={<CheckCircle2 className="h-5 w-5 text-success" />} title="Benefícios">
              <ul className="grid sm:grid-cols-2 gap-2">
                {s.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block icon={<ListChecks className="h-5 w-5" />} title="Requisitos">
              <ul className="space-y-2">
                {s.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Block>

            {s.process && (
              <Block icon={<ArrowRight className="h-5 w-5" />} title="Processo de candidatura">
                <ol className="space-y-3">
                  {s.process.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{i + 1}</span>
                      <span className="text-sm pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </Block>
            )}

            {s.documents && (
              <Block icon={<FileText className="h-5 w-5" />} title="Documentos necessários">
                <ul className="grid sm:grid-cols-2 gap-2">
                  {s.documents.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {s.tips && (
              <Block icon={<Lightbulb className="h-5 w-5 text-accent" />} title="Dicas para sucesso">
                <ul className="space-y-2">
                  {s.tips.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-5 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 shadow-elegant">
              <Wallet className="h-7 w-7 mb-2 text-accent" />
              <h3 className="font-display font-bold text-lg mb-1">Pronto para candidatar-se?</h3>
              <p className="text-sm opacity-90 mb-4">Aceda ao portal oficial e inicie hoje a sua candidatura.</p>
              <Button asChild variant="hero" size="lg" className="w-full font-bold">
                <a href={s.applyUrl} target="_blank" rel="noopener noreferrer">
                  Ir para o site oficial <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {related.length > 0 && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
                <h3 className="font-display font-bold mb-3">Bolsas semelhantes</h3>
                <div className="space-y-2">
                  {related.map((r) => (
                    <Link key={r.id} to={`/bolsas/${r.id}`} className="block p-3 rounded-lg hover:bg-secondary transition-smooth">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-lg">{r.flag}</span>
                        <span className="line-clamp-1">{r.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{r.country} · {r.level}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </Layout>
  );
};

const Fact = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon} {label}</div>
    <div className={`font-semibold text-sm ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</div>
  </div>
);

const Block = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <article className="rounded-2xl bg-card border border-border p-6 shadow-card">
    <h2 className="font-display font-bold text-xl flex items-center gap-2 mb-4">{icon} {title}</h2>
    {children}
  </article>
);

export default BolsaDetail;
