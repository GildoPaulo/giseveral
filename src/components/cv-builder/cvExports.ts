/**
 * Multi-format CV exports — companion to pdfExport.ts.
 *
 * • .doc — Microsoft Word (HTML wrapped in Word namespaces)
 * • .rtf — Word / LibreOffice / Google Docs (handcrafted RTF)
 * • .html — standalone styled HTML
 * • .txt — plain text from the CvData structure
 *
 * PDF stays in pdfExport.ts (it rasterises the live preview via html2canvas).
 */
import type { CvData } from "./types";

function safeBase(data: CvData): string {
  const name = (data.personal.nome || "cv").trim().replace(/\s+/g, "-").toLowerCase();
  const apelido = (data.personal.apelido || "").trim().replace(/\s+/g, "-").toLowerCase();
  return [name, apelido].filter(Boolean).join("-") || "cv";
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

// ── TXT ──────────────────────────────────────────────────────────

export function exportCvToTxt(data: CvData): string {
  const lines: string[] = [];
  const pers = data.personal;
  const fullName = [pers.nome, pers.apelido].filter(Boolean).join(" ");
  lines.push(fullName.toUpperCase());
  if (pers.titulo) lines.push(pers.titulo);
  lines.push("");

  const contactBits = [
    pers.email, pers.telefone, pers.localizacao || pers.cidade,
    pers.linkedin, pers.website, pers.portfolio,
  ].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(" · "));
  if (pers.endereco || pers.codigoPostal || pers.pais) {
    lines.push([pers.endereco, pers.codigoPostal, pers.pais].filter(Boolean).join(", "));
  }
  if (pers.nacionalidade) lines.push(`Nacionalidade: ${pers.nacionalidade}`);
  if (pers.cartaConducao) lines.push("Carta de condução: sim");
  lines.push("");

  if (data.objetivo) {
    lines.push("RESUMO PROFISSIONAL");
    lines.push("───────────────────");
    lines.push(data.objetivo);
    lines.push("");
  }

  if (data.experiencia.length && data.sections.experiencia.visible) {
    lines.push("EXPERIÊNCIA PROFISSIONAL");
    lines.push("────────────────────────");
    for (const e of data.experiencia) {
      const periodo = `${e.inicio || "?"} — ${e.atual ? "Presente" : (e.fim || "?")}`;
      lines.push(`${e.cargo}${e.empresa ? ` @ ${e.empresa}` : ""} (${periodo})`);
      if (e.localizacao) lines.push(`  ${e.localizacao}`);
      const bullets = (e.bullets ?? []).filter((b) => b.trim());
      if (bullets.length) {
        for (const b of bullets) lines.push(`  • ${b}`);
      } else if (e.descricao) {
        lines.push(`  ${e.descricao}`);
      }
      lines.push("");
    }
  }

  if (data.educacao.length && data.sections.educacao.visible) {
    lines.push("EDUCAÇÃO");
    lines.push("────────");
    for (const ed of data.educacao) {
      lines.push(`${ed.grau} — ${ed.curso}`);
      lines.push(`  ${ed.instituicao} (${ed.anoInicio}–${ed.anoFim})${ed.nota ? ` · ${ed.nota}` : ""}`);
      if (ed.descricao) lines.push(`  ${ed.descricao}`);
      lines.push("");
    }
  }

  if (data.skills.length && data.sections.skills.visible) {
    lines.push("COMPETÊNCIAS");
    lines.push("────────────");
    lines.push(data.skills.map((s) => `${s.nome} (${s.nivel})`).join(", "));
    lines.push("");
  }

  if (data.idiomas.length && data.sections.idiomas.visible) {
    lines.push("IDIOMAS");
    lines.push("───────");
    lines.push(data.idiomas.map((i) => `${i.idioma} — ${i.nivel}`).join(", "));
    lines.push("");
  }

  if (data.projetos.length && data.sections.projetos.visible) {
    lines.push("PROJECTOS");
    lines.push("─────────");
    for (const p of data.projetos) {
      lines.push(`${p.nome}${p.tecnologias ? ` [${p.tecnologias}]` : ""}`);
      if (p.descricao) lines.push(`  ${p.descricao}`);
      if (p.url) lines.push(`  ${p.url}`);
      lines.push("");
    }
  }

  if (data.certificacoes.length && data.sections.certificacoes.visible) {
    lines.push("CERTIFICAÇÕES");
    lines.push("─────────────");
    for (const c of data.certificacoes) {
      lines.push(`${c.nome} — ${c.emissor} (${c.data})${c.url ? ` · ${c.url}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadCvTxt(data: CvData) {
  const blob = new Blob([exportCvToTxt(data)], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${safeBase(data)}.txt`);
}

// ── RTF ──────────────────────────────────────────────────────────

function rtfEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/[^\x00-\x7F]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
}

function rtfParagraph(text: string, bold = false, size = 22): string {
  const escaped = rtfEscape(text).replace(/\n/g, "\\par ");
  return `{\\fs${size}${bold ? "\\b" : ""} ${escaped}\\par}`;
}

export function exportCvToRtf(data: CvData): string {
  const parts: string[] = [];
  const pers = data.personal;
  const fullName = [pers.nome, pers.apelido].filter(Boolean).join(" ");

  parts.push(rtfParagraph(fullName.toUpperCase(), true, 32));
  if (pers.titulo) parts.push(rtfParagraph(pers.titulo, false, 24));
  const contact = [pers.email, pers.telefone, pers.localizacao || pers.cidade, pers.linkedin, pers.website, pers.portfolio]
    .filter(Boolean).join(" · ");
  if (contact) parts.push(rtfParagraph(contact, false, 18));
  parts.push("\\par");

  function section(title: string, body: string[]) {
    if (body.length === 0) return;
    parts.push(rtfParagraph(title.toUpperCase(), true, 24));
    for (const line of body) parts.push(rtfParagraph(line));
    parts.push("\\par");
  }

  if (data.objetivo) section("Resumo Profissional", [data.objetivo]);

  if (data.sections.experiencia.visible && data.experiencia.length) {
    const body: string[] = [];
    for (const e of data.experiencia) {
      const period = `${e.inicio || "?"} — ${e.atual ? "Presente" : (e.fim || "?")}`;
      body.push(`${e.cargo}${e.empresa ? ` @ ${e.empresa}` : ""} (${period})`);
      const bullets = (e.bullets ?? []).filter((b) => b.trim());
      if (bullets.length) {
        for (const b of bullets) body.push(`• ${b}`);
      } else if (e.descricao) {
        body.push(e.descricao);
      }
    }
    section("Experiência Profissional", body);
  }

  if (data.sections.educacao.visible && data.educacao.length) {
    const body: string[] = [];
    for (const ed of data.educacao) {
      body.push(`${ed.grau} — ${ed.curso}`);
      body.push(`${ed.instituicao} (${ed.anoInicio}–${ed.anoFim})${ed.nota ? ` · ${ed.nota}` : ""}`);
      if (ed.descricao) body.push(ed.descricao);
    }
    section("Educação", body);
  }

  if (data.sections.skills.visible && data.skills.length) {
    section("Competências", [data.skills.map((s) => `${s.nome} (${s.nivel})`).join(", ")]);
  }

  if (data.sections.idiomas.visible && data.idiomas.length) {
    section("Idiomas", [data.idiomas.map((i) => `${i.idioma} — ${i.nivel}`).join(", ")]);
  }

  if (data.sections.projetos.visible && data.projetos.length) {
    const body: string[] = [];
    for (const p of data.projetos) {
      body.push(`${p.nome}${p.tecnologias ? ` [${p.tecnologias}]` : ""}`);
      if (p.descricao) body.push(p.descricao);
      if (p.url) body.push(p.url);
    }
    section("Projectos", body);
  }

  if (data.sections.certificacoes.visible && data.certificacoes.length) {
    const body = data.certificacoes.map((c) =>
      `${c.nome} — ${c.emissor} (${c.data})${c.url ? ` · ${c.url}` : ""}`,
    );
    section("Certificações", body);
  }

  return `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}
{\\*\\generator Giseveral CV Builder;}
\\f0\\sl276\\slmult1
${parts.join("\n")}
}`;
}

export function downloadCvRtf(data: CvData) {
  const blob = new Blob([exportCvToRtf(data)], { type: "application/rtf" });
  downloadBlob(blob, `${safeBase(data)}.rtf`);
}

// ── HTML / DOC ──────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function exportCvToHtmlBody(data: CvData): string {
  const pers = data.personal;
  const fullName = [pers.nome, pers.apelido].filter(Boolean).join(" ");
  const contact = [pers.email, pers.telefone, pers.localizacao || pers.cidade, pers.linkedin, pers.website, pers.portfolio]
    .filter(Boolean).join(" · ");

  const parts: string[] = [];
  parts.push(`<header><h1 style="margin:0;font-size:24pt;letter-spacing:1px">${escapeHtml(fullName.toUpperCase())}</h1>`);
  if (pers.titulo) parts.push(`<p style="margin:4pt 0 0;color:#444;font-size:13pt">${escapeHtml(pers.titulo)}</p>`);
  if (contact) parts.push(`<p style="margin:6pt 0 0;color:#666;font-size:10pt">${escapeHtml(contact)}</p>`);
  parts.push(`</header><hr style="margin:14pt 0;border:0;border-top:1px solid #ccc">`);

  function section(title: string, body: string) {
    parts.push(`<section style="margin-bottom:14pt"><h2 style="font-size:13pt;border-bottom:1px solid #999;padding-bottom:3pt;margin:0 0 6pt;letter-spacing:0.5px;text-transform:uppercase">${escapeHtml(title)}</h2>${body}</section>`);
  }

  if (data.objetivo) {
    section("Resumo profissional", `<p style="margin:0;font-size:11pt;line-height:1.6">${escapeHtml(data.objetivo)}</p>`);
  }

  if (data.sections.experiencia.visible && data.experiencia.length) {
    const body = data.experiencia.map((e) => {
      const period = `${e.inicio || "?"} — ${e.atual ? "Presente" : (e.fim || "?")}`;
      const bullets = (e.bullets ?? []).filter((b) => b.trim());
      const bulletsHtml = bullets.length
        ? `<ul style="margin:4pt 0 0;padding-left:16pt;font-size:10.5pt;line-height:1.55">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : (e.descricao ? `<p style="margin:4pt 0 0;font-size:10.5pt;line-height:1.55">${escapeHtml(e.descricao)}</p>` : "");
      return `<div style="margin-bottom:8pt">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <strong style="font-size:11.5pt">${escapeHtml(e.cargo)}</strong>
          <span style="color:#666;font-size:9.5pt">${escapeHtml(period)}</span>
        </div>
        <div style="color:#444;font-size:10.5pt">${escapeHtml(e.empresa)}${e.localizacao ? " · " + escapeHtml(e.localizacao) : ""}</div>
        ${bulletsHtml}
      </div>`;
    }).join("");
    section("Experiência Profissional", body);
  }

  if (data.sections.educacao.visible && data.educacao.length) {
    const body = data.educacao.map((ed) =>
      `<div style="margin-bottom:6pt">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <strong style="font-size:11.5pt">${escapeHtml(ed.grau)} — ${escapeHtml(ed.curso)}</strong>
          <span style="color:#666;font-size:9.5pt">${escapeHtml(ed.anoInicio)}–${escapeHtml(ed.anoFim)}</span>
        </div>
        <div style="color:#444;font-size:10.5pt">${escapeHtml(ed.instituicao)}${ed.nota ? " · " + escapeHtml(ed.nota) : ""}</div>
        ${ed.descricao ? `<p style="margin:3pt 0 0;font-size:10pt">${escapeHtml(ed.descricao)}</p>` : ""}
      </div>`,
    ).join("");
    section("Educação", body);
  }

  if (data.sections.skills.visible && data.skills.length) {
    const body = `<p style="margin:0;font-size:10.5pt;line-height:1.7">${
      data.skills.map((s) => `<strong>${escapeHtml(s.nome)}</strong> <span style="color:#888">(${escapeHtml(s.nivel)})</span>`).join(" · ")
    }</p>`;
    section("Competências", body);
  }

  if (data.sections.idiomas.visible && data.idiomas.length) {
    const body = `<p style="margin:0;font-size:10.5pt">${
      data.idiomas.map((i) => `<strong>${escapeHtml(i.idioma)}</strong> — ${escapeHtml(i.nivel)}`).join(" · ")
    }</p>`;
    section("Idiomas", body);
  }

  if (data.sections.projetos.visible && data.projetos.length) {
    const body = data.projetos.map((p) =>
      `<div style="margin-bottom:6pt">
        <strong style="font-size:11pt">${escapeHtml(p.nome)}</strong>
        ${p.tecnologias ? `<span style="color:#666;font-size:9.5pt"> · ${escapeHtml(p.tecnologias)}</span>` : ""}
        ${p.descricao ? `<p style="margin:2pt 0 0;font-size:10.5pt">${escapeHtml(p.descricao)}</p>` : ""}
        ${p.url ? `<a href="${escapeHtml(p.url)}" style="color:#1d4ed8;font-size:10pt">${escapeHtml(p.url)}</a>` : ""}
      </div>`,
    ).join("");
    section("Projectos", body);
  }

  if (data.sections.certificacoes.visible && data.certificacoes.length) {
    const body = data.certificacoes.map((c) =>
      `<div style="font-size:10.5pt;margin-bottom:3pt"><strong>${escapeHtml(c.nome)}</strong> — ${escapeHtml(c.emissor)} (${escapeHtml(c.data)})${c.url ? ` · <a href="${escapeHtml(c.url)}" style="color:#1d4ed8">link</a>` : ""}</div>`,
    ).join("");
    section("Certificações", body);
  }

  return parts.join("");
}

export function downloadCvHtml(data: CvData) {
  const body = exportCvToHtmlBody(data);
  const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>${escapeHtml(data.personal.nome || "CV")}</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.55;color:#222;background:#fff;margin:0;padding:0}
  .page{max-width:21cm;margin:0 auto;padding:2cm 2.2cm 2.5cm;background:#fff}
  h1,h2,h3{font-weight:700}
  @media print{.page{padding:1.8cm 2.2cm}}
</style></head><body><div class="page">${body}</div></body></html>`;
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${safeBase(data)}.html`);
}

export function downloadCvDoc(data: CvData) {
  const body = exportCvToHtmlBody(data);
  // Microsoft Word HTML — declares Word namespaces and page section so
  // Word opens this as a real document with A4 margins.
  const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>${escapeHtml(data.personal.nome || "CV")}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.55;color:#222}
  @page WordSection1{size:21cm 29.7cm;margin:2cm 2.2cm}
  div.WordSection1{page:WordSection1}
</style></head><body><div class='WordSection1'>${body}</div></body></html>`;
  downloadBlob(new Blob([doc], { type: "application/msword" }), `${safeBase(data)}.doc`);
}
