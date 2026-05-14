/**
 * GISEVERAL DYNAMIC SITEMAP
 * ==========================
 * Generates sitemap.xml with all static and dynamic pages
 * Updates automatically when products/scholarships are added
 */

import { createAPIFileRoute } from "@tanstack/start/api";
import { createClient } from "@supabase/supabase-js";

const DOMAIN = "https://giseveral.com";

// Create Supabase client for server-side
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Static pages with priority and changefreq
const STATIC_PAGES = [
  { url: "/", priority: 1.0, changefreq: "daily" },
  { url: "/sobre", priority: 0.9, changefreq: "monthly" },
  { url: "/loja", priority: 0.9, changefreq: "daily" },
  { url: "/loja/papelaria", priority: 0.8, changefreq: "weekly" },
  { url: "/hub", priority: 0.9, changefreq: "daily" },
  { url: "/hub/bolsas", priority: 0.9, changefreq: "weekly" },
  { url: "/hub/exames", priority: 0.8, changefreq: "weekly" },
  { url: "/hub/noticias", priority: 0.8, changefreq: "daily" },
  { url: "/hub/documentos", priority: 0.7, changefreq: "monthly" },
  { url: "/hub/cartas", priority: 0.7, changefreq: "monthly" },
  { url: "/hub/explorar", priority: 0.7, changefreq: "weekly" },
  { url: "/hub/cv", priority: 0.8, changefreq: "monthly" },
  { url: "/servicos", priority: 0.8, changefreq: "monthly" },
  { url: "/servicos/reprografia", priority: 0.7, changefreq: "monthly" },
  { url: "/servicos/papelaria", priority: 0.7, changefreq: "monthly" },
  { url: "/servicos/design-grafico", priority: 0.7, changefreq: "monthly" },
  { url: "/servicos/informatica", priority: 0.7, changefreq: "monthly" },
  { url: "/servicos/redes", priority: 0.7, changefreq: "monthly" },
  { url: "/blog", priority: 0.7, changefreq: "weekly" },
  { url: "/galeria", priority: 0.6, changefreq: "monthly" },
  { url: "/contactos", priority: 0.8, changefreq: "monthly" },
  { url: "/precos", priority: 0.8, changefreq: "weekly" },
  { url: "/orcamento", priority: 0.9, changefreq: "monthly" },
  { url: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
  { url: "/terms", priority: 0.3, changefreq: "yearly" },
];

export const Route = createAPIFileRoute("/sitemap.xml")({
  GET: async () => {
    try {
      // Fetch active products
      const { data: products } = await supabase
        .from("products")
        .select("id, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(1000);

      // Fetch active scholarships
      const { data: scholarships } = await supabase
        .from("scholarships")
        .select("id, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(1000);

      // Fetch blog posts
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false })
        .limit(100);

      // Fetch news
      const { data: news } = await supabase
        .from("news")
        .select("id, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(100);

      // Fetch exams
      const { data: exams } = await supabase
        .from("exams")
        .select("id, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(100);

      // Build XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

  <!-- ── Static Pages ── -->
`;

      // Add static pages
      for (const page of STATIC_PAGES) {
        xml += `  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
`;
      }

      xml += `
  <!-- ── Dynamic: Products ── -->
`;

      // Add products
      if (products && products.length > 0) {
        for (const product of products) {
          const lastmod = product.updated_at
            ? new Date(product.updated_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          xml += `  <url>
    <loc>${DOMAIN}/loja/produto/${product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        }
      }

      xml += `
  <!-- ── Dynamic: Scholarships ── -->
`;

      // Add scholarships
      if (scholarships && scholarships.length > 0) {
        for (const scholarship of scholarships) {
          const lastmod = scholarship.updated_at
            ? new Date(scholarship.updated_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          xml += `  <url>
    <loc>${DOMAIN}/hub/bolsas/${scholarship.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        }
      }

      xml += `
  <!-- ── Dynamic: Blog Posts ── -->
`;

      // Add blog posts
      if (posts && posts.length > 0) {
        for (const post of posts) {
          const lastmod = post.updated_at
            ? new Date(post.updated_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          xml += `  <url>
    <loc>${DOMAIN}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        }
      }

      xml += `
  <!-- ── Dynamic: News ── -->
`;

      // Add news
      if (news && news.length > 0) {
        for (const item of news) {
          const lastmod = item.updated_at
            ? new Date(item.updated_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          xml += `  <url>
    <loc>${DOMAIN}/hub/noticias/${item.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        }
      }

      xml += `
  <!-- ── Dynamic: Exams ── -->
`;

      // Add exams
      if (exams && exams.length > 0) {
        for (const exam of exams) {
          const lastmod = exam.updated_at
            ? new Date(exam.updated_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          xml += `  <url>
    <loc>${DOMAIN}/hub/exames/${exam.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        }
      }

      xml += `
</urlset>`;

      return new Response(xml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch (error) {
      console.error("Error generating sitemap:", error);

      // Return minimal sitemap on error
      const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

      return new Response(fallbackXml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    }
  },
});
