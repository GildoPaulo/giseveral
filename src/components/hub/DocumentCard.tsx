import { Link } from "@tanstack/react-router";
import { Download, Eye, FileText, Crown, Clock } from "lucide-react";
import { DocItem, DOC_CATEGORIES } from "@/data/hub-documents";

interface Props {
  doc: DocItem;
  variant?: "default" | "compact" | "list";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m atrás`;
  return `${Math.floor(months / 12)}a atrás`;
}

export function DocumentCard({ doc, variant = "default" }: Props) {
  const cat = DOC_CATEGORIES.find((c) => c.id === doc.category) ?? { icon: "📄", label: "Documento" };

  if (variant === "list") {
    return (
      <Link
        to="/hub/documento/$id"
        params={{ id: doc.id }}
        className="group flex items-center gap-4 rounded-xl bg-card border border-border px-4 py-3.5 hover:border-brand/30 hover:shadow-card transition-smooth"
      >
        <div
          className="flex-shrink-0 h-12 w-12 rounded-lg grid place-items-center"
          style={{ background: `linear-gradient(135deg, hsl(${doc.cover} 55% 48%), hsl(${doc.cover} 65% 30%))` }}
        >
          <FileText className="h-5 w-5 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-brand transition-smooth truncate">{doc.title}</h3>
            {doc.premium && <Crown className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">por {doc.author} · {cat.icon} {cat.label}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {doc.downloads.toLocaleString()}</span>
          <span className="hidden sm:flex items-center gap-1"><Eye className="h-3 w-3" /> {doc.views.toLocaleString()}</span>
          <span className="hidden md:flex items-center gap-1 text-brand/60 font-medium">{doc.pages} pág</span>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to="/hub/documento/$id"
        params={{ id: doc.id }}
        className="group flex gap-3 rounded-lg bg-card border border-border p-3 hover:border-brand/30 hover:shadow-card transition-smooth"
      >
        <div
          className="flex-shrink-0 h-10 w-10 rounded-md grid place-items-center"
          style={{ background: `linear-gradient(135deg, hsl(${doc.cover} 55% 48%), hsl(${doc.cover} 65% 30%))` }}
        >
          <FileText className="h-4 w-4 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-foreground group-hover:text-brand transition-smooth line-clamp-2 leading-tight">
            {doc.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" /> {doc.downloads.toLocaleString()}</span>
            <span>·</span>
            <span>{doc.pages} pág</span>
          </div>
        </div>
      </Link>
    );
  }

  // default card
  return (
    <Link
      to="/hub/documento/$id"
      params={{ id: doc.id }}
      className="group rounded-xl bg-card border border-border overflow-hidden shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-1 flex flex-col"
    >
      {/* Cover */}
      <div
        className="aspect-[4/3] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${doc.cover} 58% 44%) 0%, hsl(${doc.cover} 70% 26%) 100%)`,
        }}
      >
        {/* Page count icon */}
        <div className="absolute inset-0 grid place-items-center">
          <FileText className="h-16 w-16 text-white/20 group-hover:scale-110 transition-smooth" />
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-md bg-white/95 text-[11px] font-semibold text-brand backdrop-blur-sm shadow-sm">
            {cat.icon} {cat.label}
          </span>
        </div>

        {/* Premium badge */}
        {doc.premium && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-gold text-gold-foreground text-[11px] font-bold shadow-sm">
            <Crown className="h-3 w-3" /> Premium
          </span>
        )}

        {/* Pages badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm">
          {doc.pages} pág
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/10 transition-smooth" />
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-tight text-foreground group-hover:text-brand transition-smooth line-clamp-2 mb-1">
          {doc.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">por {doc.author}</p>

        {/* Description preview */}
        {doc.description && (
          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed">{doc.description}</p>
        )}

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground/80 font-medium">
                #{t}
              </span>
            ))}
            {doc.tags.length > 2 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground/50">+{doc.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> {doc.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {doc.views.toLocaleString()}
            </span>
          </div>
          <span className="flex items-center gap-1 text-[10px] opacity-60">
            <Clock className="h-3 w-3" /> {timeAgo(doc.uploadedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Loading skeleton
export function DocumentCardSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="mt-4 h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}
