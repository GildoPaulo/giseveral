import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import { EXAMS, type Exam } from "@/data/hub-exams";
import { BookOpen, Search, GraduationCap, FileText, Calendar, Zap } from "lucide-react";

export const Route = createFileRoute("/hub/exames")({
  head: () => ({
    meta: [
      { title: "Exames de Admissão — Giseveral Hub" },
      { name: "description", content: "Exames de admissão das principais universidades de Moçambique. UEM, UP, UCM, ISCTEM — guias, provas anteriores e preparação." },
    ],
  }),
  component: HubExamesPage,
});

const DIFFICULTY_COLOR: Record<string, string> = {
  "Fácil": "bg-emerald-500/15 text-emerald-600",
  "Médio": "bg-amber-500/15 text-amber-700",
  "Difícil": "bg-red-500/15 text-red-600",
};

function ExamCard({ exam }: { exam: Exam }) {
  return (
    <article className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth">
      <div className="bg-gradient-hero text-brand-foreground p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${DIFFICULTY_COLOR[exam.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                {exam.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold text-gold">
                {exam.year}
              </span>
            </div>
            <h3 className="font-bold text-base leading-tight">{exam.title}</h3>
            <p className="text-xs mt-0.5 opacity-75">{exam.institution}</p>
          </div>
          <div className="text-3xl shrink-0">🎯</div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {exam.subjects.map((s) => (
            <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
          ))}
        </div>

        {exam.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            to="/hub/exames/$id"
            params={{ id: exam.id }}
            className="flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-smooth"
          >
            Ver guia
          </Link>
          {exam.registrationUrl && (
            <a
              href={exam.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-md bg-gradient-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:shadow-card transition-smooth"
            >
              Inscrever
            </a>
          )}
          {!exam.registrationUrl && (
            <Link
              to="/hub/exames/$id"
              params={{ id: exam.id }}
              className="flex items-center justify-center gap-1 rounded-md bg-gradient-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:shadow-card transition-smooth"
            >
              Ver detalhes
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function HubExamesPage() {
  const [allExams, setAllExams] = useState<Exam[]>(EXAMS);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    supabase.from("hub_exams").select("*").eq("active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllExams(data.map((d) => ({
            id: d.id, title: d.title, institution: d.institution, course: d.course,
            year: d.year, subjects: d.subjects, difficulty: d.difficulty as Exam["difficulty"],
            description: d.description ?? "", featured: d.featured,
            fileUrl: d.file_url ?? undefined, solutionUrl: d.solution_url ?? undefined,
            allowRegistrations: d.allow_registrations,
            registrationUrl: d.registration_url ?? undefined,
            registrationDeadline: d.registration_deadline ?? undefined,
            registrationFee: d.registration_fee ?? undefined,
          })));
        }
      });
  }, []);

  const featured = allExams.filter((e) => e.featured);
  const filtered = useMemo(() => allExams.filter((e) => {
    if (difficulty !== "all" && e.difficulty !== difficulty) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      return e.title.toLowerCase().includes(t)
        || e.institution.toLowerCase().includes(t)
        || e.course.toLowerCase().includes(t)
        || e.subjects.some((s) => s.toLowerCase().includes(t));
    }
    return true;
  }), [allExams, q, difficulty]);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero text-brand-foreground">
        <div className="container mx-auto px-4 py-14 md:py-20 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-4">
            <GraduationCap className="h-3.5 w-3.5" /> EXAMES DE ADMISSÃO
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Prepare-se para a universidade</h1>
          <p className="text-lg text-brand-foreground/80 max-w-2xl mb-8">
            Guias completos, provas anteriores e preparação passo a passo para os principais exames de admissão em Moçambique.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por universidade, curso ou matéria..."
              className="w-full rounded-xl bg-white/95 text-foreground border-0 pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-foreground outline-none shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center gap-3 overflow-x-auto">
          {["all", "Fácil", "Médio", "Difícil"].map((d) => (
            <button key={d}
              onClick={() => setDifficulty(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${difficulty === d ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-brand"}`}
            >
              {d === "all" ? "Todos os níveis" : d}
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && !q && difficulty === "all" && (
        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-2xl font-bold text-brand mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-gold" /> Exames em destaque
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 3).map((e) => <ExamCard key={e.id} exam={e} />)}
          </div>
        </section>
      )}

      {/* All exams */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        {(q || difficulty !== "all") && (
          <h2 className="text-xl font-bold text-brand mb-6">
            {filtered.length} {filtered.length === 1 ? "exame encontrado" : "exames encontrados"}
          </h2>
        )}
        {!q && difficulty === "all" && (
          <h2 className="text-2xl font-bold text-brand mb-6">Todos os exames</h2>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">Nenhum exame encontrado</p>
            <button onClick={() => { setQ(""); setDifficulty("all"); }} className="mt-3 text-sm text-brand hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((e) => <ExamCard key={e.id} exam={e} />)}
          </div>
        )}
      </section>

      {/* CTA Giseveral */}
      <section className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="rounded-3xl bg-gradient-hero text-brand-foreground p-8 shadow-elegant">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Precisa de ajuda com o exame?</h3>
              <p className="text-brand-foreground/80 text-sm">
                A Giseveral ajuda com impressão de materiais de estudo, simulados e orientação no processo de inscrição.
              </p>
            </div>
            <div className="flex gap-3">
              <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-card hover:shadow-glow transition-smooth"
              >
                WhatsApp
              </a>
              <Link to="/orcamento"
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
              >
                Pedir ajuda
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
