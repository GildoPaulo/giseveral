import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import slide1 from "@/assets/hero-students.jpg";
import slide2 from "@/assets/hero-documents-stack.jpg";
import slide3 from "@/assets/hero-printing.jpg";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  bullets: string[];
  cta: { label: string; to: string };
};

const SLIDES: Slide[] = [
  {
    image: slide1,
    eyebrow: "Comunidade académica",
    title: "Explore milhares de",
    highlight: "documentos académicos",
    description: "Visualize gratuitamente e descarregue com facilidade — tudo num só lugar.",
    bullets: ["Pré-visualização grátis", "Downloads rápidos", "100% moçambicano"],
    cta: { label: "Explorar agora", to: "/explorar" },
  },
  {
    image: slide2,
    eyebrow: "Tudo o que precisa",
    title: "Exames, trabalhos e",
    highlight: "materiais de estudo",
    description: "Encontre rapidamente sebentas, CVs, templates e livros por categoria.",
    bullets: ["Exames", "Trabalhos", "Livros", "Templates"],
    cta: { label: "Ver categorias", to: "/categorias" },
  },
  {
    image: slide3,
    eyebrow: "Gráfica Giseveral",
    title: "Precisa imprimir?",
    highlight: "Faça num clique",
    description: "Envie qualquer documento directamente para a Gráfica Giseveral via WhatsApp.",
    bullets: ["Impressão rápida", "Qualidade profissional", "Orçamento instantâneo"],
    cta: { label: "Imprimir agora", to: "/explorar" },
  },
];

export const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[520px] sm:h-[580px] lg:h-[640px] w-full overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  width={1600}
                  height={900}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />

                <div className="relative z-10 container mx-auto container-px h-full flex items-center">
                  <div className="max-w-2xl text-primary-foreground animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 backdrop-blur-sm text-xs font-semibold mb-5 text-accent-glow">
                      <Sparkles className="h-3.5 w-3.5" />
                      {s.eyebrow}
                    </div>
                    <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-4 text-balance">
                      {s.title}<br />
                      <span className="text-accent">{s.highlight}</span>
                    </h1>
                    <p className="text-lg opacity-95 mb-6 max-w-xl">{s.description}</p>
                    <div className="flex flex-wrap gap-2 mb-7">
                      {s.bullets.map((b) => (
                        <span key={b} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                    <Button asChild variant="hero" size="xl">
                      <Link to={s.cta.to}>{s.cta.label} <ArrowRight className="h-5 w-5" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 rounded-full transition-smooth ${selected === i ? "w-8 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
};
