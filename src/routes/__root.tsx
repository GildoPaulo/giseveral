import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Giseveral e Services — Reprografia, Papelaria e Tecnologia | Beira, Moçambique" },
      { name: "description", content: "Giseveral e Services: reprografia, impressão, papelaria, informática, redes e Hub académico na Beira, Moçambique. Orçamento grátis." },
      { name: "keywords", content: "reprografia Beira, impressão Moçambique, papelaria Beira, informática Beira, redes Moçambique, documentos académicos, bolsas de estudo" },
      { name: "author", content: "Giseveral e Services" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#1a3a6b" },
      // Open Graph
      { property: "og:site_name", content: "Giseveral e Services" },
      { property: "og:title", content: "Giseveral e Services — Beira, Moçambique" },
      { property: "og:description", content: "Reprografia, papelaria, tecnologia e Hub académico. Da impressão à tecnologia, resolvemos tudo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://giseveral.com" },
      { property: "og:image", content: "https://giseveral.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "pt_MZ" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Giseveral e Services" },
      { name: "twitter:description", content: "Reprografia, papelaria e tecnologia na Beira, Moçambique." },
      { name: "twitter:image", content: "https://giseveral.com/og-image.jpg" },
      // Schema.org (LocalBusiness)
      { name: "application/ld+json", content: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Giseveral e Services",
        "url": "https://giseveral.com",
        "logo": "https://giseveral.com/logo.jpeg",
        "description": "Soluções completas em reprografia, papelaria, informática e redes na Beira, Moçambique.",
        "address": { "@type": "PostalAddress", "addressLocality": "Beira", "addressCountry": "MZ" },
        "telephone": "+258874383621",
        "openingHours": "Mo-Fr 08:00-17:00",
        "priceRange": "$$",
        "sameAs": []
      })},
    ],
    links: [
      { rel: "stylesheet", href: appCss ?? "/assets/styles.css" },
      { rel: "canonical", href: "https://giseveral.com" },
      { rel: "icon", type: "image/jpeg", href: "/logo.jpeg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon.jpeg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
        {/* Umami Analytics */}
        <script defer src="https://cloud.umami.is/script.js" data-website-id="d4d93fe5-a539-4151-9e19-8f8316787e92" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
