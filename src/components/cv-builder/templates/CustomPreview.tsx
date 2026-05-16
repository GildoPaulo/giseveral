import { useMemo } from "react";
import type { CvData } from "../types";
import { a4PageStyle } from "./templateStyles";
import { exportCvToHtmlBody } from "../cvExports";

interface Props {
  data: CvData;
  html: string;
  css?: string;
}

/**
 * Renders an admin-created CV template stored in cv_templates.html_content.
 * Supports two placeholder formats so the admin doesn't have to learn a new
 * syntax:
 *
 *   1) Direct field tokens — substituted in-place:
 *      {{nome}} {{apelido}} {{titulo}} {{email}} {{telefone}}
 *      {{localizacao}} {{cidade}} {{pais}} {{nacionalidade}}
 *      {{linkedin}} {{website}} {{portfolio}} {{endereco}}
 *      {{objetivo}}
 *
 *   2) Auto-rendered section blocks — replaced with formatted HTML lists:
 *      {{experiencia_html}} {{educacao_html}} {{skills_html}}
 *      {{idiomas_html}} {{projetos_html}} {{certificacoes_html}}
 *
 *   3) Single token {{cv_completo}} dumps the full CV HTML body — useful
 *      when the admin just wants header + automatic body.
 */
function renderTokens(html: string, data: CvData): string {
  const p = data.personal;
  const map: Record<string, string> = {
    nome:           p.nome ?? "",
    apelido:        p.apelido ?? "",
    nome_completo:  [p.nome, p.apelido].filter(Boolean).join(" "),
    titulo:         p.titulo ?? "",
    email:          p.email ?? "",
    telefone:       p.telefone ?? "",
    localizacao:    p.localizacao ?? "",
    endereco:       p.endereco ?? "",
    codigo_postal:  p.codigoPostal ?? "",
    cidade:         p.cidade ?? p.localizacao ?? "",
    pais:           p.pais ?? "",
    nacionalidade:  p.nacionalidade ?? "",
    linkedin:       p.linkedin ?? "",
    website:        p.website ?? "",
    portfolio:      p.portfolio ?? "",
    carta_conducao: p.cartaConducao ? "Sim" : "",
    foto:           p.foto ?? "",
    objetivo:       data.objetivo ?? "",
  };

  // Section HTML — built once via the shared exporter so all formats stay
  // consistent (.doc, .html, custom template all use the same renderer).
  const fullBody = exportCvToHtmlBody(data);
  const sections = extractSections(fullBody);

  let out = html;
  for (const [k, v] of Object.entries(map)) {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), escapeHtml(v));
  }
  for (const [key, snippet] of Object.entries(sections)) {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), snippet);
  }
  out = out.replace(/{{\s*cv_completo\s*}}/g, fullBody);
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Split the unified HTML body produced by `exportCvToHtmlBody` into named
 * section snippets so individual `{{*_html}}` placeholders work.
 */
function extractSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const re = /<section[\s\S]*?<h2[^>]*>([^<]+)<\/h2>([\s\S]*?)<\/section>/gi;
  const labelToKey: Record<string, string> = {
    "resumo profissional":     "resumo_html",
    "experiência profissional":"experiencia_html",
    "experiencia profissional":"experiencia_html",
    "educação":                "educacao_html",
    "educacao":                "educacao_html",
    "competências":            "skills_html",
    "competencias":            "skills_html",
    "idiomas":                 "idiomas_html",
    "projectos":               "projetos_html",
    "projetos":                "projetos_html",
    "certificações":           "certificacoes_html",
    "certificacoes":           "certificacoes_html",
  };
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const label = m[1].trim().toLowerCase();
    const key = labelToKey[label];
    if (key) sections[key] = m[0];
  }
  return sections;
}

export function CustomPreview({ data, html, css }: Props) {
  const rendered = useMemo(() => renderTokens(html ?? "", data), [html, data]);
  const safeCss = useMemo(() => (css ?? "")
    // Scope css to the template root so it doesn't leak into the editor UI
    .replace(/}\s*/g, "} ")
    .trim(),
  [css]);

  if (!html || !html.trim()) {
    return (
      <div style={a4PageStyle}>
        <div style={{ padding: "3cm 2.5cm", textAlign: "center", color: "#888", fontFamily: "Inter, sans-serif" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Template sem conteúdo HTML</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>
            Adiciona <code>html_content</code> e <code>css_content</code> no admin de templates.
          </p>
          <p style={{ fontSize: 11, marginTop: 12, lineHeight: 1.6, maxWidth: 480, marginInline: "auto" }}>
            Placeholders suportados: <code>{`{{nome}}`}</code>, <code>{`{{titulo}}`}</code>,
            <code>{`{{email}}`}</code>, <code>{`{{telefone}}`}</code>, <code>{`{{objetivo}}`}</code>,
            <code>{`{{experiencia_html}}`}</code>, <code>{`{{educacao_html}}`}</code>,
            <code>{`{{skills_html}}`}</code>, <code>{`{{cv_completo}}`}</code>, …
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={a4PageStyle}>
      {safeCss && <style>{safeCss}</style>}
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: rendered }} />
    </div>
  );
}
