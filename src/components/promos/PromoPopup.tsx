import { useState, useEffect } from "react";
import { X, ArrowRight, Package, Tag } from "lucide-react";
import { getActiveCampaigns, type Campaign } from "@/lib/campaigns";

const POPUP_SESSION_KEY = "promo_popup_shown";

export function PromoPopup() {
  const [c, setC] = useState<Campaign | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    if (sessionStorage.getItem(POPUP_SESSION_KEY)) return;
    const list = getActiveCampaigns("popup");
    if (list.length === 0) return;
    setC(list[0]);
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setVisible(false);
    sessionStorage.setItem(POPUP_SESSION_KEY, "1");
  }

  if (!visible || !c) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
        {c.imageUrl ? (
          <div className="aspect-video overflow-hidden">
            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-2 bg-gradient-brand" />
        )}

        <div className="p-6 space-y-3">
          {c.subtitle && <p className="text-xs font-semibold text-gold tracking-widest uppercase">{c.subtitle}</p>}
          <h3 className="text-xl font-bold text-foreground leading-tight">{c.title}</h3>
          {c.description && <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>}

          {(c.originalPrice || c.newPrice) && (
            <div className="flex items-baseline gap-3 flex-wrap">
              {c.originalPrice && <span className="text-lg text-muted-foreground line-through">{c.originalPrice}</span>}
              {c.newPrice && <span className="text-3xl font-bold text-brand">{c.newPrice}</span>}
              {c.savingsText && (
                <span className="rounded-full bg-brand/10 text-brand text-xs font-bold px-2.5 py-0.5">{c.savingsText}</span>
              )}
            </div>
          )}

          {c.urgency === "coupon" && c.urgencyValue && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand/40 bg-brand/5 px-4 py-2.5">
              <Tag className="h-4 w-4 text-brand flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Cupão:</span>
              <span className="font-bold tracking-widest text-brand">{c.urgencyValue}</span>
            </div>
          )}

          {c.urgency === "stock" && c.urgencyValue && (
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Package className="h-4 w-4" /> Restam apenas {c.urgencyValue} unidades!
            </p>
          )}

          {c.socialProof && (
            <p className="text-xs text-muted-foreground">{c.socialProof}</p>
          )}

          {c.ctaText && (
            <a
              href={c.ctaUrl || "/orcamento"}
              onClick={close}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-brand-foreground hover:shadow-elegant transition-shadow"
            >
              {c.ctaText} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <button
          onClick={close}
          className="absolute top-3 right-3 rounded-full bg-black/25 hover:bg-black/45 p-1.5 text-white transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
