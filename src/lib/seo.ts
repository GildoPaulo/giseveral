/**
 * GISEVERAL SEO UTILITIES
 * ========================
 * Sistema completo de SEO com meta tags, Open Graph, Twitter Cards e JSON-LD
 * Para aparecer bem no Google, Facebook, Twitter e WhatsApp
 */

export type SEOConfig = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noindex?: boolean;
  nofollow?: boolean;
};

const SITE_CONFIG = {
  name: "Giseveral e Services",
  domain: "giseveral.vercel.app",
  url: "https://giseveral.vercel.app",
  logo: "https://giseveral.vercel.app/icon.jpeg",
  locale: "pt_MZ",
  twitter: "@giseveral", // atualizar quando tiver
  facebook: "giseveral", // atualizar quando tiver
  phone: "+258 87 438 3621",
  email: "geral@giseveral.com",
  address: {
    street: "Rua Alfredo Lawley",
    city: "Beira",
    region: "Sofala",
    country: "Moçambique",
    postalCode: "2100",
  },
};

/**
 * Gera meta tags para <head> - usar com TanStack Router head()
 */
export function generateSEOMeta(config: SEOConfig) {
  const {
    title,
    description,
    image = SITE_CONFIG.logo,
    url = SITE_CONFIG.url,
    type = "website",
    author,
    publishedTime,
    modifiedTime,
    keywords,
    noindex = false,
    nofollow = false,
  } = config;

  const fullTitle = title.includes(SITE_CONFIG.name) ? title : `${title} | ${SITE_CONFIG.name}`;
  const fullUrl = url.startsWith("http") ? url : `${SITE_CONFIG.url}${url}`;
  const fullImage = image.startsWith("http") ? image : `${SITE_CONFIG.url}${image}`;

  const meta: Array<Record<string, string>> = [
    // Basic meta tags
    { name: "description", content: description },
    { name: "author", content: author || SITE_CONFIG.name },

    // Open Graph (Facebook, LinkedIn, WhatsApp)
    { property: "og:site_name", content: SITE_CONFIG.name },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: fullImage },
    { property: "og:url", content: fullUrl },
    { property: "og:type", content: type },
    { property: "og:locale", content: SITE_CONFIG.locale },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: SITE_CONFIG.twitter },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: fullImage },
    { name: "twitter:creator", content: author || SITE_CONFIG.twitter },

    // Mobile
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
    { name: "theme-color", content: "#1a3a6b" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },

    // SEO extras
    { name: "robots", content: noindex || nofollow ? `${noindex ? "noindex" : "index"},${nofollow ? "nofollow" : "follow"}` : "index,follow" },
    { name: "googlebot", content: "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" },
    { name: "bingbot", content: "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" },

    // Geo
    { name: "geo.region", content: "MZ-S" }, // Sofala
    { name: "geo.placename", content: "Beira" },
    { name: "geo.position", content: "-19.8436;34.8389" }, // Coordenadas de Beira
  ];

  // Keywords (se fornecidos)
  if (keywords && keywords.length > 0) {
    meta.push({ name: "keywords", content: keywords.join(", ") });
  }

  // Article meta (para blog posts)
  if (type === "article") {
    if (publishedTime) meta.push({ property: "article:published_time", content: publishedTime });
    if (modifiedTime) meta.push({ property: "article:modified_time", content: modifiedTime });
    if (author) meta.push({ property: "article:author", content: author });
  }

  return {
    title: fullTitle,
    meta,
    link: [
      { rel: "canonical", href: fullUrl },
      { rel: "icon", type: "image/jpeg", href: "/icon.jpeg" },
      { rel: "apple-touch-icon", href: "/icon.jpeg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  };
}

/**
 * JSON-LD para Structured Data (Google Knowledge Graph)
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    legalName: "Giseveral e Services, Lda",
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    image: SITE_CONFIG.logo,
    description: "Reprografia, papelaria, design gráfico, tecnologia e Hub académico na Beira, Moçambique. Serviços premium de impressão, produtos de escritório e suporte informático.",
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.region,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: "MZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -19.8436,
      longitude: 34.8389,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "14:00",
      },
    ],
    priceRange: "$$",
    servesCuisine: null,
    areaServed: {
      "@type": "City",
      name: "Beira",
    },
    founder: {
      "@type": "Person",
      name: "Gildo Paulo Correia",
      jobTitle: "CEO & Founder",
    },
    sameAs: [
      // Adicionar quando estiverem disponíveis:
      // "https://www.facebook.com/giseveral",
      // "https://www.instagram.com/giseveral",
      // "https://www.linkedin.com/company/giseveral",
      // "https://twitter.com/giseveral",
    ],
  };
}

/**
 * JSON-LD para o CEO (Knowledge Panel do Google)
 */
export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_CONFIG.url}/sobre#person`,
    name: "Gildo Paulo Correia",
    givenName: "Gildo Paulo",
    familyName: "Correia",
    jobTitle: "CEO & Founder",
    worksFor: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    url: `${SITE_CONFIG.url}/sobre`,
    image: `${SITE_CONFIG.url}/icon.jpeg`, // atualizar com foto do CEO
    email: SITE_CONFIG.email,
    telephone: SITE_CONFIG.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Beira",
      addressRegion: "Sofala",
      addressCountry: "MZ",
    },
    nationality: {
      "@type": "Country",
      name: "Moçambique",
    },
    knowsAbout: [
      "E-commerce",
      "Digital Transformation",
      "Business Management",
      "Technology",
      "Education Technology",
    ],
    description: "Empreendedor moçambicano, fundador e CEO da Giseveral e Services, empresa líder em reprografia, papelaria e soluções digitais em Beira, Moçambique.",
    sameAs: [
      // Adicionar quando estiverem disponíveis:
      // "https://www.linkedin.com/in/gildopaulocorreia",
      // "https://github.com/GildoPaulo",
      `${SITE_CONFIG.url}/sobre`,
    ],
  };
}

