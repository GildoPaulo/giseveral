import { Link } from "@tanstack/react-router";
import { Phone, Map, Mail, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { NewsletterSignup } from "@/components/NewsletterSignup";

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
            <li><Link to="/" className="hover:text-gold transition-colors">Home</Link></li>
            <li><Link to="/sobre" className="hover:text-gold transition-colors">Sobre Nós</Link></li>
            <li><Link to="/servicos" className="hover:text-gold transition-colors">Serviços</Link></li>
            <li><Link to="/loja" className="hover:text-gold transition-colors">Loja</Link></li>
            <li><Link to="/galeria" className="hover:text-gold transition-colors">Galeria</Link></li>
            <li><Link to="/blog" className="hover:text-gold transition-colors">Blog</Link></li>
            <li><Link to="/hub" className="hover:text-gold transition-colors">Hub Académico</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold mb-4">Serviços</h4>
          <ul className="space-y-2 text-sm text-brand-foreground/80">
            <li><Link to="/servicos/$slug" params={{ slug: "reprografia" }} className="hover:text-gold transition-colors">Reprografia</Link></li>
            <li><Link to="/servicos/$slug" params={{ slug: "informatica" }} className="hover:text-gold transition-colors">Informática</Link></li>
            <li><Link to="/servicos/$slug" params={{ slug: "redes" }} className="hover:text-gold transition-colors">Redes</Link></li>
            <li><Link to="/precos" className="hover:text-gold transition-colors">Preços</Link></li>
            <li><Link to="/contactos" className="hover:text-gold transition-colors">Contactos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gold mb-4">Contactos</h4>
          <ul className="space-y-3 text-sm text-brand-foreground/80">
            <li>
              <a href="tel:+258874383621" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone className="h-4 w-4 text-gold flex-shrink-0" /><span>874 383 621</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/258874383621" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                <MessageCircle className="h-4 w-4 text-gold flex-shrink-0" /><span>WhatsApp</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Beira,+Esturro,+Rua+Alfredo+Lawley,+Mo%C3%A7ambique"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <Map className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Beira, Esturro • Rua Alfredo Lawley</span>
              </a>
            </li>
            <li>
              <a href="mailto:geral@giseveral.com" className="flex items-center gap-2 hover:text-gold transition-colors break-all">
                <Mail className="h-4 w-4 text-gold flex-shrink-0" /><span>geral@giseveral.com</span>
              </a>
            </li>
          </ul>
          <NewsletterSignup variant="footer" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-brand-foreground/60">
          <span>© {new Date().getFullYear()} Giseveral e Services. Todos os direitos reservados.</span>
          <span>Beira, Moçambique</span>
        </div>
      </div>
    </footer>
  );
}
