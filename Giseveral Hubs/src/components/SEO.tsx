import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Lightweight SEO manager: title, meta description, canonical, OG tags, JSON-LD.
 */
export const SEO = ({
  title,
  description,
  canonical,
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  type = "website",
  jsonLd,
}: SEOProps) => {
  useEffect(() => {
    const trimmedTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    const trimmedDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;
    document.title = trimmedTitle;

    upsertMeta('meta[name="description"]', "name", "description", trimmedDesc);
    upsertMeta('meta[property="og:title"]', "property", "og:title", trimmedTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", trimmedDesc);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", trimmedTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", trimmedDesc);

    const url = canonical ?? (typeof window !== "undefined" ? window.location.href : "");
    if (url) upsertLink("canonical", url);

    // JSON-LD
    const existing = document.head.querySelector('script[data-seo-jsonld="true"]');
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, type, jsonLd]);

  return null;
};
