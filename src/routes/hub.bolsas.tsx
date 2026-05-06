import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { SCHOLARSHIPS, HUB_NEWS, HUB_GUIDES, type Scholarship, type NewsItem } from "@/data/hub-bolsas";
import { fetchScholarships, fetchHubNews } from "@/lib/hub";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Globe, Search, Calendar, ExternalLink, Newspaper,
  BookOpen, Sparkles, ArrowRight, Languages, Wallet, Bell, CheckCircle2, MapPin,
} from "lucide-react";

export const Route = createFileRoute("/hub/bolsas")({
  head: () => ({
    meta: [
      { title: "Bolsas de Estudo 2026 — Giseveral Hub" },
      { name: "description", content: "Bolsas de estudo internacionais para estudantes moçambicanos. Chevening, DAAD, Erasmus, Fulbright e mais — actualizado 2026." },
      { property: "og:title", content: "Bolsas de Estudo 2026 — Giseveral Hub" },
    ],
  }),
  component: HubBolsasPage,
});

function HubBolsasPage() {
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>(SCHOLARSHIPS);
  const [allNews, setAllNews] = useState<NewsItem[]>(HUB_NEWS);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [level, setLevel] = useState("all");
  const [coverage, setCoverage] = useState("all");
  const [recArea, setRecArea] = useState("");
  const [recLevel, setRecLevel] = useState("");
  const [recommended, setRecommended] = useState<Scholarship[] | null>(null);

  useEffect(() => {
    fetchScholarships().then(setAllScholarships);
    fetchHubNews().then(setAllNews);
  }, []);

  const countries = useMemo(() => Array.from(new Set(allScholarships.map((s) => s.country))).sort(), [allScholarships]);

  const filtered = useMemo(() => allScholarships.filter((s) => {
    if (country !== "all" && s.country !== country) return false;
    if (level !== "all" && s.level !== level) return false;
    if (coverage !== "all" && s.coverage !== coverage) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      return s.title.toLowerCase().includes(t) || s.area.toLowerCase().includes(t) || s.country.toLowerCase().includes(t) || s.institution.toLowerCase().includes(t);
    }
    return true;
  }), [q, country, level, coverage]);

  const featured = allScholarships.filter((s) => s.featured);

  function handleRecommend(e: FormEvent) {
    e.preventDefault();
    const matches = allScholarships.filter((s) => {
      const okLevel = recLevel ? s.level === recLevel : true;
      const okArea = recArea ? s.area.toLowerCase().includes(recArea.toLowerCase()) || s.area === "Várias áreas" : true;
      return okLevel && okArea;
    });
    setRecommended(matches.slice(0, 4));
    toast.success(`${matches.length} bolsas encontradas para o seu perfil`);
  }

  function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Inscrito! Receberá alertas das novas bolsas.");
    (e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-brand-foreground">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative max-w-5xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> NOVO · BOLSAS 2026
            </div>
            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl mb-4">
              Bolsas de estudo para estudantes
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-2xl">
              Encontre bolsas internacionais adequadas ao seu perfil. Notícias actualizadas, guias práticos e alertas de prazos.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2 bg-card text-foreground rounded-2xl p-3 shadow-elegant max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procure por país, área ou universidade..." className="h-12 pl-12 border-0 bg-transparent focus-visible:ring-0 shadow-none" />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-brand-foreground">
                <Search className="h-4 w-4" /> Pesquisar bolsas
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4 text-xs opacity-90">
              <span className="font-semibold">Populares:</span>
              {["Chevening", "DAAD", "Erasmus", "Fulbright", "Portugal"].map((t) => (
                <button key={t} onClick={() => setQ(t)} className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-smooth">{t}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUE */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-gold-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand">Bolsas em destaque</h2>
              <p className="text-sm text-muted-foreground">As oportunidades mais procuradas neste momento</p>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.slice(0, 3).map((s) => <ScholarshipCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* FILTROS + LISTA */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
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
            <button
              onClick={() => { setCountry("all"); setLevel("all"); setCoverage("all"); setQ(""); }}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              Limpar filtros
            </button>
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
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
                <Sparkles className="h-3.5 w-3.5" /> ASSISTENTE DE BOLSAS
              </div>
              <h2 className="text-3xl font-bold text-brand mb-3">Encontre a bolsa certa para si</h2>
              <p className="text-muted-foreground mb-6">Diga-nos a sua área e nível de estudo e mostramos as melhores oportunidades.</p>
              <form onSubmit={handleRecommend} className="rounded-2xl bg-card border border-border p-5 shadow-card space-y-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Área de interesse</label>
                  <Input value={recArea} onChange={(e) => setRecArea(e.target.value)} placeholder="Ex.: Engenharia, Direito, Medicina..." />
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
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-brand-foreground shadow-card">
                  <Sparkles className="h-4 w-4" /> Recomendar bolsas
                </button>
              </form>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand mb-4">
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
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-gold" />
                  Preencha o formulário ao lado para ver bolsas personalizadas.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NOTÍCIAS */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-foreground">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand">Últimas notícias educativas</h2>
              <p className="text-sm text-muted-foreground">Bolsas abertas, prazos urgentes e oportunidades</p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allNews.map((n) => (
            <Link key={n.id} to="/hub/noticias/$id" params={{ id: n.id }} className="group rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-semibold">{n.category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(n.date).toLocaleDateString("pt-PT")}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-brand group-hover:text-gold transition-smooth">{n.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* GUIAS */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-3">
              <BookOpen className="h-3.5 w-3.5" /> GUIAS PRÁTICOS
            </div>
            <h2 className="text-3xl font-bold text-brand mb-2">Aprenda a candidatar-se</h2>
            <p className="text-muted-foreground">Tudo o que precisa saber para conseguir a sua bolsa</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HUB_GUIDES.map((g) => (
              <Link key={g.id} to={g.link as never} className="rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth block">
                <div className="text-4xl mb-3">{g.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-brand">{g.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">⏱ {g.readTime} de leitura</span>
                  <ArrowRight className="h-4 w-4 text-brand" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIAS DE SUCESSO */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand mb-2">Histórias de sucesso</h2>
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
                <div className="h-12 w-12 rounded-full bg-gradient-hero text-brand-foreground grid place-items-center font-bold">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="font-semibold text-brand">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.scholarship}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">"{p.quote}"</p>
              <div className="flex items-center gap-1 mt-3 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Bolsa aprovada
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBSCRIÇÃO */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="rounded-3xl bg-gradient-hero text-brand-foreground p-8 sm:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center shadow-elegant relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/30 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-3">
              <Bell className="h-3.5 w-3.5" /> ALERTAS GRÁTIS
            </div>
            <h3 className="text-2xl font-bold mb-2">Não perca nenhuma bolsa</h3>
            <p className="opacity-90 max-w-xl">Receba por email as novas oportunidades e prazos urgentes.</p>
          </div>
          <form onSubmit={handleSubscribe} className="relative flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="h-12 sm:w-72 rounded-xl bg-white/95 text-foreground border-0 px-4 outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 h-12 text-sm font-semibold text-gold-foreground shadow-card">
              Inscrever-me <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}

function ScholarshipCard({ s, compact = false }: { s: Scholarship; compact?: boolean }) {
  const deadline = new Date(s.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expired = daysLeft < 0;
  const urgent = !expired && daysLeft <= 30;
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate({ to: "/hub/bolsas/$id", params: { id: s.id } })}
      className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth cursor-pointer"
    >
      <div className={`text-brand-foreground p-5 relative ${expired ? "bg-muted" : "bg-gradient-hero"}`}>
        <div className="absolute top-3 right-3 text-3xl">{s.flag}</div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold mb-2 ${expired ? "bg-muted-foreground/30 text-foreground/60" : "bg-gold text-gold-foreground"}`}>
          {s.level}
        </span>
        <h3 className={`font-bold text-lg leading-tight pr-10 ${expired ? "text-foreground/60" : ""}`}>{s.title}</h3>
        <p className={`text-xs mt-1 ${expired ? "text-muted-foreground" : "opacity-80"}`}>{s.institution}</p>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.country}</span>
          <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {s.coverage}</span>
          <span className="flex items-center gap-1"><Languages className="h-3 w-3" /> {s.language}</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {s.area}</span>
        </div>
        {!compact && (
          <ul className="space-y-1 mb-4 text-xs">
            {s.benefits.slice(0, 3).map((b) => (
              <li key={b} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto mb-3">
          {expired ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3 w-3" /> Prazo encerrado
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
              ${urgent
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"}`}
            >
              <Calendar className="h-3 w-3" />
              {deadline.toLocaleDateString("pt-PT")}
              {urgent && <span className="ml-1 font-bold">({daysLeft}d)</span>}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/hub/bolsas/$id"
            params={{ id: s.id }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-smooth"
          >
            Ver guia
          </Link>
          {expired ? (
            <span className="flex items-center justify-center rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground cursor-default">
              Encerrado
            </span>
          ) : (
            <a
              href={s.applyUrl}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-md bg-gradient-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:shadow-card transition-smooth"
            >
              Candidatar <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
