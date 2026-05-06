import { useState } from "react";
import { FileText, ChevronLeft, ChevronRight, Lock, ZoomIn } from "lucide-react";

interface Props {
  pages?: number;
  title: string;
  previewPages?: number;
}

// Deterministic "lorem" lines derived from the title to make each doc look unique
function mockLines(seed: number, count: number, maxWidth: number[]): number[] {
  const lines: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    lines.push(maxWidth[s % maxWidth.length]);
  }
  return lines;
}

function MockPage({ pageNum, title, total }: { pageNum: number; title: string; total: number }) {
  const seed = title.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + pageNum * 17;
  const bodyWidths = [100, 97, 94, 100, 98, 90, 95, 100, 88, 100, 92, 96];
  const bodyLines = mockLines(seed, 14 + (pageNum % 3), bodyWidths);
  const section2Lines = mockLines(seed + 99, 10, bodyWidths);

  return (
    <div className="relative bg-white shadow-md rounded-sm mx-auto w-full max-w-[540px] aspect-[1/1.414] overflow-hidden flex-shrink-0">
      {/* Page content */}
      <div className="absolute inset-0 p-6 sm:p-10 flex flex-col gap-0 text-[0px]">
        {/* Page header (first page only) */}
        {pageNum === 1 && (
          <>
            <div className="h-5 rounded bg-foreground/75 mb-1" style={{ width: "72%" }} />
            <div className="h-2.5 rounded bg-foreground/25 mb-4 mt-2" style={{ width: "45%" }} />
          </>
        )}

        {/* Section heading */}
        <div className="h-3 rounded bg-foreground/50 mb-3 mt-1" style={{ width: `${38 + (pageNum * 7 % 20)}%` }} />

        {/* Body paragraph */}
        {bodyLines.map((w, i) => (
          <div
            key={`b${i}`}
            className={`rounded bg-foreground/12 ${i % 5 === 4 ? "mb-3 mt-1" : "mb-1.5"}`}
            style={{ height: "8px", width: `${w}%` }}
          />
        ))}

        {/* Second section */}
        <div className="h-3 rounded bg-foreground/45 mt-3 mb-3" style={{ width: `${30 + (seed % 25)}%` }} />
        {section2Lines.map((w, i) => (
          <div
            key={`s${i}`}
            className="rounded bg-foreground/12 mb-1.5"
            style={{ height: "8px", width: `${w}%` }}
          />
        ))}

        {/* Footer */}
        <div className="absolute bottom-4 inset-x-6 sm:inset-x-10 flex items-center justify-between">
          <div className="h-1.5 w-16 rounded bg-foreground/15" />
          <span className="text-[8px] text-foreground/30 font-medium">{pageNum} / {total}</span>
          <div className="h-1.5 w-16 rounded bg-foreground/15" />
        </div>
      </div>

      {/* Stripe pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(45deg,transparent,transparent 48px,rgba(0,0,0,0.012) 48px,rgba(0,0,0,0.012) 96px)",
        }}
      />

      {/* Watermark */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none select-none">
        <span
          className="font-extrabold tracking-widest text-brand/7"
          style={{ fontSize: "clamp(18px,5vw,42px)", transform: "rotate(-30deg)", whiteSpace: "nowrap" }}
        >
          GISEVERAL HUB
        </span>
      </div>

      {/* Corner badge */}
      <div className="absolute bottom-6 right-4 pointer-events-none">
        <span className="text-[8px] text-brand/30 font-bold tracking-wider">PRÉ-VISUALIZAÇÃO</span>
      </div>
    </div>
  );
}

export function PdfViewer({ pages = 1, title, previewPages = 3 }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const visiblePages = Math.min(pages, previewPages);
  const locked = pages > previewPages;

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-brand text-brand-foreground px-4 py-2.5 text-xs">
        <span className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-none">Pré-visualização · {title}</span>
        </span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-80">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded p-0.5 hover:bg-white/20 disabled:opacity-30 transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="tabular-nums">{currentPage} / {pages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(visiblePages, p + 1))}
              disabled={currentPage >= visiblePages}
              className="rounded p-0.5 hover:bg-white/20 disabled:opacity-30 transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="opacity-60"><ZoomIn className="h-3.5 w-3.5" /></span>
        </div>
      </div>

      {/* Pages */}
      <div className="bg-muted/30 p-4 sm:p-6 space-y-4 max-h-[640px] overflow-y-auto">
        {Array.from({ length: visiblePages }).map((_, i) => (
          <MockPage key={i} pageNum={i + 1} title={title} total={pages} />
        ))}

        {locked && (
          <div className="relative mx-auto w-full max-w-[540px]">
            {/* Blurred next page hint */}
            <div className="rounded-sm overflow-hidden" style={{ filter: "blur(6px)", opacity: 0.4, pointerEvents: "none" }}>
              <MockPage pageNum={visiblePages + 1} title={title} total={pages} />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm rounded-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 border border-brand/20">
                <Lock className="h-5 w-5 text-brand" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                + {pages - visiblePages} página{pages - visiblePages !== 1 ? "s" : ""} bloqueadas
              </p>
              <p className="text-xs text-muted-foreground">Descarregue para aceder ao documento completo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
