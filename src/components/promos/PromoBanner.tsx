import { useState, useEffect } from "react";
import { Timer, Package, Tag, Users, ArrowRight } from "lucide-react";
import { getActiveCampaigns, type Campaign } from "@/lib/campaigns";

function pad(n: number) { return String(n).padStart(2, "0"); }

function useCountdown(isoEnd: string) {
  const calc = () => {
    if (!isoEnd) return null;
    const diff = new Date(isoEnd).getTime() - Date.now();
    if (diff <= 0) return null;
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    if (!isoEnd) return;
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [isoEnd]);
  return t;
}

function UrgencyWidget({ c }: { c: Campaign }) {
  const countdown = useCountdown(c.urgency === "timer" ? c.urgencyValue : "");
  if (c.urgency === "timer" && countdown) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Timer className="h-4 w-4 text-gold flex-shrink-0" />
        <span className="text-sm text-white/80">Termina em:</span>
        {[{ v: countdown.h, l: "h" }, { v: countdown.m, l: "m" }, { v: countdown.s, l: "s" }].map(({ v, l }) => (
          <span key={l} className="inline-flex flex-col items-center bg-white/20 rounded-md px-2.5 py-1 min-w-[2.75rem]">
            <span className="text-base font-bold text-white leading-none">{pad(v)}</span>
            <span className="text-[9px] text-white/60 mt-0.5">{l}</span>
          </span>
        ))}
      </div>
    );
  }
  if (c.urgency === "stock") {
    return (
      <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
        <Package className="h-4 w-4" />
        Restam apenas <strong>{c.urgencyValue}</strong> unidades!
      </div>
    );
  }
  if (c.urgency === "coupon") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Tag className="h-4 w-4 text-gold" />
        <span className="text-white/80">Cupão exclusivo:</span>
        <span className="font-bold tracking-widest bg-white/20 border border-white/20 px-3 py-0.5 rounded text-white">{c.urgencyValue}</span>
      </div>
    );
  }
  return null;
}

export function PromoBanner() {
  const [c, setC] = useState<Campaign | null>(null);
  useEffect(() => { setC(getActiveCampaigns("banner")[0] ?? null); }, []);
  if (!c) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={c.imageUrl ? {
        backgroundImage: `linear-gradient(135deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.38) 100%),url(${c.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      {!c.imageUrl && <div className="absolute inset-0 bg-gradient-hero" />}
      <div className="relative container mx-auto px-4 py-16 md:py-24 text-white">
        <div className="max-w-2xl space-y-4">
          {c.subtitle && <p className="text-xs font-semibold tracking-widest text-gold uppercase">{c.subtitle}</p>}
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">{c.title}</h2>
          {c.description && <p className="text-base text-white/75 leading-relaxed">{c.description}</p>}

          {(c.originalPrice || c.newPrice) && (
            <div className="flex items-baseline gap-3 flex-wrap">
              {c.originalPrice && <span className="text-xl text-white/40 line-through">{c.originalPrice}</span>}
              {c.newPrice && <span className="text-4xl font-bold text-gold">{c.newPrice}</span>}
              {c.savingsText && (
                <span className="rounded-full bg-gold/20 border border-gold/30 px-3 py-0.5 text-xs font-bold text-gold">{c.savingsText}</span>
              )}
            </div>
          )}

          {c.urgency !== "none" && <UrgencyWidget c={c} />}

          {c.socialProof && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Users className="h-3.5 w-3.5" />
              <span>{c.socialProof}</span>
            </div>
          )}

          {c.ctaText && (
            <a
              href={c.ctaUrl || "/orcamento"}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-7 py-3.5 text-sm font-bold text-gold-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              {c.ctaText} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
