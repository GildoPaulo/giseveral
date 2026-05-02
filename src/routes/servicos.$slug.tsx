import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  MessageCircle, Phone, ArrowLeft, Check, Star, ChevronRight,
  Printer, BookOpen, Palette, Laptop, Network,
} from "lucide-react";

// Images
import printingImg from "@/assets/printing.jpg";
import documentsImg from "@/assets/documents.jpg";
import blogPrinting from "@/assets/blog-printing.jpg";
import blogPrinterChoice from "@/assets/blog-printer-choice.jpg";
import stationeryImg from "@/assets/stationery.jpg";
import blogStationery from "@/assets/blog-stationery.jpg";
import designImg from "@/assets/design.jpg";
import repairImg from "@/assets/computer-repair.jpg";
import windowsImg from "@/assets/windows-install.jpg";
import technicianImg from "@/assets/technician.jpg";
import blogFormat from "@/assets/blog-format.jpg";
import blogAntivirus from "@/assets/blog-antivirus.jpg";
import networkImg from "@/assets/network.jpg";
import routerImg from "@/assets/router.jpg";
import blogWifi from "@/assets/blog-wifi.jpg";
import blogCabling from "@/assets/blog-cabling.jpg";
import heroImg from "@/assets/hero.jpg";

type Testimonial = { name: string; role: string; text: string; rating: number };
type PriceItem = { name: string; price: string; note?: string };
type SubService = { title: string; description: string; icon?: string };
type Step = { num: string; title: string; desc: string };

type ServiceData = {
  slug: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  hero: string;
  heroAlt: string;
  icon: typeof Printer;
  color: string;
  subServices: SubService[];
  steps: Step[];
  gallery: { src: string; alt: string }[];
  testimonials: Testimonial[];
  prices: PriceItem[];
  relatedSlugs: string[];
};

