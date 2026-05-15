import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Menu, X, User, LogIn, ShoppingCart, Bell, Sun, Moon,
  Package, Wrench, Truck, CheckCircle2, Tag, AlertTriangle,
  BellOff, Trash2, Info, BellRing, Home, Store, Compass, ChevronDown, Globe,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import logo from "@/assets/logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from "@/contexts/LanguageContext";
import {
  useNotifications, relativeTime,
  type NotifType, type AppNotification,
} from "@/hooks/useNotifications";

// ── Navigation ────────────────────────────────────────────────────────────────

const navItems = [
  { to: "/",        labelKey: "nav.home" },
  { to: "/sobre",   labelKey: "nav.about" },
  { to: "/servicos", labelKey: "nav.services" },
  { to: "/loja",    labelKey: "nav.store" },
  { to: "/blog",    labelKey: "nav.blog" },
  { to: "/galeria", labelKey: "nav.gallery" },
] as const;

const mobileQuickNav = [
  { to: "/",       labelKey: "nav.home",    icon: Home },
  { to: "/loja",   labelKey: "nav.store",   icon: Store },
  { to: "/blog",   labelKey: "nav.blog",    icon: Compass },
  { to: "/conta",  labelKey: "nav.account", icon: User },
] as const;

// ── Notification meta ─────────────────────────────────────────────────────────

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

// ── Language Switcher ────────────────────────────────────────────────────────

function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.language")}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1.5 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="tabular-nums tracking-wider">{current.short}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[140px] rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
          {SUPPORTED_LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => { setLang(l.code as LanguageCode); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs text-left hover:bg-muted transition-colors ${
                  active ? "text-brand font-bold" : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{l.flag}</span>
                  {l.label}
                </span>
                <span className="text-[10px] tabular-nums opacity-60">{l.short}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [filter, setFilter] = useState<NotifType | "all">("all");

  const { user } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();

  const {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    clickNotification,
    deleteNotification,
  } = useNotifications();

  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, unsupportedReason } = usePushNotifications();

  const visible = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  function handleBellClose() {
    setBellOpen(false);
    setFilter("all");
  }

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <img src={logo} alt="Giseveral" className="h-7 w-7 rounded-md object-cover ring-1 ring-border" />
          <span className="hidden sm:inline text-sm font-bold tracking-tight text-foreground">Giseveral</span>
        </Link>

        {/* Desktop nav — clean inline links, no pill background */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground bg-accent/70" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-accent/40" }}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop actions — compact */}
        <div className="hidden lg:flex items-center gap-1.5">

          <LanguageSwitcher />

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={theme === "dark" ? t("nav.theme.light") : t("nav.theme.dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Cart */}
          <Link
            to="/loja/carrinho"
            className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {/* Bell — only for logged-in users */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Notificações"
                aria-expanded={bellOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={handleBellClose} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-2xl border border-border bg-card shadow-elegant overflow-hidden flex flex-col max-h-[540px]">
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
                        <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-brand transition-colors">
                          Marcar todas lidas
                        </button>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="flex gap-1.5 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 scrollbar-none">
                        <button
                          onClick={() => setFilter("all")}
                          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === "all" ? "bg-gradient-brand text-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                        >
                          Todas
                        </button>
                        {ALL_TYPES.filter((t) => notifications.some((n) => n.type === t)).map((t) => {
                          const meta = NOTIF_META[t];
                          return (
                            <button
                              key={t}
                              onClick={() => setFilter(t)}
                              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === t ? meta.badge + " ring-1 ring-current/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                            >
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

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
                              <button onClick={() => setFilter("all")} className="text-xs text-brand hover:underline mt-1">Ver todas</button>
                            )}
                          </div>
                        </li>
                      ) : (
                        visible.map((n) => (
                          <NotificationItem key={n.id} notification={n} onClose={handleBellClose} onClick={clickNotification} onDelete={deleteNotification} />
                        ))
                      )}
                    </ul>

                    <div className="border-t border-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                      <Link to="/conta" onClick={handleBellClose} className="text-xs text-muted-foreground hover:text-brand transition-colors">
                        Ver todos os pedidos →
                      </Link>
                      {pushSupported ? (
                        <button
                          onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
                          disabled={pushLoading}
                          title={pushSubscribed ? "Clica para desactivar alertas push" : "Clica para receber alertas push"}
                          className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                            pushSubscribed
                              ? "border-brand/30 text-brand bg-brand/8 hover:border-destructive/40 hover:bg-destructive/8 hover:text-destructive"
                              : "border-border text-muted-foreground hover:border-brand/40 hover:text-brand hover:bg-brand/8"
                          }`}
                        >
                          <BellRing className={`h-3 w-3 ${pushSubscribed && !pushLoading ? "animate-[wiggle_1s_ease-in-out_1]" : ""}`} />
                          {pushLoading ? "…" : pushSubscribed ? "Alertas ON" : "Alertar-me"}
                        </button>
                      ) : unsupportedReason ? (
                        <span className="text-[10px] text-muted-foreground/60 italic">Push não suportado</span>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Account / login — single primary action */}
          {user ? (
            <Link
              to="/conta"
              className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <User className="h-3.5 w-3.5" /> {t("nav.account")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-[13px] font-bold text-background hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-3.5 w-3.5" /> {t("nav.login")}
            </Link>
          )}
        </div>

        {/* Mobile icons */}
        <div className="flex lg:hidden items-center gap-1">
          <LanguageSwitcher />
          <Link to="/loja/carrinho" className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>
          <button
            className="grid h-8 w-8 place-items-center rounded-full text-foreground hover:bg-accent transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <div className="container mx-auto flex flex-col px-4 py-3 gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-brand bg-accent" }}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80"
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={toggle}
                className="flex-1 rounded-md border border-border py-2 text-xs font-semibold text-foreground flex items-center justify-center gap-2"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === "dark" ? t("nav.theme.light") : t("nav.theme.dark")}
              </button>
            </div>

            {user ? (
              <Link
                to="/conta"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                <User className="h-4 w-4" /> {t("nav.account")}
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
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-4 py-2.5 text-sm font-bold text-background"
              >
                <LogIn className="h-4 w-4" /> {t("nav.login")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>

    {/* Mobile bottom quick-nav */}
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-border/70 bg-background/88 p-1.5 shadow-elegant backdrop-blur-xl lg:hidden">
      {mobileQuickNav.map(({ to, labelKey, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "bg-brand text-brand-foreground shadow-card" }}
          inactiveProps={{ className: "text-muted-foreground hover:text-brand hover:bg-accent" }}
          className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-bold transition-smooth"
          onClick={() => setOpen(false)}
        >
          <Icon className="mb-0.5 h-4 w-4" />
          {t(labelKey)}
        </Link>
      ))}
    </nav>
    </>
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
      <div className={`flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${meta.badge}`}>
        <Icon className="h-4 w-4" />
      </div>

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
