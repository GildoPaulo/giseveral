import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu, X, User, LogIn, ShoppingCart, Bell,
  Package, Wrench, Truck, CheckCircle2, Tag, AlertTriangle, BellOff,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/sobre", label: "Sobre" },
  { to: "/servicos", label: "Serviços" },
  { to: "/loja", label: "Loja" },
  { to: "/galeria", label: "Galeria" },
  { to: "/blog", label: "Blog" },
  { to: "/precos", label: "Preços" },
  { to: "/contactos", label: "Contactos" },
] as const;

type NotifType = "order" | "progress" | "delivery" | "done" | "promo" | "alert";

type Notification = {
  id: number;
  type: NotifType;
  title: string;
  text: string;
  time: string;
};

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "order",    title: "Pedido recebido",      text: "O seu pedido #2401 foi confirmado e está a ser processado.",       time: "Agora" },
  { id: 2, type: "progress", title: "Em andamento",          text: "O pedido #2398 de reprografia está em preparação.",                 time: "30 min" },
  { id: 3, type: "delivery", title: "Em entrega",            text: "O pedido #2391 saiu para entrega. Previsto hoje até às 17h.",       time: "2h atrás" },
  { id: 4, type: "done",     title: "Concluído",             text: "O pedido #2385 foi entregue com sucesso. Obrigado!",                time: "Ontem" },
  { id: 5, type: "promo",    title: "Promoção especial",     text: "-20% em impressões a cores esta semana. Use o código GISE20.",     time: "1h atrás" },
  { id: 6, type: "alert",    title: "Atenção na sua conta",  text: "Confirme o seu e-mail para manter o acesso completo à conta.",     time: "3h atrás" },
];

const NOTIF_META: Record<NotifType, { icon: React.ComponentType<{ className?: string }>; color: string; badge: string }> = {
  order:    { icon: Package,       color: "text-blue-500",   badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  progress: { icon: Wrench,        color: "text-amber-500",  badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  delivery: { icon: Truck,         color: "text-violet-500", badge: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" },
  done:     { icon: CheckCircle2,  color: "text-emerald-500",badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  promo:    { icon: Tag,           color: "text-gold",       badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  alert:    { icon: AlertTriangle, color: "text-destructive",badge: "bg-destructive/10 text-destructive" },
};

const TYPE_LABELS: Record<NotifType, string> = {
  order: "Pedido", progress: "Andamento", delivery: "Entrega",
  done: "Concluído", promo: "Promoção", alert: "Alerta",
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<NotifType | "all">("all");
  const { user } = useAuth();
  const { totalItems } = useCart();

  const unread = NOTIFICATIONS.filter((n) => !readIds.includes(n.id)).length;
  function markAllRead() { setReadIds(NOTIFICATIONS.map((n) => n.id)); }
  function markRead(id: number) { setReadIds((p) => p.includes(id) ? p : [...p, id]); }

  const visible = filter === "all" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.type === filter);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src={logo} alt="Giseveral e Services" className="h-10 w-10 rounded-md object-cover" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-brand">GISEVERAL</span>
            <span className="text-[10px] tracking-widest text-gold">E SERVICES</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-brand border-b-2 border-gold" }}
              inactiveProps={{ className: "text-foreground/65 hover:text-brand border-b-2 border-transparent" }}
              className="px-3 py-[1.1rem] text-sm font-medium transition-smooth"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/loja/carrinho"
            className="relative inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {user && (
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-md border border-border p-2 text-foreground hover:bg-accent transition-smooth"
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-2xl border border-border bg-card shadow-elegant overflow-hidden flex flex-col max-h-[520px]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-brand" />
                        <span className="text-sm font-bold text-foreground">Centro de Notificações</span>
                        {unread > 0 && (
                          <span className="rounded-full bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">{unread}</span>
                        )}
                      </div>
                      <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-brand transition-colors">
                        Marcar todas lidas
                      </button>
                    </div>

                    {/* Filter chips */}
                    <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto flex-shrink-0 scrollbar-none">
                      <button
                        onClick={() => setFilter("all")}
                        className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === "all" ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        Todas
                      </button>
                      {(Object.keys(TYPE_LABELS) as NotifType[]).map((t) => {
                        const Meta = NOTIF_META[t];
                        return (
                          <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === t ? Meta.badge + " ring-1 ring-current/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                          >
                            {TYPE_LABELS[t]}
                          </button>
                        );
                      })}
                    </div>

                    {/* List */}
                    <ul className="overflow-y-auto flex-1">
                      {visible.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                          <BellOff className="h-8 w-8 opacity-30" />
                          <span className="text-sm">Sem notificações</span>
                        </li>
                      ) : (
                        visible.map((n) => {
                          const meta = NOTIF_META[n.type];
                          const Icon = meta.icon;
                          const isUnread = !readIds.includes(n.id);
                          return (
                            <li
                              key={n.id}
                              onClick={() => markRead(n.id)}
                              className={`flex gap-3 px-4 py-3.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${isUnread ? "bg-brand/[0.03]" : ""}`}
                            >
                              <div className={`flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${meta.badge}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-foreground">{n.title}</span>
                                  {isUnread && <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-brand" />}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{n.text}</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2.5 flex-shrink-0">
                      <Link
                        to="/conta"
                        onClick={() => setBellOpen(false)}
                        className="block text-center text-xs text-muted-foreground hover:text-brand transition-colors"
                      >
                        Ver todos os pedidos →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {user ? (
            <Link
              to="/conta"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              <User className="h-4 w-4" /> A Minha Conta
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-smooth"
            >
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
          <Link
            to="/orcamento"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-card transition-smooth hover:shadow-glow"
          >
            Pedir Orçamento
          </Link>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <Link to="/loja/carrinho" className="relative rounded-md p-2 text-foreground hover:bg-accent">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>
          <button
            className="rounded-md p-2 text-foreground hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <div className="container mx-auto flex flex-col px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-brand bg-accent" }}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/conta"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                <User className="h-4 w-4" /> A Minha Conta
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                <LogIn className="h-4 w-4" /> Entrar / Criar Conta
              </Link>
            )}
            <Link
              to="/contactos"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground"
            >
              Pedir Orçamento
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
