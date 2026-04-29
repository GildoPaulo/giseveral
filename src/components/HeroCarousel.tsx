import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import printing from "@/assets/printing.jpg";
import documents from "@/assets/documents.jpg";
import repair from "@/assets/computer-repair.jpg";
import windows from "@/assets/windows-install.jpg";
import technician from "@/assets/technician.jpg";
import router from "@/assets/router.jpg";
import network from "@/assets/network.jpg";
import cabling from "@/assets/blog-cabling.jpg";
import stationery from "@/assets/stationery.jpg";
import design from "@/assets/design.jpg";

type Slide = { img: string; category: string; title: string; to: string };

const slides: Slide[] = [
  { img: printing, category: "Reprografia", title: "Impressão profissional a cores e P&B", to: "/servicos" },
  { img: documents, category: "Reprografia", title: "Documentos, fotocópias e digitalização", to: "/servicos" },
  { img: repair, category: "Informática", title: "Reparação e manutenção de computadores", to: "/informatica" },
  { img: windows, category: "Informática", title: "Instalação de Windows e software", to: "/informatica" },
  { img: technician, category: "Informática", title: "Assistência técnica especializada", to: "/informatica" },
  { img: router, category: "Redes", title: "Configuração de routers e Wi-Fi", to: "/redes" },
  { img: network, category: "Redes", title: "Instalação de redes empresariais", to: "/redes" },
  { img: cabling, category: "Redes", title: "Cabeamento estruturado profissional", to: "/redes" },
  { img: stationery, category: "Papelaria", title: "Material escolar e de escritório", to: "/servicos" },
  { img: design, category: "Design Gráfico", title: "Flyers, cartazes e publicidade", to: "/servicos" },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const id = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-elegant ring-1 ring-border">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <Link
                to={s.to}
                aria-label={`Ver serviços de ${s.category}`}
                className="group block relative aspect-[4/3] md:aspect-[16/10] w-full"
              >
                <img
                  src={s.img}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand/90 via-brand/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <span className="inline-block rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-[10px] md:text-xs font-semibold tracking-wider text-gold uppercase backdrop-blur-sm">
                    {s.category}
                  </span>
                  <h3 className="mt-2 text-base md:text-xl font-bold text-white leading-snug drop-shadow-md">
                    {s.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              selected === i ? "w-6 bg-gold" : "w-1.5 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
