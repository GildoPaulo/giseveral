import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Truck,
  LogOut, Menu, X, ChevronRight, BoxesIcon, BookOpen,
  Wrench, Images, Megaphone, GraduationCap, Award,
  FileText, Newspaper, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/balcao")({
  head: () => ({
    meta: [{ title: "Balcão – Giseveral" }],
  }),
  component: BalcaoLayout,
});

const navItems = [
  { to: "/balcao/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/balcao/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/balcao/produtos", label: "Produtos", icon: BoxesIcon },
  { to: "/balcao/stock", label: "Stock", icon: Package },
  { to: "/balcao/entregas", label: "Entregas", icon: Truck },
  { to: "/balcao/servicos", label: "Serviços", icon: Wrench },
  { to: "/balcao/galeria", label: "Galeria", icon: Images },
  { to: "/balcao/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/balcao/blog", label: "Blog + IA", icon: BookOpen },
  { to: "/balcao/hub", label: "Hub Documentos", icon: GraduationCap },
  { to: "/balcao/bolsas", label: "Bolsas Hub", icon: Award },
  { to: "/balcao/exames", label: "Exames Hub", icon: FileText },
  { to: "/balcao/noticias", label: "Notícias Hub", icon: Newspaper },
  { to: "/balcao/cartas", label: "Cartas Templates", icon: Mail },
] as const;

function BalcaoLayout() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin" || data?.role === "staff");
        setChecking(false);
      });
  }, [user]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é reservada a administradores. Inicia sessão com uma conta autorizada.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Iniciar Sessão
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border shadow-elegant transition-transform duration-200 flex flex-col lg:translate-x-0 lg:static lg:flex ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <img src={logo} alt="Giseveral" className="h-8 w-8 rounded object-cover" />
          <div>
            <p className="text-sm font-bold text-brand leading-tight">BALCÃO</p>
            <p className="text-[10px] text-gold tracking-wider">GISEVERAL</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to) && to !== "/balcao/";
            const isActive = to === "/balcao/" ? pathname === "/balcao" || pathname === "/balcao/" : active;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth ${isActive ? "bg-gradient-brand text-brand-foreground shadow-card" : "text-foreground/70 hover:bg-muted hover:text-brand"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-brand-foreground font-bold text-xs">
              {user.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span className="truncate">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-smooth"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
          <button className="lg:hidden rounded-md p-1.5 hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {navItems.find((n) => {
              if (n.to === "/balcao/") return pathname === "/balcao" || pathname === "/balcao/";
              return pathname.startsWith(n.to);
            })?.label ?? "Balcão"}
          </span>
          <Link to="/" className="ml-auto text-xs text-muted-foreground hover:text-brand">
            Ver site ↗
          </Link>
        </header>

        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
