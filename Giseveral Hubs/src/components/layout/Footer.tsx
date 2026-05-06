import { Link } from "react-router-dom";
import { FileText, Mail, MessageCircle, MapPin } from "lucide-react";
import { SITE } from "@/data/site";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="container mx-auto container-px py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-lg">Giseveral Hub</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70 -mt-1">Documentos MZ</div>
              </div>
            </Link>
            <p className="text-sm opacity-80">
              A ponte entre o documento digital e o serviço de impressão em Moçambique.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-accent">Plataforma</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/explorar" className="hover:text-accent transition-smooth">Explorar</Link></li>
              <li><Link to="/categorias" className="hover:text-accent transition-smooth">Categorias</Link></li>
              <li><Link to="/upload" className="hover:text-accent transition-smooth">Enviar documento</Link></li>
              <li><Link to="/bolsas" className="hover:text-accent transition-smooth">Bolsas & Notícias</Link></li>
              <li><Link to="/premium" className="hover:text-accent transition-smooth">Premium</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-accent">Sobre</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/sobre" className="hover:text-accent transition-smooth">Quem somos</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-smooth">Perguntas frequentes</Link></li>
              <li><Link to="/contactos" className="hover:text-accent transition-smooth">Contactos</Link></li>
              <li><Link to="/denuncias" className="hover:text-accent transition-smooth">Denúncias</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-accent">Contacto</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> +258 87 438 3621</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contacto@giseveral.co.mz</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Maputo, Moçambique</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm opacity-70">
          <span>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</span>
          <span>Feito com 💙 em Moçambique</span>
        </div>
      </div>
    </footer>
  );
};
