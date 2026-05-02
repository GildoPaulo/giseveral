import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, BookOpen, Palette, Laptop, Network, Edit3, Check, X, ToggleLeft, ToggleRight, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

export const Route = createFileRoute("/balcao/servicos")({
  component: BalcaoServicos,
});

type ServiceConfig = {
  slug: string;
  title: string;
  subtitle: string;
  priceFrom: string;
  description: string;
  active: boolean;
  pedirEnabled: boolean;
};

const DEFAULTS: ServiceConfig[] = [
  { slug: "reprografia",   title: "Reprografia",           subtitle: "Impressão, fotocópias e digitalização",   priceFrom: "3 MZN/pág",  description: "Impressão P&B, cores, fotocópias, encadernação e plastificação.", active: true, pedirEnabled: true },
  { slug: "papelaria",     title: "Papelaria",             subtitle: "Material escolar e de escritório",         priceFrom: "55 MZN",     description: "Cadernos, pastas, canetas, resmas e material de escritório.", active: true, pedirEnabled: true },
  { slug: "design-grafico",title: "Design Gráfico",        subtitle: "Logos, flyers, banners e convites",        priceFrom: "400 MZN",    description: "Criação de logótipos, flyers, cartazes e identidade visual.", active: true, pedirEnabled: true },
  { slug: "informatica",   title: "Assistência Informática",subtitle: "Formatação, Windows e remoção de vírus",  priceFrom: "300 MZN",    description: "Formatação, Windows, vírus, reparação e upgrade de hardware.", active: true, pedirEnabled: true },
  { slug: "redes",         title: "Redes e Tecnologia",    subtitle: "Wi-Fi, routers e cabeamento",              priceFrom: "400 MZN",    description: "Instalação Wi-Fi, configuração de routers e cabeamento LAN.", active: true, pedirEnabled: true },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reprografia: Printer, papelaria: BookOpen,
  "design-grafico": Palette, informatica: Laptop, redes: Network,
};

const LS_KEY = "giseveral_services_config";

function loadConfig(): ServiceConfig[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const saved: ServiceConfig[] = JSON.parse(raw);
    return DEFAULTS.map((def) => ({ ...def, ...(saved.find((s) => s.slug === def.slug) ?? {}) }));
  } catch { return DEFAULTS; }
}

function saveConfig(cfg: ServiceConfig[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

type EditState = { priceFrom: string; description: string; subtitle: string };

function BalcaoServicos() {
  const [services, setServices] = useState<ServiceConfig[]>(loadConfig);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ priceFrom: "", description: "", subtitle: "" });
  const { addItem } = useCart();

  function update(slug: string, patch: Partial<ServiceConfig>) {
    setServices((prev) => {
      const next = prev.map((s) => (s.slug === slug ? { ...s, ...patch } : s));
      saveConfig(next);
      return next;
    });
  }

  function startEdit(s: ServiceConfig) {
    setEditSlug(s.slug);
    setEditForm({ priceFrom: s.priceFrom, description: s.description, subtitle: s.subtitle });
  }

  function saveEdit() {
    if (!editSlug) return;
    update(editSlug, editForm);
    setEditSlug(null);
    toast.success("Serviço actualizado!");
  }

  function toggleActive(slug: string, current: boolean) {
    update(slug, { active: !current });
    toast.success(!current ? "Serviço activado" : "Serviço desactivado");
  }

  function togglePedir(slug: string, current: boolean) {
    update(slug, { pedirEnabled: !current });
    toast.success(!current ? "Botão 'Pedir' activado" : "Botão 'Pedir' desactivado");
  }

  function testAddToCart(s: ServiceConfig) {
    addItem({
      id: `service-${s.slug}`,
      name: s.title,
      price: 0,
      quantity: 1,
      type: "servico",
      serviceDetails: { category: s.slug, description: s.description },
    });
    toast.success(`${s.title} adicionado ao carrinho`);
  }

  const activeCount = services.filter((s) => s.active).length;
  const pedirCount  = services.filter((s) => s.pedirEnabled).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Gestão de Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} activos · {pedirCount} com botão "Pedir" ligado
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
        <p className="font-semibold text-amber-700 dark:text-amber-400">ℹ️ Configuração local</p>
        <p className="mt-1 text-amber-600 dark:text-amber-500 text-xs">
          As alterações de preço e descrição ficam guardadas neste browser. Para editar o conteúdo completo das páginas de serviço, actualiza <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded font-mono">src/routes/servicos.$slug.tsx</code>.
        </p>
      </div>

      <div className="space-y-4">
        {services.map((s) => {
          const Icon = ICONS[s.slug] ?? Printer;
          const isEditing = editSlug === s.slug;
          return (
            <div key={s.slug} className={`rounded-2xl border bg-card shadow-card overflow-hidden transition-smooth ${s.active ? "border-border" : "border-dashed border-muted-foreground/30 opacity-60"}`}>
              <div className="flex items-start gap-4 p-5">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${s.active ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
                        <input
                          value={editForm.subtitle}
                          onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Preço a partir de</label>
                          <input
                            value={editForm.priceFrom}
                            onChange={(e) => setEditForm({ ...editForm, priceFrom: e.target.value })}
                            placeholder="Ex: 500 MZN"
                            className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Descrição curta</label>
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-lg bg-gradient-brand px-4 py-2 text-xs font-semibold text-brand-foreground">
                          <Check className="h-3.5 w-3.5" /> Guardar
                        </button>
                        <button onClick={() => setEditSlug(null)} className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-brand">{s.title}</h3>
                          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                          <p className="text-sm text-foreground/80 mt-1">{s.description}</p>
                          <p className="text-xs font-semibold text-gold mt-1">A partir de {s.priceFrom}</p>
                        </div>
                        <button onClick={() => startEdit(s)} className="rounded-lg border border-border p-2 hover:bg-muted flex-shrink-0 transition-smooth">
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
                  <button
                    onClick={() => toggleActive(s.slug, s.active)}
                    className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-muted ${s.active ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
                    {s.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {s.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => togglePedir(s.slug, s.pedirEnabled)}
                    className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-muted ${s.pedirEnabled ? "text-brand" : "text-muted-foreground"}`}
                  >
                    {s.pedirEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    Botão "Pedir"
                  </button>
                  <button
                    onClick={() => testAddToCart(s)}
                    className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-brand transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" /> Testar carrinho
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
