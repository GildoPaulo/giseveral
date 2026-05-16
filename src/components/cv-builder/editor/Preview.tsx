import { useEffect, useRef, useState } from "react";
import { Maximize2, Smartphone } from "lucide-react";
import type { CvData, CvTemplate } from "../types";
import { AzurillPreview } from "../templates/Azurill";
import { BronzorPreview } from "../templates/Bronzor";
import { OnyxPreview } from "../templates/Onyx";
import { DittoPreview } from "../templates/Ditto";
import { PikachuPreview } from "../templates/Pikachu";
import { ModernPreview } from "../templates/Modern";
import { CustomPreview } from "../templates/CustomPreview";
import { A4_HEIGHT } from "../templates/templateStyles";

interface Props {
  template: CvTemplate;
  data: CvData;
  customHtml?: string;
  customCss?: string;
}

const MAP: Record<Exclude<CvTemplate, "custom">, React.ComponentType<{ data: CvData }>> = {
  azurill: AzurillPreview,
  bronzor: BronzorPreview,
  onyx: OnyxPreview,
  ditto: DittoPreview,
  pikachu: PikachuPreview,
  modern: ModernPreview,
};

/** A4 width in CSS px @ 96dpi → 210mm = 794px. */
const A4_WIDTH = 794;

type ViewMode = "a4" | "fit";

export function Preview({ template, data, customHtml, customCss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "fit";
    return (localStorage.getItem("cv-preview-mode") as ViewMode) || "fit";
  });

  useEffect(() => {
    localStorage.setItem("cv-preview-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      // In A4 mode the document keeps its natural 794px and the container scrolls.
      // In Fit mode we scale down to match the available width minus padding.
      setScale(viewMode === "a4" ? 1 : Math.min(1, (w - 48) / A4_WIDTH));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [viewMode]);

  const isCustom = template === "custom";
  const Component = isCustom ? null : (MAP[template as Exclude<CvTemplate, "custom">] ?? MAP.azurill);
  const showScrollX = viewMode === "a4";

  return (
    <div
      ref={containerRef}
      className={`flex-1 ${showScrollX ? "overflow-auto" : "overflow-y-auto overflow-x-hidden"} bg-[#e8eaed] flex flex-col items-center py-8 px-4 relative`}
    >
      {/* View-mode toggle — pinned top-right, floats above the document */}
      <div className="sticky top-0 z-20 self-end flex items-center gap-0.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm p-0.5 -mt-4 mb-2">
        <ModeBtn
          active={viewMode === "fit"}
          onClick={() => setViewMode("fit")}
          icon={<Smartphone size={12} />}
          label="Responsivo"
        />
        <ModeBtn
          active={viewMode === "a4"}
          onClick={() => setViewMode("a4")}
          icon={<Maximize2 size={12} />}
          label="A4 real"
        />
      </div>

      <div
        style={{
          width: A4_WIDTH,
          minHeight: A4_HEIGHT,
          transformOrigin: "top center",
          transform: `scale(${scale})`,
          // Compensate scaled height so following layout doesn't get pushed.
          marginBottom: scale < 1 ? `calc((${scale} - 1) * 100%)` : 0,
          boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
          flexShrink: 0,
        }}
      >
        {isCustom
          ? <CustomPreview data={data} html={customHtml ?? ""} css={customCss} />
          : Component
            ? <Component data={data} />
            : null}
      </div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
      title={label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
