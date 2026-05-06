import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Upload, Coins, FileText, ShieldAlert, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const baseLinks = [
  { to: "/", label: "Início" },
  { to: "/explorar", label: "Explorar" },
  { to: "/categorias", label: "Categorias" },
  { to: "/bolsas", label: "Bolsas" },
  { to: "/sobre", label: "Sobre" },
  { to: "/faq", label: "FAQ" },
  { to: "/premium", label: "Premium" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, profile, isModerator, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const links = isModerator
    ? [...baseLinks, { to: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto container-px">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-card group-hover:shadow-card-hover transition-smooth">
              <FileText className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg text-primary">Giseveral</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">Hub</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive ? "text-primary bg-secondary" : "text-muted-foreground hover:text-primary hover:bg-secondary/60"
                  } ${l.to === "/admin" ? "text-destructive" : ""}`
                }
              >
                {l.to === "/admin" && <ShieldAlert className="inline h-3.5 w-3.5 mr-1" />}
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                <Coins className="h-3.5 w-3.5 text-accent" />
                <span>{profile?.is_premium ? "∞" : (profile?.credits ?? 0)}</span>
                <span className="text-muted-foreground font-normal">créditos</span>
              </div>
            )}
            {user ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/upload"><Upload className="h-4 w-4" /> Enviar</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <UserCircle className="h-5 w-5" />
                      <span className="max-w-[120px] truncate">{profile?.display_name ?? "Conta"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/perfil">O meu perfil</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/upload">Enviar documento</Link></DropdownMenuItem>
                    {isModerator && (
                      <DropdownMenuItem asChild><Link to="/admin">Painel admin</Link></DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/login">Criar conta</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden grid place-items-center h-10 w-10 rounded-md hover:bg-secondary"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-md text-sm font-medium ${
                      isActive ? "text-primary bg-secondary" : "text-muted-foreground hover:bg-secondary/60"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold w-fit my-2">
                    <Coins className="h-3.5 w-3.5 text-accent" />
                    {profile?.is_premium ? "∞" : (profile?.credits ?? 0)} créditos
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/upload" onClick={() => setOpen(false)}><Upload className="h-4 w-4" /> Enviar</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/perfil" onClick={() => setOpen(false)}>Perfil</Link>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setOpen(false); handleSignOut(); }} className="mt-1 text-destructive">
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/login" onClick={() => setOpen(false)}>Entrar</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/login" onClick={() => setOpen(false)}>Criar conta</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
