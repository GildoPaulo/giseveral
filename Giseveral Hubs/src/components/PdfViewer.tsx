import { FileText } from "lucide-react";

interface Props {
  pages?: number;
  title: string;
}

/** Visualizador PDF mock com marca d'água diagonal repetida (simula proteção). */
export const PdfViewer = ({ pages = 4, title }: Props) => {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-secondary/40">
      <div className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4" /> Pré-visualização
        </span>
        <span className="opacity-70">Página 1 de {pages}</span>
      </div>
      <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto space-y-4 bg-muted/40">
        {Array.from({ length: Math.min(pages, 3) }).map((_, i) => (
          <div
            key={i}
            className="relative bg-white shadow-card rounded-md mx-auto w-full max-w-[600px] aspect-[1/1.414] overflow-hidden"
          >
            {/* Mock content lines */}
            <div className="p-8 sm:p-12 space-y-3">
              <div className="h-6 w-3/4 bg-foreground/80 rounded mb-4" />
              <div className="h-3 w-full bg-foreground/15 rounded" />
              <div className="h-3 w-11/12 bg-foreground/15 rounded" />
              <div className="h-3 w-full bg-foreground/15 rounded" />
              <div className="h-3 w-10/12 bg-foreground/15 rounded" />
              <div className="h-3 w-full bg-foreground/15 rounded" />
              <div className="h-3 w-9/12 bg-foreground/15 rounded" />
              <div className="h-3 w-full bg-foreground/15 rounded mt-6" />
              <div className="h-3 w-11/12 bg-foreground/15 rounded" />
              <div className="h-3 w-10/12 bg-foreground/15 rounded" />
              <div className="h-3 w-full bg-foreground/15 rounded" />
              <div className="h-5 w-2/4 bg-foreground/60 rounded mt-8 mb-3" />
              <div className="h-3 w-full bg-foreground/15 rounded" />
              <div className="h-3 w-11/12 bg-foreground/15 rounded" />
              <div className="h-3 w-10/12 bg-foreground/15 rounded" />
            </div>

            {/* Watermark layer */}
            <div className="absolute inset-0 watermark-overlay pointer-events-none" />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="rotate-[-30deg] text-primary/10 font-display font-extrabold text-5xl sm:text-7xl tracking-widest select-none">
                GISEVERAL HUB
              </div>
            </div>
            <div className="absolute bottom-3 right-4 text-[10px] text-primary/40 font-semibold tracking-wider pointer-events-none">
              GISEVERAL HUB · PRÉ-VISUALIZAÇÃO
            </div>
          </div>
        ))}
        {pages > 3 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border">
              + {pages - 3} páginas adicionais — disponíveis após download
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
