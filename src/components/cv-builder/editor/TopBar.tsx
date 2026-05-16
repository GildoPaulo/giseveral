import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Download, Loader2, Palette, Type, CaseSensitive,
  ChevronDown, FileText, FileType, FileCode, FileDown,
} from "lucide-react";
import type { CvDesign, CvTemplate } from "../types";
import { TEMPLATE_META, FONT_SIZE_OPTIONS } from "../types";

interface Props {
  template: CvTemplate;
  design: CvDesign;
  exporting: boolean;
  onBack: () => void;
  onDesignChange: (d: Partial<CvDesign>) => void;
  onExport: () => void;
  onExportDoc?: () => void;
  onExportRtf?: () => void;
  onExportHtml?: () => void;
  onExportTxt?: () => void;
  customTemplateName?: string;
}

const FONTS = ["Inter", "Georgia", "Times New Roman", "Arial", "Helvetica", "Verdana", "Trebuchet MS", "Courier New"];

export function TopBar({
  template, design, exporting, onBack, onDesignChange, onExport,
  onExportDoc, onExportRtf, onExportHtml, onExportTxt, customTemplateName,
}: Props) {
  const meta = TEMPLATE_META.find(t => t.id === template);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

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

      {/* Font family */}
      <div className="flex items-center gap-2" title="Tipo de letra">
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
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2" title="Tamanho de letra">
        <CaseSensitive size={16} className="text-muted-foreground" />
        <select
          value={design.fontSize ?? 14}
          onChange={e => onDesignChange({ fontSize: Number(e.target.value) })}
          className="text-xs bg-muted border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
        >
          {FONT_SIZE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}px</option>
          ))}
        </select>
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

      <div className="flex items-center">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand text-white rounded-l-lg text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-60"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          PDF
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={exporting}
            className="grid h-[30px] w-8 place-items-center rounded-r-lg bg-brand text-white border-l border-white/20 hover:bg-brand/90 transition-colors disabled:opacity-60"
            aria-label="Outros formatos"
          >
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[200px] rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
              <FormatRow
                icon={FileDown}
                label="PDF"
                hint="Imagem fiel do preview"
                onClick={() => { setMenuOpen(false); onExport(); }}
              />
              {onExportDoc && (
                <FormatRow
                  icon={FileType}
                  label=".doc — Word"
                  hint="Recomendado p/ edição"
                  onClick={() => { setMenuOpen(false); onExportDoc(); }}
                />
              )}
              {onExportRtf && (
                <FormatRow
                  icon={FileText}
                  label=".rtf — Word / LibreOffice"
                  onClick={() => { setMenuOpen(false); onExportRtf(); }}
                />
              )}
              {onExportHtml && (
                <FormatRow
                  icon={FileCode}
                  label=".html — web"
                  onClick={() => { setMenuOpen(false); onExportHtml(); }}
                />
              )}
              {onExportTxt && (
                <FormatRow
                  icon={FileText}
                  label=".txt — texto simples"
                  onClick={() => { setMenuOpen(false); onExportTxt(); }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatRow({
  icon: Icon, label, hint, onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
    >
      <span className="inline-flex items-center gap-2 text-foreground font-semibold">
        <Icon size={14} className="text-muted-foreground" />
        {label}
      </span>
      {hint && <span className="text-[10px] font-bold text-brand">{hint}</span>}
    </button>
  );
}
