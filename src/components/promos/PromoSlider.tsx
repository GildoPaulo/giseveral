import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getActiveCampaigns, type Campaign } from "@/lib/campaigns";

export function PromoSlider() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => { setCampaigns(getActiveCampaigns("slider").slice(0, 3)); }, []);

  useEffect(() => {
    if (campaigns.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % campaigns.length), 5000);
    return () => clearInterval(id);
  }, [campaigns.length, tick]);

  if (campaigns.length === 0) return null;

  const c = campaigns[idx];

  const go = (dir: number) => {
    setIdx((i) => (i + dir + campaigns.length) % campaigns.length);
    setTick((t) => t + 1);
  };

  return (
    <div className="hidden md:block container mx-auto px-4 my-8">
      <div
        className="relative rounded-2xl overflow-hidden h-60 lg:h-72 flex items-end shadow-elegant"
        style={c.imageUrl ? {
          backgroundImage: `linear-gradient(to right,rgba(0,0,0,.78) 0%,rgba(0,0,0,.35) 55%,transparent 100%),url(${c.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        {!c.imageUrl && <div className="absolute inset-0 bg-gradient-hero" />}
        <div className="relative p-8 text-white space-y-2 max-w-lg">
          {c.subtitle && <p className="text-xs font-semibold tracking-widest text-gold uppercase">{c.subtitle}</p>}
          <h3 className="text-2xl font-bold leading-tight">{c.title}</h3>
          {c.description && <p className="text-sm text-white/70 leading-relaxed">{c.description}</p>}
          {(c.originalPrice || c.newPrice) && (
            <div className="flex items-baseline gap-2 flex-wrap">
              {c.originalPrice && <span className="text-base text-white/40 line-through">{c.originalPrice}</span>}
              {c.newPrice && <span className="text-2xl font-bold text-gold">{c.newPrice}</span>}
              {c.savingsText && <span className="text-xs font-bold text-gold bg-gold/20 px-2 py-0.5 rounded-full">{c.savingsText}</span>}
            </div>
          )}
          {c.socialProof && <p className="text-xs text-white/50">{c.socialProof}</p>}
          {c.ctaText && (
            <a
              href={c.ctaUrl || "/orcamento"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity"
            >
              {c.ctaText} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {campaigns.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 p-2 text-white transition-colors z-10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 p-2 text-white transition-colors z-10">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 right-6 flex gap-1.5 z-10">
              {campaigns.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); setTick((t) => t + 1); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-gold" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
