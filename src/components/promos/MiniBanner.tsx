import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { getActiveCampaigns, type Campaign } from "@/lib/campaigns";

export function MiniBanner() {
  const [c, setC] = useState<Campaign | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setC(getActiveCampaigns("mini")[0] ?? null); }, []);

  if (!c || dismissed) return null;

  return (
    <div className="bg-gradient-brand text-brand-foreground">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {c.imageUrl && (
            <img src={c.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover flex-shrink-0" />
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <span className="font-semibold text-sm">{c.title}</span>
            {c.description && (
              <span className="hidden sm:inline text-sm text-brand-foreground/75">— {c.description}</span>
            )}
            {c.newPrice && (
              <span className="inline-flex items-baseline gap-1 flex-shrink-0">
                {c.originalPrice && (
                  <span className="text-xs text-brand-foreground/50 line-through">{c.originalPrice}</span>
                )}
                <span className="font-bold text-gold text-sm">{c.newPrice}</span>
                {c.savingsText && (
                  <span className="text-xs text-gold/80">({c.savingsText})</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {c.ctaText && (
            <a
              href={c.ctaUrl || "/orcamento"}
              className="inline-flex items-center gap-1 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              {c.ctaText} <ArrowRight className="h-3 w-3" />
            </a>
          )}
          <button onClick={() => setDismissed(true)} className="rounded-full p-1 hover:bg-white/20 transition-colors" aria-label="Fechar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
