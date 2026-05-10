import { useEffect, useRef, useState } from "react";
import type { CvData, CvTemplate } from "../types";
import { AzurillPreview } from "../templates/Azurill";
import { BronzorPreview } from "../templates/Bronzor";
import { OnyxPreview } from "../templates/Onyx";
import { DittoPreview } from "../templates/Ditto";
import { PikachuPreview } from "../templates/Pikachu";
import { ModernPreview } from "../templates/Modern";

interface Props {
  template: CvTemplate;
  data: CvData;
}

const MAP: Record<CvTemplate, React.ComponentType<{ data: CvData }>> = {
  azurill: AzurillPreview,
  bronzor: BronzorPreview,
  onyx: OnyxPreview,
  ditto: DittoPreview,
  pikachu: PikachuPreview,
  modern: ModernPreview,
};

const A4_WIDTH = 794;

export function Preview({ template, data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(Math.min(1, (w - 48) / A4_WIDTH));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Component = MAP[template] ?? MAP.azurill;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[#e8eaed] flex flex-col items-center py-8 px-4"
    >
      <div
        style={{
          width: A4_WIDTH,
          transformOrigin: "top center",
          transform: `scale(${scale})`,
          marginBottom: scale < 1 ? `calc((${scale} - 1) * 100%)` : 0,
          boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
        }}
      >
        <Component data={data} />
      </div>
    </div>
  );
}
