import { TEMPLATE_META } from "./types";
import type { CvTemplate } from "./types";

interface Props {
  selected: CvTemplate;
  onSelect: (t: CvTemplate) => void;
}

export function TemplateSelector({ selected, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">Escolha o template</h3>
      <div className="grid grid-cols-3 gap-3">
        {TEMPLATE_META.map((t) => {
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`rounded-xl border-2 p-3 text-left transition-all focus:outline-none ${
                active ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-border hover:border-brand/40"
              }`}
            >
              {/* Color swatch */}
              <div
                className="h-9 rounded-md mb-2"
                style={{ backgroundColor: t.accent }}
              />
              <div className="font-semibold text-xs text-foreground">{t.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
              {active && (
                <div className="mt-1.5 text-[10px] font-bold text-brand flex items-center gap-1">
                  <span>✓</span> Selecionado
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