const SERVICES: Record<string, ServiceData> = {
  reprografia: {
    slug: "reprografia",
    title: "Reprografia",
    subtitle: "Impressão profissional, fotocópias, digitalização e encadernação na Beira.",
    metaTitle: "Reprografia na Beira | Impressão e Fotocópias — Giseveral e Services",
    metaDescription: "Serviços de reprografia na Beira: impressão a cores e P&B, fotocópias, digitalização, encadernação e plastificação. Qualidade e preços acessíveis.",
    keywords: "reprografia Beira, impressão Beira, fotocópias Beira, encadernação Beira, digitalização documentos Moçambique",
    hero: printingImg,
    heroAlt: "Serviço de impressão profissional na Giseveral e Services, Beira",
    icon: Printer,
    color: "from-blue-900 to-blue-700",
    subServices: [
      { title: "Impressão P&B", description: "A4, A3 e outros formatos a preto e branco — documentos, relatórios, apontamentos escolares e textos." },
      { title: "Impressão a Cores", description: "Impressão colorida de alta qualidade para apresentações, trabalhos académicos, mapas e imagens." },
      { title: "Fotocópias", description: "Reprodução rápida de documentos, livros e fichas em grande quantidade a preço acessível." },
      { title: "Digitalização de Documentos", description: "Convertemos os seus documentos em papel para formato digital (PDF, JPG) com qualidade profissional." },
      { title: "Encadernação", description: "Encadernação a espiral, térmica e capa dura — para relatórios, teses, monografias e projectos." },
      { title: "Plastificação", description: "Plastificação de documentos, cartões, fotografias e certificados para protecção durável." },
    ],
    steps: [
      { num: "1", title: "Traga o documento", desc: "Traga o ficheiro em pendrive, CD ou envie por WhatsApp." },
      { num: "2", title: "Escolha o formato", desc: "Seleccione tamanho, cor, quantidade e tipo de acabamento." },
      { num: "3", title: "Aguarde o resultado", desc: "Imprimimos na hora — pronto em minutos." },
    ],
    gallery: [
      { src: printingImg, alt: "Impressora profissional Giseveral" },
      { src: documentsImg, alt: "Documentos impressos na Beira" },
      { src: blogPrinting, alt: "Serviço de impressão" },
      { src: blogPrinterChoice, alt: "Tipos de impressão disponíveis" },
    ],
    testimonials: [
      { name: "Mariana Cossa", role: "Estudante universitária", text: "Imprimo os meus trabalhos aqui há 2 anos. A qualidade é ótima e o atendimento é sempre rápido. Recomendo a todos os estudantes da Beira!", rating: 5 },
      { name: "Paulo Machava", role: "Empresário", text: "Mando imprimir os meus relatórios semanais aqui. São profissionais, cumprem prazos e o preço é justo. Nada a apontar.", rating: 5 },
      { name: "Ana Zunguza", role: "Professora", text: "Excelente serviço de fotocópia — rapidez e qualidade! Já trouxe turmas inteiras para imprimir fichas de avaliação.", rating: 4 },
    ],
    prices: [
      { name: "Impressão P&B A4", price: "5 MZN/pág" },
      { name: "Impressão Cores A4", price: "20 MZN/pág" },
      { name: "Fotocópia A4", price: "3 MZN/pág" },
      { name: "Digitalização A4", price: "10 MZN/pág" },
      { name: "Encadernação espiral", price: "50–150 MZN", note: "consoante espessura" },
      { name: "Plastificação A4", price: "30 MZN" },
    ],
    relatedSlugs: ["papelaria", "design-grafico"],
  },

  papelaria: {
    slug: "papelaria",
    title: "Papelaria",
    subtitle: "Material escolar e de escritório completo na Beira — preços acessíveis.",
    metaTitle: "Papelaria na Beira | Material Escolar e de Escritório — Giseveral",
    metaDescription: "Papelaria em Beira com material escolar, cadernos, canetas, resmas de papel e material de escritório. Tudo que precisas ao melhor preço.",
    keywords: "papelaria Beira, material escolar Beira, cadernos Beira, canetas Beira, resma papel Moçambique",
    hero: stationeryImg,
    heroAlt: "Material escolar e de escritório na papelaria Giseveral, Beira",
    icon: BookOpen,
    color: "from-amber-800 to-amber-600",
    subServices: [
      { title: "Material Escolar", description: "Cadernos, borrachas, lápis, réguas, compassos, transferidores e tudo o que estudantes precisam." },
      { title: "Escrita e Desenho", description: "Canetas esferográficas, marcadores, lápis de cor, corretores e canetas de gel das melhores marcas." },
      { title: "Pastas e Organização", description: "Pastas AZ, dossiers, micas plásticas, separadores, agrafadores, furadores e clips." },
      { title: "Papel e Impressão", description: "Resmas A4 80g, blocos de notas, papéis especiais e envelopes em vários formatos." },
      { title: "Material de Escritório", description: "Staplers, tesouras, calculadoras, fita-cola, cola stick, post-its e muito mais." },
      { title: "Mochilas e Estojos", description: "Mochilas escolares resistentes e estojos práticos para estudantes de todos os níveis." },
    ],
    steps: [
      { num: "1", title: "Visita a loja", desc: "Vem à nossa loja na Beira, Esturro • Rua Alfredo Lawley ou encomena por WhatsApp." },
      { num: "2", title: "Escolhe o material", desc: "Grande variedade de marcas e modelos disponíveis." },
      { num: "3", title: "Leva no próprio dia", desc: "Stock disponível para entrega imediata." },
    ],
    gallery: [
      { src: stationeryImg, alt: "Material escolar na papelaria Giseveral" },
      { src: blogStationery, alt: "Variedade de material escolar" },
      { src: documentsImg, alt: "Material de escritório" },
      { src: heroImg, alt: "Loja Giseveral e Services" },
    ],
    testimonials: [
      { name: "Sofia Nhantumbo", role: "Mãe de estudante", text: "Compro todo o material escolar dos meus filhos aqui. Ótima variedade e preços honestos. Já temos a Giseveral como a nossa papelaria de confiança.", rating: 5 },
      { name: "Carlos Sitoe", role: "Administrativo", text: "Para o escritório é a melhor opção — têm tudo desde resmas de papel até arquivadores. E o atendimento é sempre simpático.", rating: 5 },
      { name: "Beatriz Mucombo", role: "Estudante", text: "Encontrei material de qualidade a preços que cabem no meu orçamento de estudante. Voltarei sempre!", rating: 4 },
    ],
    prices: [
      { name: "Caderno universitário 96 fls", price: "120 MZN" },
      { name: "Resma A4 80g (500 fls)", price: "450 MZN" },
      { name: "Canetas esferográficas (cx 12)", price: "180 MZN" },
      { name: "Pasta AZ lombo largo", price: "250 MZN" },
      { name: "Mochila escolar", price: "a partir de 850 MZN" },
      { name: "Estojo plástico", price: "55 MZN" },
    ],
    relatedSlugs: ["reprografia", "design-grafico"],
  },

  "design-grafico": {
    slug: "design-grafico",
    title: "Design Gráfico",
    subtitle: "Criamos materiais visuais que comunicam a tua marca profissionalmente.",
    metaTitle: "Design Gráfico na Beira | Flyers, Logos, Banners — Giseveral e Services",
    metaDescription: "Serviço de design gráfico na Beira: flyers, cartazes, banners, logos, convites e edição de imagens. Profissionalismo ao alcance de todos.",
    keywords: "design gráfico Beira, flyers Beira, logo Beira, banners Moçambique, convites personalizados Beira",
    hero: designImg,
    heroAlt: "Design gráfico profissional na Giseveral e Services, Beira",
    icon: Palette,
    color: "from-purple-900 to-purple-700",
    subServices: [
      { title: "Flyers e Panfletos", description: "Design apelativo para eventos, promoções, lançamentos e publicidade — prontos para impressão ou digital." },
      { title: "Cartazes e Banners", description: "Cartazes de grande impacto visual para lojas, eventos escolares, conferências e campanhas." },
      { title: "Logos e Identidade Visual", description: "Criação do logótipo da tua empresa com opções de cartão de visita, papel timbrado e assinatura de email." },
      { title: "Convites Personalizados", description: "Convites para casamentos, festas, formaturas e eventos corporativos com design exclusivo." },
      { title: "Edição de Imagens", description: "Remoção de fundo, correcção de cor, redimensionamento e ajustes para uso profissional." },
      { title: "Design para Redes Sociais", description: "Posts, histórias e capas para Facebook, Instagram e WhatsApp Business." },
    ],
    steps: [
      { num: "1", title: "Diz o que precisas", desc: "Descreve o projecto — ou envia referências que gostes." },
      { num: "2", title: "Recebe a proposta", desc: "Enviamos um primeiro design em 24 horas." },
      { num: "3", title: "Aprovação e entrega", desc: "Fazes ajustes e aprovamos juntos. Entrega em PDF/PNG de alta resolução." },
    ],
    gallery: [
      { src: designImg, alt: "Design gráfico na Giseveral" },
      { src: printingImg, alt: "Impressão de materiais design" },
      { src: blogPrinting, alt: "Materiais impressos de qualidade" },
      { src: heroImg, alt: "Equipa Giseveral e Services" },
    ],
    testimonials: [
      { name: "Eduardo Macuácua", role: "Dono de restaurante", text: "Fizeram o logo do meu restaurante e ficou incrível! Profissional, moderno e com a identidade que eu queria. Super recomendado.", rating: 5 },
      { name: "Lurdes Bila", role: "Organizadora de eventos", text: "Encomendo todos os meus flyers aqui. São rápidos, criativos e os preços são muito acessíveis para o nível de qualidade.", rating: 5 },
      { name: "Tomás Chimoio", role: "Pastor", text: "Criaram os cartazes para os nossos eventos religiosos. Atentos aos detalhes e respeitaram tudo o que pedimos.", rating: 5 },
    ],
    prices: [
      { name: "Flyer simples (digital)", price: "500 MZN" },
      { name: "Logótipo", price: "1.500 MZN" },
      { name: "Cartão de visita (design)", price: "400 MZN" },
      { name: "Banner/cartaz (design)", price: "800 MZN" },
      { name: "Convite personalizado", price: "600 MZN" },
      { name: "Post redes sociais (pack 5)", price: "1.200 MZN" },
    ],
    relatedSlugs: ["reprografia", "informatica"],
  },

  informatica: {
    slug: "informatica",
    title: "Assistência Informática",
    subtitle: "Formatação, instalação de Windows, remoção de vírus e reparação na Beira.",
    metaTitle: "Assistência Informática na Beira | Formatação e Reparação — Giseveral",
    metaDescription: "Formatação de computadores, instalação de Windows, remoção de vírus e reparação na Beira. Serviço rápido e profissional em Moçambique.",
    keywords: "formatar computador Beira, instalar Windows Beira, remover vírus Beira, reparação PC Moçambique, informática Beira",
    hero: repairImg,
    heroAlt: "Técnico a reparar computador na Giseveral e Services, Beira",
    icon: Laptop,
    color: "from-teal-900 to-teal-700",
    subServices: [
      { title: "Formatação de Computadores", description: "Formatação completa com limpeza do sistema, backup de dados, instalação limpa e configuração inicial." },
      { title: "Instalação de Windows", description: "Windows 10 e 11 original com activação, drivers actualizados e software essencial (Office, antivírus, etc.)." },
      { title: "Remoção de Vírus e Malware", description: "Limpeza profissional de vírus, ransomware, adware e spyware que lentificam ou danificam o sistema." },
      { title: "Optimização de Desempenho", description: "Deixa o teu PC mais rápido sem precisar de comprar um novo — optimizamos arranque, RAM e disco." },
      { title: "Reparação de Hardware", description: "Diagnóstico e reparação de ecrãs, teclados, coolers, portas USB e problemas de placa-mãe." },
      { title: "Upgrade de Componentes", description: "Instalação de SSD, memória RAM, disco externo e outros componentes para melhorar o desempenho." },
    ],
    steps: [
      { num: "1", title: "Traz o equipamento", desc: "Traz o PC ou portátil à nossa loja — ou pede recolha." },
      { num: "2", title: "Diagnóstico gratuito", desc: "Analisamos o problema e damos orçamento sem compromisso." },
      { num: "3", title: "Reparação e entrega", desc: "A maioria dos serviços fica pronta no mesmo dia." },
    ],
    gallery: [
      { src: repairImg, alt: "Reparação de computadores na Beira" },
      { src: windowsImg, alt: "Instalação de Windows na Giseveral" },
      { src: technicianImg, alt: "Técnico informático Giseveral" },
      { src: blogFormat, alt: "Formatação de PC na Beira" },
      { src: blogAntivirus, alt: "Remoção de vírus" },
      { src: blogPrinterChoice, alt: "Assistência técnica informática" },
    ],
    testimonials: [
      { name: "Hélder Mondlane", role: "Estudante universitário", text: "O meu portátil estava com vírus e muito lento. Em 3 horas ficou como novo, com o Windows reinstalado e tudo. Preço muito justo!", rating: 5 },
      { name: "Graça Tivane", role: "Secretária", text: "Formataram o computador do escritório e instalaram o Office. Profissionais, rápidos e explicaram tudo o que fizeram. Excelente!", rating: 5 },
      { name: "Rui Cossa", role: "Empresário", text: "Já levei 3 computadores à Giseveral para formatação. São sempre rápidos, o preço é fixo e nunca tive problemas depois.", rating: 5 },
    ],
    prices: [
      { name: "Formatação completa + Windows", price: "700 MZN" },
      { name: "Remoção de vírus", price: "300 MZN" },
      { name: "Instalação de software (pack)", price: "200 MZN" },
      { name: "Optimização de desempenho", price: "250 MZN" },
      { name: "Diagnóstico", price: "Grátis" },
      { name: "Upgrade SSD (instalação)", price: "300 MZN", note: "componente à parte" },
    ],
    relatedSlugs: ["redes", "design-grafico"],
  },

  redes: {
    slug: "redes",
    title: "Redes e Tecnologia",
    subtitle: "Instalação de internet, Wi-Fi, cabeamento e configuração de redes na Beira.",
    metaTitle: "Instalação de Redes e Wi-Fi na Beira | Giseveral e Services",
    metaDescription: "Instalação e configuração de internet, Wi-Fi, routers e cabeamento de rede na Beira, Moçambique. Diagnóstico gratuito para empresas e particulares.",
    keywords: "instalar internet Beira, Wi-Fi Beira, configurar router Beira, cabeamento rede Moçambique, redes informáticas Beira",
    hero: networkImg,
    heroAlt: "Instalação de redes e Wi-Fi na Giseveral e Services, Beira",
    icon: Network,
    color: "from-emerald-900 to-emerald-700",
    subServices: [
      { title: "Instalação de Wi-Fi", description: "Configuração de rede Wi-Fi para casa ou escritório — cobertura total, segurança e velocidade máxima." },
      { title: "Configuração de Routers", description: "Configuração completa de qualquer marca de router: senhas, filtros, parental control e optimização de canal." },
      { title: "Cabeamento Estruturado (LAN)", description: "Instalação de rede cabeada Cat5e/Cat6 para escritórios, empresas e locais que precisam de máxima estabilidade." },
      { title: "Diagnóstico de Rede", description: "Análise completa de problemas de conectividade, velocidade lenta e quedas frequentes de internet." },
      { title: "Extensores e Repetidores Wi-Fi", description: "Instalação de repetidores e access points para eliminar zonas mortas de sinal na casa ou empresa." },
      { title: "Redes para Empresas", description: "Projectos de rede completos com switch, patch panel, rack e documentação técnica para PMEs." },
    ],
    steps: [
      { num: "1", title: "Contacta-nos", desc: "Descreve o problema ou pede instalação nova — vamos ao local avaliar." },
      { num: "2", title: "Orçamento gratuito", desc: "Avaliamos in loco e apresentamos proposta sem compromisso." },
      { num: "3", title: "Instalação profissional", desc: "A nossa equipa instala e testa até tudo funcionar na perfeição." },
    ],
    gallery: [
      { src: networkImg, alt: "Instalação de rede profissional" },
      { src: routerImg, alt: "Configuração de router Wi-Fi na Beira" },
      { src: blogWifi, alt: "Melhorar sinal Wi-Fi" },
      { src: blogCabling, alt: "Cabeamento estruturado para empresas" },
    ],
    testimonials: [
      { name: "Fernando Cumbe", role: "Dono de café", text: "Instalaram o Wi-Fi do meu café e configuraram tudo de raiz. Agora os clientes têm internet estável e eu não tenho mais problemas de sinal.", rating: 5 },
      { name: "Inês Guambe", role: "Directora de escola", text: "A escola precisava de uma rede para o laboratório de informática. A Giseveral fez o cabeamento completo num único dia. Perfeito!", rating: 5 },
      { name: "Mário Chaúque", role: "Engenheiro", text: "Router configurado correctamente pela primeira vez — velocidade máxima em toda a casa. Antes tinha sinal só num quarto!", rating: 4 },
    ],
    prices: [
      { name: "Configuração de router", price: "500 MZN" },
      { name: "Instalação de Wi-Fi (casa)", price: "800 MZN" },
      { name: "Repetidor Wi-Fi (instalação)", price: "400 MZN" },
      { name: "Diagnóstico de rede", price: "Grátis" },
      { name: "Cabeamento LAN (por ponto)", price: "1.500 MZN", note: "materiais incluídos" },
      { name: "Rede empresarial (orçamento)", price: "Contactar" },
    ],
    relatedSlugs: ["informatica", "reprografia"],
  },
};