/**
 * JSON-LD para produtos (e-commerce)
 */
export function generateProductSchema(product: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  brand: string | null;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_CONFIG.url}/loja/produto/${product.id}#product`,
    name: product.name,
    description: product.description || `Compre ${product.name} na ${SITE_CONFIG.name}`,
    image: product.image || SITE_CONFIG.logo,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      url: `${SITE_CONFIG.url}/loja/produto/${product.id}`,
      priceCurrency: "MZN",
      price: product.price,
      availability: product.availability === "out_of_stock"
        ? "https://schema.org/OutOfStock"
        : product.availability === "preorder"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
  };
}

/**
 * JSON-LD para breadcrumbs
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Helper para serializar JSON-LD (usar com dangerouslySetInnerHTML)
 * @example
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: serializeJSONLD(schema) }}
 * />
 */
export function serializeJSONLD(schema: Record<string, unknown> | Array<Record<string, unknown>>): string {
  return JSON.stringify(schema);
}

/**
 * Helper rápido para páginas comuns
 */
export const SEO_PRESETS = {
  home: (): SEOConfig => ({
    title: "Giseveral e Services — Reprografia, Papelaria e Hub Académico em Beira",
    description: "Serviços premium de impressão, design gráfico, papelaria e tecnologia na Beira, Moçambique. Hub académico com bolsas de estudo, exames e documentos.",
    keywords: ["giseveral", "reprografia beira", "papelaria moçambique", "impressão beira", "hub académico", "bolsas de estudo"],
    url: "/",
  }),

  loja: (): SEOConfig => ({
    title: "Loja de Papelaria e Tecnologia",
    description: "Compre produtos de papelaria, material de escritório e equipamentos tecnológicos na Giseveral. Entrega em Beira e todo Moçambique.",
    keywords: ["loja papelaria beira", "material escritório moçambique", "tecnologia beira"],
    url: "/loja",
  }),

  hub: (): SEOConfig => ({
    title: "Hub Académico — Bolsas, Exames e Documentos",
    description: "Hub académico gratuito: bolsas de estudo internacionais 2026, exames de admissão, cartas de motivação e documentos académicos.",
    keywords: ["bolsas de estudo moçambique", "exames admissão", "hub académico beira"],
    url: "/hub",
  }),

  sobre: (): SEOConfig => ({
    title: "Sobre a Giseveral e Services",
    description: "Conheça a história da Giseveral e Services, empresa líder em reprografia e tecnologia em Beira, fundada por Gildo Paulo Correia.",
    type: "profile",
    url: "/sobre",
  }),
};
