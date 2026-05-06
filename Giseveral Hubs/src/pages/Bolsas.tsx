import { useMemo, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SCHOLARSHIPS, NEWS, GUIDES, Scholarship } from "@/data/bolsas";
import {
  GraduationCap, Globe2, Search, Calendar, ExternalLink, Newspaper,
  BookOpen, Sparkles, ArrowRight, MapPin, Languages, Wallet, Bell, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const Bolsas = () => {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [coverage, setCoverage] = useState<string>("all");

  // Recommendation form
  const [recArea, setRecArea] = useState("");
  const [recLevel, setRecLevel] = useState("");
  const [recommended, setRecommended] = useState<Scholarship[] | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(SCHOLARSHIPS.map((s) => s.country))).sort(),
    []
  );

  const filtered = useMemo(() => {
    return SCHOLARSHIPS.filter((s) => {
      if (country !== "all" && s.country !== country) return false;
      if (level !== "all" && s.level !== level) return false;
      if (coverage !== "all" && s.coverage !== coverage) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        return (
          s.title.toLowerCase().includes(t) ||
          s.area.toLowerCase().includes(t) ||
          s.country.toLowerCase().includes(t) ||
          s.institution.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [q, country, level, coverage]);

  const featured = SCHOLARSHIPS.filter((s) => s.featured);

  const handleRecommend = (e: FormEvent) => {
    e.preventDefault();
    const matches = SCHOLARSHIPS.filter((s) => {
      const okLevel = recLevel ? s.level === recLevel : true;
      const okArea = recArea
        ? s.area.toLowerCase().includes(recArea.toLowerCase()) || s.area === "Várias áreas"
        : true;
      return okLevel && okArea;
    });
    setRecommended(matches.slice(0, 4));
    toast.success(`${matches.length} bolsas encontradas para o seu perfil`);
  };

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "");
    if (!email) return;
    toast.success("Inscrito! Receberá alertas das novas bolsas.");
    form.reset();
  };

  // SEO JSON-LD
  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Bolsas de Estudo & Notícias para Estudantes Africanos",
        description:
          "Encontre bolsas de estudo internacionais, notícias educativas e guias práticos para estudar no exterior.",
        inLanguage: "pt",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: SCHOLARSHIPS.slice(0, 8).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.title,
          url: s.applyUrl,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Como conseguir uma bolsa de estudo no estrangeiro?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Procure bolsas adequadas ao seu nível e área, prepare documentos (transcripts, carta de motivação, recomendações) e candidate-se dentro do prazo.",
            },
          },
          {
            "@type": "Question",
            name: "Existem bolsas para estudantes moçambicanos?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Sim. Programas como Chevening, DAAD, Erasmus Mundus, Fulbright, MEXT e Camões aceitam candidatos de Moçambique e outros países africanos.",
            },
          },
        ],
      },
    ],
    []
  );

  return (
    <Layout>
      <SEO
        title="Bolsas de Estudo 2026 e Notícias para Estudantes | Giseveral Hub"
        description="Bolsas de estudo internacionais, notícias educativas e guias para estudar fora. Chevening, DAAD, Erasmus, Fulbright e mais — actualizado em 2026."
        type="website"
        jsonLd={jsonLd}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="container mx-auto container-px py-16 sm:py-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> NOVO · BOLSAS 2026
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-4 text-balance">
              Bolsas de estudo e notícias para estudantes
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-2xl">
              Encontre bolsas internacionais adequadas ao seu perfil. Notícias actualizadas, guias práticos e alertas de prazos — tudo num só lugar.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-2 bg-card text-foreground rounded-2xl p-3 shadow-elegant max-w-2xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Procure por país, área ou universidade..."
                  className="h-12 pl-12 border-0 bg-transparent focus-visible:ring-0 shadow-none"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                <Search className="h-5 w-5" /> Pesquisar bolsas
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4 text-xs opacity-90">
              <span className="font-semibold">Populares:</span>
              {["Chevening", "DAAD", "Erasmus", "Fulbright", "Portugal"].map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(t)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-smooth"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOLSAS EM DESTAQUE */}
      <section className="container mx-auto container-px py-16">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">Bolsas em destaque</h2>
              <p className="text-sm text-muted-foreground">As oportunidades mais procuradas neste momento</p>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.slice(0, 3).map((s) => <ScholarshipCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* FILTROS + LISTA */}
      <section className="container mx-auto container-px pb-16">
        <div className="rounded-2xl bg-card border border-border p-5 shadow-card mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="País" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                <SelectItem value="Mestrado">Mestrado</SelectItem>
                <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                <SelectItem value="Intercâmbio">Intercâmbio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={coverage} onValueChange={setCoverage}>
              <SelectTrigger><SelectValue placeholder="Cobertura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Total e parcial</SelectItem>
                <SelectItem value="Total">Cobertura total</SelectItem>
                <SelectItem value="Parcial">Cobertura parcial</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setCountry("all"); setLevel("all"); setCoverage("all"); setQ(""); }}>
              Limpar filtros
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "bolsa encontrada" : "bolsas encontradas"}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => <ScholarshipCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* RECOMENDAÇÃO */}
      <section className="bg-secondary/50 py-16">
        <div className="container mx-auto container-px">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> ASSISTENTE DE BOLSAS
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">Encontre a bolsa certa para si</h2>
              <p className="text-muted-foreground mb-6">
                Diga-nos a sua área e nível de estudo e mostramos as melhores oportunidades para o seu perfil.
              </p>
              <form onSubmit={handleRecommend} className="rounded-2xl bg-card border border-border p-5 shadow-card space-y-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Área de interesse</label>
                  <Input
                    value={recArea}
                    onChange={(e) => setRecArea(e.target.value)}
                    placeholder="Ex.: Engenharia, Direito, Medicina..."
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Nível pretendido</label>
                  <Select value={recLevel} onValueChange={setRecLevel}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                      <SelectItem value="Mestrado">Mestrado</SelectItem>
                      <SelectItem value="Doutoramento">Doutoramento</SelectItem>
                      <SelectItem value="Intercâmbio">Intercâmbio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" size="lg" className="w-full">
                  <Sparkles className="h-4 w-4" /> Recomendar bolsas
                </Button>
              </form>
            </div>

            <div>
              <h3 className="font-display font-bold text-xl mb-4">
                {recommended ? "Recomendado para si" : "Aguardando o seu perfil..."}
              </h3>
              {recommended ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {recommended.length > 0
                    ? recommended.map((s) => <ScholarshipCard key={s.id} s={s} compact />)
                    : <p className="text-muted-foreground">Nenhuma bolsa correspondente. Tente outra combinação.</p>
                  }
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground bg-card">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-accent" />
                  Preencha o formulário ao lado para ver bolsas personalizadas.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NOTÍCIAS */}
      <section className="container mx-auto container-px py-16">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">Últimas notícias educativas</h2>
              <p className="text-sm text-muted-foreground">Bolsas abertas, prazos urgentes e oportunidades</p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {NEWS.map((n) => (
            <Link
              key={n.id}
              to={`/noticias/${n.id}`}
              className="group block rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth"
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{n.category}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.date).toLocaleDateString("pt-PT")}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-smooth">
                {n.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                Ler mais <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* GUIAS */}
      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto container-px">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-bold mb-3">
              <BookOpen className="h-3.5 w-3.5" /> GUIAS PRÁTICOS
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-2">Aprenda a candidatar-se</h2>
            <p className="text-muted-foreground">Tudo o que precisa saber para conseguir a sua bolsa</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUIDES.map((g) => (
              <article key={g.id} className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover transition-smooth">
                <div className="text-4xl mb-3">{g.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2">{g.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">⏱ {g.readTime} de leitura</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIAS DE SUCESSO */}
      <section className="container mx-auto container-px py-16">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-2">Histórias de sucesso</h2>
          <p className="text-muted-foreground">Estudantes moçambicanos que conquistaram a sua bolsa</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Aline Macuácua", scholarship: "Chevening — UK", quote: "Os guias e alertas ajudaram-me a preparar a candidatura no prazo." },
            { name: "Hélder Sitoe", scholarship: "DAAD — Alemanha", quote: "Recebi recomendações personalizadas que se ajustaram ao meu perfil em engenharia." },
            { name: "Júlia Mucavele", scholarship: "Erasmus Mundus", quote: "Estudo em três países europeus. A plataforma fez toda a diferença." },
          ].map((p) => (
            <div key={p.name} className="rounded-2xl bg-card border border-border p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center font-bold">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.scholarship}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">"{p.quote}"</p>
              <div className="flex items-center gap-1 mt-3 text-success text-sm">
                <CheckCircle2 className="h-4 w-4" /> Bolsa aprovada
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBSCRIÇÃO DE ALERTAS */}
      <section className="container mx-auto container-px pb-20">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center shadow-elegant relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-3">
              <Bell className="h-3.5 w-3.5" /> ALERTAS GRÁTIS
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl mb-2">Não perca nenhuma bolsa</h3>
            <p className="opacity-90 max-w-xl">Receba por email as novas oportunidades e prazos urgentes.</p>
          </div>
          <form onSubmit={handleSubscribe} className="relative flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="h-12 sm:w-72 bg-white/95 text-foreground border-0"
            />
            <Button type="submit" variant="hero" size="lg" className="h-12">
              Inscrever-me <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

const ScholarshipCard = ({ s, compact = false }: { s: Scholarship; compact?: boolean }) => {
  const deadline = new Date(s.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgent = daysLeft >= 0 && daysLeft <= 30;

  return (
    <article className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth">
      <Link to={`/bolsas/${s.id}`} className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 relative block">
        <div className="absolute top-3 right-3 text-3xl">{s.flag}</div>
        <Badge className="bg-accent text-accent-foreground mb-2">{s.level}</Badge>
        <h3 className="font-display font-bold text-lg leading-tight pr-10 group-hover:underline underline-offset-4">{s.title}</h3>
        <p className="text-xs opacity-80 mt-1">{s.institution}</p>
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.country}</span>
          <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {s.coverage}</span>
          <span className="flex items-center gap-1"><Languages className="h-3 w-3" /> {s.language}</span>
          <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> {s.area}</span>
        </div>
        {!compact && (
          <ul className="space-y-1 mb-4 text-xs">
            {s.benefits.slice(0, 3).map((b) => (
              <li key={b} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className={`mt-auto flex items-center justify-between text-xs ${urgent ? "text-destructive" : "text-muted-foreground"}`}>
          <span className="flex items-center gap-1 font-semibold">
            <Calendar className="h-3.5 w-3.5" />
            {deadline.toLocaleDateString("pt-PT")}
            {urgent && daysLeft >= 0 && ` (${daysLeft}d)`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button asChild size="sm" variant="outline">
            <Link to={`/bolsas/${s.id}`}>Ver detalhes</Link>
          </Button>
          <Button asChild size="sm">
            <a href={s.applyUrl} target="_blank" rel="noopener noreferrer">
              Candidatar <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default Bolsas;
