import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Anita Mondlane",
    role: "Estudante de Direito",
    university: "UEM — Universidade Eduardo Mondlane",
    initials: "AM",
    text: "Encontrei exames de anos anteriores que mais nenhuma plataforma tinha. Salvou-me na época de avaliações!",
    rating: 5,
  },
  {
    name: "Edson Cossa",
    role: "Estudante de Engenharia",
    university: "UP — Universidade Pedagógica",
    initials: "EC",
    text: "Fiz upload das minhas sebentas e ganhei créditos para baixar outros materiais. Sistema justo e rápido.",
    rating: 5,
  },
  {
    name: "Sandra Macuácua",
    role: "Estudante de Contabilidade",
    university: "ISCAM",
    initials: "SM",
    text: "O botão de impressão directo para a gráfica é genial — recebi o orçamento no WhatsApp em 2 minutos.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="bg-secondary/40 py-16">
      <div className="container mx-auto container-px">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold mb-3">
            <Star className="h-3.5 w-3.5 fill-current" /> O QUE DIZEM SOBRE NÓS
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">
            Estudantes que confiam no Giseveral Hub
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Mais de 12.000 estudantes moçambicanos usam a plataforma todos os meses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              style={{ animationDelay: `${i * 120}ms` }}
              className="relative rounded-2xl bg-card border border-border p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-smooth animate-fade-in"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-accent/25" />
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 mb-5 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                  <div className="text-xs text-primary/70 font-medium">{t.university}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-5">
            Estudantes de todas as universidades de Moçambique
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-70">
            {["UEM", "UP", "ISCAM", "ISCTEM", "UCM", "A Politécnica", "UniLúrio"].map((u) => (
              <span key={u} className="font-display font-bold text-lg text-primary/70">
                {u}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
