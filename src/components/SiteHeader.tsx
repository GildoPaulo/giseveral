import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu, X, User, LogIn, ShoppingCart, Bell, Sun, Moon,
  Package, Wrench, Truck, CheckCircle2, Tag, AlertTriangle,
  BellOff, Trash2, Info,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useNotifications, relativeTime,
  type NotifType, type AppNotification,
} from "@/hooks/useNotifications";

// ── Navigation ────────────────────────────────────────────────────────────────

const navItems = [
  { to: "/", label: "Home" },
  { to: "/sobre", label: "Sobre" },
  { to: "/servicos", label: "Serviços" },
  { to: "/loja", label: "Loja" },
  { to: "/galeria", label: "Galeria" },
  { to: "/blog", label: "Blog" },
  { to: "/hub", label: "Hub" },
  { to: "/precos", label: "Preços" },
  { to: "/contactos", label: "Contactos" },
] as const;

// ── Notification meta (icon + colour per type) ────────────────────────────────

const NOTIF_META: Record<NotifType, {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  label: string;
}> = {
  order:    { icon: Package,       badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",         label: "Pedido"    },
  progress: { icon: Wrench,        badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",     label: "Andamento" },
  delivery: { icon: Truck,         badge: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400", label: "Entrega"   },
  done:     { icon: CheckCircle2,  badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", label: "Concluído" },
  promo:    { icon: Tag,           badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",     label: "Promoção"  },
  alert:    { icon: AlertTriangle, badge: "bg-destructive/10 text-destructive",                                       label: "Alerta"    },
  info:     { icon: Info,          badge: "bg-brand/10 text-brand",                                                   label: "Info"      },
};

const ALL_TYPES = Object.keys(NOTIF_META) as NotifType[];

// ── Component ─────────────────────────────────────────────────────────────────

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [filter, setFilter] = useState<NotifType | "all">("all");

  const { user } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggle } = useTheme();

  const {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    clickNotification,
    deleteNotification,
  } = useNotifications();

  const visible =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  function handleBellClose() {
    setBellOpen(false);
    setFilter("all");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src={logo} alt="Giseveral e Services" className="h-10 w-10 rounded-md object-cover" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-brand">GISEVERAL</span>
            <span className="text-[10px] tracking-widest text-gold">E SERVICES</span>
          </div>
        </Link>

        {/* Desktop nav */}
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

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Cart */}
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

          {/* Bell — only for logged-in users */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-md border border-border p-2 text-foreground hover:bg-accent transition-smooth"
                aria-label="Notificações"
                aria-expanded={bellOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={handleBellClose} />

                  {/* Panel */}
                  <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-2xl border border-border bg-card shadow-elegant overflow-hidden flex flex-col max-h-[540px]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-brand" />
                        <span className="text-sm font-bold text-foreground">Notificações</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-muted-foreground hover:text-brand transition-colors"
                        >
                          Marcar todas lidas
                        </button>
                      )}
                    </div>

                    {/* Filter chips */}
                    {notifications.length > 0 && (
                      <div className="flex gap-1.5 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 scrollbar-none">
                        <button
                          onClick={() => setFilter("all")}
                          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors
                            ${filter === "all" ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                          Todas
                        </button>
                        {ALL_TYPES.filter((t) => notifications.some((n) => n.type === t)).map((t) => {
                          const meta = NOTIF_META[t];
                          return (
                            <button
                              key={t}
                              onClick={() => setFilter(t)}
                              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors
                                ${filter === t ? meta.badge + " ring-1 ring-current/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                            >
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Notification list */}
                    <ul className="overflow-y-auto flex-1">
                      {loading ? (
                        <li className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                          <span className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full" />
                          <span className="text-xs">A carregar…</span>
                        </li>
                      ) : visible.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
                          <BellOff className="h-9 w-9 opacity-25" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Sem notificações</p>
                            {filter !== "all" && (
                              <button
                                onClick={() => setFilter("all")}
                                className="text-xs text-brand hover:underline mt-1"
                              >
                                Ver todas
                              </button>
                            )}
                          </div>
                        </li>
                      ) : (
                        visible.map((n) => (
                          <NotificationItem
                            key={n.id}
                            notification={n}
                            onClose={handleBellClose}
                            onClick={clickNotification}
                            onDelete={deleteNotification}
                          />
                        ))
                      )}
                    </ul>

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                      <Link
                        to="/conta"
                        onClick={handleBellClose}
                        className="text-xs text-muted-foreground hover:text-brand transition-colors"
                      >
                        Ver todos os pedidos →
                      </Link>
                      {notifications.length > 0 && (
                        <span className="text-[10px] text-muted-foreground/50">
                          {notifications.length} notificaç{notifications.length === 1 ? "ão" : "ões"}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="rounded-md border border-border p-2 text-foreground hover:bg-accent transition-smooth"
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Account */}
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

        {/* Mobile icons */}
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
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
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

            <div className="flex gap-2 mt-2">
              <button
                onClick={toggle}
                className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Modo claro" : "Modo escuro"}
              </button>
            </div>

            {user ? (
              <Link
                to="/conta"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                <User className="h-4 w-4" /> A Minha Conta
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
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
              to="/orcamento"
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

// ── Notification item ─────────────────────────────────────────────────────────

function NotificationItem({
  notification: n,
  onClick,
  onClose,
  onDelete,
}: {
  notification: AppNotification;
  onClick: (n: AppNotification) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const meta = NOTIF_META[n.type] ?? NOTIF_META.info;
  const Icon = meta.icon;
  const isUnread = !n.is_read;

  return (
    <li
      className={`group flex gap-3 px-4 py-3.5 border-b border-border last:border-0 transition-colors
        ${isUnread ? "bg-brand/[0.03]" : ""}
        ${n.link ? "cursor-pointer hover:bg-muted/50" : ""}`}
      onClick={() => {
        if (n.link) { onClick(n); onClose(); }
        else if (!n.is_read) onClick(n);
      }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${meta.badge}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground leading-tight">{n.title}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            <span className="text-[10px] text-muted-foreground/60">{relativeTime(n.created_at)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
        {n.link && (
          <p className="text-[10px] text-brand/60 mt-1 group-hover:text-brand transition-colors">Clique para ver →</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        aria-label="Eliminar notificação"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
