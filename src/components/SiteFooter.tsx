import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Mail, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export function SiteFooter() {
  return (
    <footer className="bg-gradient-hero text-brand-foreground mt-16">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Giseveral" className="h-12 w-12 rounded-md" />
            <div className="leading-tight">
              <div className="text-base font-bold">GISEVERAL</div>
              <div className="text-[11px] tracking-widest text-gold">E SERVICES</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-brand-foreground/70">
            Soluções completas em reprografia, papelaria, informática e redes.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold mb-4">Navegação</h4>
          <ul className="space-y-2 text-sm text-brand-foreground/80">
            <li><Link to="/" className="hover:text-gold">Home</Link></li>
            <li><Link to="/sobre" className="hover:text-gold">Sobre Nós</Link></li>
            <li><Link to="/servicos" className="hover:text-gold">Serviços</Link></li>
            <li><Link to="/galeria" className="hover:text-gold">Galeria</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold mb-4">Serviços</h4>
          <ul className="space-y-2 text-sm text-brand-foreground/80">
            <li><Link to="/informatica" className="hover:text-gold">Informática</Link></li>
            <li><Link to="/redes" className="hover:text-gold">Redes</Link></li>
            <li><Link to="/precos" className="hover:text-gold">Preços</Link></li>
            <li><Link to="/contactos" className="hover:text-gold">Contactos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold mb-4">Contactos</h4>
          <ul className="space-y-3 text-sm text-brand-foreground/80">
            <li><a href="sms:+258874383621" className="flex items-center gap-2 hover:text-gold"><Phone className="h-4 w-4 text-gold" /><span>874 383 621</span></a></li>
            <li><a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold"><MessageCircle className="h-4 w-4 text-gold" /><span>WhatsApp</span></a></li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /><span>Beira, Moçambique</span></li>
            <li><a href="mailto:giseveral.services@outlook.com" className="flex items-center gap-2 hover:text-gold break-all"><Mail className="h-4 w-4 text-gold shrink-0" /><span>giseveral.services@outlook.com</span></a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 text-center text-xs text-brand-foreground/60">
          © {new Date().getFullYear()} Giseveral e Services. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
