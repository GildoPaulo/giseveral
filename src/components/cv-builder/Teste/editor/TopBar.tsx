import { ArrowLeft, Download, Loader2, Palette, Type } from "lucide-react";
import type { CvDesign, CvTemplate } from "../types";
import { TEMPLATE_META } from "../types";

interface Props {
  template: CvTemplate;
  design: CvDesign;
  exporting: boolean;
  onBack: () => void;
  onDesignChange: (d: Partial<CvDesign>) => void;
  onExport: () => void;
  customTemplateName?: string;
}

const FONTS = ["Inter", "Georgia", "Times New Roman", "Arial", "Helvetica", "Verdana", "Trebuchet MS", "Courier New"];

export function TopBar({ template, design, exporting, onBack, onDesignChange, onExport, customTemplateName }: Props) {
  const meta = TEMPLATE_META.find(t => t.id === template);

  return (
    <div className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0 z-10">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        <span className="hidden sm:inline">Galeria</span>
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-sm border border-border/50 shrink-0"
          style={{ background: meta?.accent }}
        />
        <span className="text-sm font-semibold">{customTemplateName ?? meta?.label ?? template}</span>
      </div>

      <div className="flex-1" />

      {/* Font selector and size */}
      <div className="flex items-center gap-2">
        <Type size={14} className="text-muted-foreground" />
        <select
          value={design.fontFamily}
          onChange={e => onDesignChange({ fontFamily: e.target.value })}
          className="text-xs bg-muted border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {FONTS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          type="range"
          min="8"
          max="16"
          value={design.fontSize}
          onChange={e => onDesignChange({ fontSize: parseInt(e.target.value) })}
          className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
          title="Tamanho da letra"
        />
        <span className="text-xs text-muted-foreground w-6 text-right">{design.fontSize}pt</span>
      </div>

      {/* Color pickers */}
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-muted-foreground" />
        <label className="flex items-center gap-1 cursor-pointer" title="Cor principal">
          <span className="text-xs text-muted-foreground hidden lg:inline">Cor</span>
          <span
            className="w-6 h-6 rounded border border-border overflow-hidden block"
            style={{ background: design.primaryColor }}
          >
            <input
              type="color"
              value={design.primaryColor}
              onChange={e => onDesignChange({ primaryColor: e.target.value })}
              className="w-8 h-8 opacity-0 cursor-pointer -m-1"
            />
          </span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer" title="Cor do texto">
          <span className="text-xs text-muted-foreground hidden lg:inline">Texto</span>
          <span
            className="w-6 h-6 rounded border border-border overflow-hidden block"
            style={{ background: design.textColor }}
          >
            <input
              type="color"
              value={design.textColor}
              onChange={e => onDesignChange({ textColor: e.target.value })}
              className="w-8 h-8 opacity-0 cursor-pointer -m-1"
            />
          </span>
        </label>
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        type="button"
        onClick={onExport}
        disabled={exporting}
        className="flex items-center gap-2 px-3 py-1.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-60"
      >
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        PDF
      </button>
    </div>
  );
}