const relatedLabels: Record<string, string> = {
  reprografia: "Reprografia",
  papelaria: "Papelaria",
  "design-grafico": "Design Gráfico",
  informatica: "Informática",
  redes: "Redes e Tecnologia",
};

export const Route = createFileRoute("/servicos/$slug")({
  loader: ({ params }) => {
    const service = SERVICES[params.slug];
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.service;
    if (!s) return { meta: [{ title: "Serviço — Giseveral e Services" }] };
    return {
      meta: [
        { title: s.metaTitle },
        { name: "description", content: s.metaDescription },
        { name: "keywords", content: s.keywords },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: s.metaTitle },
        { property: "og:description", content: s.metaDescription },
        { property: "og:type", content: "service" },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-brand">Serviço não encontrado</h1>
        <Link to="/servicos" className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">
          <ArrowLeft className="h-4 w-4" /> Ver todos os serviços
        </Link>
      </section>
    </Layout>
  ),
  component: ServicoPage,
});

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "text-gold fill-gold" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function ServicoPage() {
  const { service: s } = Route.useLoaderData();
  const Icon = s.icon;

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[420px] flex items-center">
        <img
          src={s.hero}
          alt={s.heroAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${s.color} opacity-85`} />
        <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-5xl">
          <Link
            to="/servicos"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-gold transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os serviços
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold">Giseveral e Services · Beira</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">{s.title}</h1>
          <p className="mt-4 text-lg md:text-xl text-white/85 max-w-2xl">{s.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://wa.me/258874383621"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-smooth"
            >
              <MessageCircle className="h-4 w-4" /> Pedir Orçamento
            </a>
            <a
              href="tel:+258874383621"
              className="inline-flex items-center gap-2 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/30 transition-smooth"
            >
              <Phone className="h-4 w-4" /> 874 383 621
            </a>
          </div>
        </div>
      </section>

      {/* ── SUB-SERVICES ─────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">O que incluímos</h2>
        <p className="text-muted-foreground mb-8">Todos os serviços disponíveis nesta categoria.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {s.subServices.map((srv) => (
            <div
              key={srv.title}
              className="group rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-smooth"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-brand mb-3">
                <Check className="h-4 w-4 text-brand-foreground" />
              </div>
              <h3 className="font-bold text-brand">{srv.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{srv.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="bg-muted/40 py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-brand mb-8 text-center">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {s.steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground text-xl font-bold mb-4 shadow-card">
                  {step.num}
                </div>
                {i < s.steps.length - 1 && (
                  <div className="hidden md:block absolute translate-x-28 mt-6 text-muted-foreground/30">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
                <h3 className="font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">Galeria</h2>
        <p className="text-muted-foreground mb-8">Imagens do nosso trabalho e equipamentos.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {s.gallery.map((img, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-xl ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover aspect-square md:aspect-auto hover:scale-105 transition-smooth"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section className="bg-muted/40 py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2 text-center">Preços</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">Preços indicativos. Orçamento detalhado via WhatsApp.</p>
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gradient-brand text-brand-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Serviço</th>
                  <th className="text-right px-5 py-3 font-semibold">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.prices.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-smooth">
                    <td className="px-5 py-3 text-foreground/90">{p.name}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-brand">{p.price}</span>
                      {p.note && <span className="ml-1.5 text-xs text-muted-foreground">({p.note})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">O que dizem os clientes</h2>
        <p className="text-muted-foreground mb-8">Experiências reais de clientes da Beira.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {s.testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col gap-3"
            >
              <StarRating rating={t.rating} />
              <p className="text-sm text-foreground/85 leading-relaxed flex-1">"{t.text}"</p>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="bg-gradient-hero text-brand-foreground py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">Giseveral e Services · Beira, Moçambique</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">Pronto para começar?</h2>
          <p className="mt-3 text-brand-foreground/80 max-w-lg mx-auto">
            Fala connosco hoje — orçamento gratuito, resposta rápida e atendimento profissional.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/258874383621"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-smooth"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp agora
            </a>
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-card hover:shadow-glow transition-smooth"
            >
              Encomendar online
            </Link>
            <a
              href="tel:+258874383621"
              className="inline-flex items-center gap-2 rounded-md border border-brand-foreground/30 px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-foreground/10 transition-smooth"
            >
              <Phone className="h-4 w-4" /> 874 383 621
            </a>
          </div>
          <p className="mt-5 text-xs text-brand-foreground/60">Beira, Esturro • Rua Alfredo Lawley · Seg–Sáb 8h–18h</p>
        </div>
      </section>

      {/* ── RELATED SERVICES ─────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-xl font-bold text-brand mb-5">Outros serviços</h2>
        <div className="flex flex-wrap gap-3">
          {s.relatedSlugs.map((slug) => (
            <Link
              key={slug}
              to="/servicos/$slug"
              params={{ slug }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-gold hover:text-brand transition-smooth shadow-card"
            >
              {relatedLabels[slug]} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ))}
          <Link
            to="/servicos"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-brand transition-smooth"
          >
            Ver todos os serviços
          </Link>
        </div>
      </section>

      <WhatsAppFab />
    </Layout>
  );
}
