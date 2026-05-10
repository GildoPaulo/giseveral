import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "giseveral_cookies_consent";

export function CookiesBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border bg-card shadow-elegant p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
            <Cookie className="h-4 w-4 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">Usamos cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usamos cookies essenciais e analytics respeitadores da privacidade (Umami) para melhorar a sua experiência.{" "}
              <Link to="/privacy-policy" className="text-brand hover:underline">
                Saber mais
              </Link>
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={accept}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-smooth hover:shadow-card"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aceitar
              </button>
              <button
                onClick={decline}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-smooth"
              >
                Recusar
              </button>
            </div>
          </div>
          <button
            onClick={decline}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
