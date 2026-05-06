import { Link } from "react-router-dom";
import { Download, Eye, FileText, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocItem, CATEGORIES } from "@/data/documents";

interface Props {
  doc: DocItem;
}

export const DocumentCard = ({ doc }: Props) => {
  const cat = CATEGORIES.find((c) => c.id === doc.category);
  return (
    <Link
      to={`/documento/${doc.id}`}
      className="group rounded-xl bg-card border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-smooth hover:-translate-y-1 flex flex-col"
    >
      <div
        className="aspect-[4/3] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${doc.cover} 60% 45%) 0%, hsl(${doc.cover} 70% 25%) 100%)`,
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-white/30">
          <FileText className="h-20 w-20 group-hover:scale-110 transition-bounce" />
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-1 rounded-md bg-white/95 text-xs font-semibold text-primary backdrop-blur-sm">
            {cat?.icon} {cat?.label}
          </span>
        </div>
        {doc.premium && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-bold shadow-accent">
            <Crown className="h-3 w-3" /> Premium
          </span>
        )}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/40 text-white text-xs font-medium backdrop-blur-sm">
          {doc.pages} pág
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-semibold text-sm leading-tight text-foreground group-hover:text-primary-glow transition-smooth line-clamp-2 mb-1">
          {doc.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">por {doc.author}</p>
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> {doc.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {doc.views.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
};
