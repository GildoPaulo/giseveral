import type { CvData } from "../types";
import { SKILL_PCT } from "../types";

interface Props { data: CvData }

export function BronzorPreview({ data }: Props) {
  const { personal, objetivo, experiencia, educacao, skills, idiomas, projetos, certificacoes, design, sections } = data;
  const P = design.primaryColor;

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        background: design.backgroundColor,
        color: design.textColor,
        fontFamily: `${design.fontFamily}, sans-serif`,
        fontSize: 11,
        lineHeight: 1.5,
        padding: "48px 56px",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        {personal.foto && (
          <img
            src={personal.foto}
            alt={personal.nome}
            style={{ float: "left", width: 72, height: 72, borderRadius: 6, objectFit: "cover", marginRight: 20, marginBottom: 4 }}
          />
        )}
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1 }}>{personal.nome || "Seu Nome"}</div>
        {personal.titulo && (
          <div style={{ fontSize: 14, color: P, fontWeight: 600, marginTop: 3 }}>{personal.titulo}</div>
        )}
        <div style={{ clear: "both" }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3" style={{ fontSize: 10, opacity: 0.6 }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.telefone && <span>☎ {personal.telefone}</span>}
          {personal.localizacao && <span>⌖ {personal.localizacao}</span>}
          {personal.linkedin && <span>in {personal.linkedin}</span>}
          {personal.website && <span>◎ {personal.website}</span>}
        </div>
        <div style={{ marginTop: 16, height: 3, background: P, borderRadius: 2 }} />
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col gap-6">
        {objetivo && (
          <div style={{ paddingLeft: 12, borderLeft: `3px solid ${P}` }}>
            <p style={{ fontSize: 11, lineHeight: 1.7, opacity: 0.75 }}>{objetivo}</p>
          </div>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <Section title={sections.experiencia.title} color={P}>
            {experiencia.map(exp => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{exp.cargo}</span>
                    <span style={{ opacity: 0.45, fontSize: 10, margin: "0 6px" }}>·</span>
                    <span style={{ color: P, fontWeight: 600, fontSize: 11 }}>{exp.empresa}</span>
                    {exp.localizacao && <span style={{ opacity: 0.45, fontSize: 9, marginLeft: 6 }}>({exp.localizacao})</span>}
                  </div>
                  <span style={{ fontSize: 9, opacity: 0.5, flexShrink: 0 }}>
                    {exp.inicio} — {exp.atual ? "Presente" : exp.fim}
                  </span>
                </div>
                {exp.descricao && <p style={{ fontSize: 10, lineHeight: 1.65, marginTop: 4, opacity: 0.7 }}>{exp.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.projetos.visible && projetos.length > 0 && (
          <Section title={sections.projetos.title} color={P}>
            {projetos.map(proj => (
              <div key={proj.id} style={{ marginBottom: 12 }}>
                <div className="flex justify-between items-baseline">
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{proj.nome}</span>
                  {proj.url && <a href={proj.url} style={{ fontSize: 9, color: P }}>{proj.url}</a>}
                </div>
                {proj.tecnologias && <span style={{ fontSize: 9, opacity: 0.5, display: "block", marginTop: 1 }}>{proj.tecnologias}</span>}
                {proj.descricao && <p style={{ fontSize: 10, lineHeight: 1.6, marginTop: 3, opacity: 0.7 }}>{proj.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Two-column: Education + Languages */}
        <div className="flex gap-8">
          {sections.educacao.visible && educacao.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title={sections.educacao.title} color={P}>
                {educacao.map(e => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{e.grau}</div>
                    <div style={{ color: P, fontSize: 10, fontWeight: 500 }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: 9.5, opacity: 0.6 }}>{e.curso}</div>}
                    <div style={{ fontSize: 9, opacity: 0.45, marginTop: 1 }}>
                      {e.anoInicio}{e.anoFim ? ` — ${e.anoFim}` : " — Presente"}
                      {e.nota ? ` · ${e.nota}` : ""}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
          {sections.idiomas.visible && idiomas.length > 0 && (
            <div style={{ flex: 1 }}>
              <Section title={sections.idiomas.title} color={P}>
                {idiomas.map(id => (
                  <div key={id.id} className="flex justify-between" style={{ marginBottom: 6, fontSize: 10 }}>
                    <span style={{ fontWeight: 600 }}>{id.idioma}</span>
                    <span style={{ opacity: 0.55 }}>{id.nivel}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </div>

        {/* Skills as tags or bars */}
        {sections.skills.visible && skills.length > 0 && (
          <Section title={sections.skills.title} color={P}>
            <div className="flex flex-col gap-2">
              {skills.map(sk => (
                <div key={sk.id} className="flex items-center gap-3">
                  <span style={{ width: 120, fontSize: 10, fontWeight: 500, flexShrink: 0 }}>{sk.nome}</span>
                  <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: P, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, opacity: 0.45, width: 56, textAlign: "right", flexShrink: 0 }}>{sk.nivel}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <Section title={sections.certificacoes.title} color={P}>
            {certificacoes.map(cert => (
              <div key={cert.id} className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{cert.nome}</div>
                  <div style={{ fontSize: 10, opacity: 0.55 }}>{cert.emissor}</div>
                </div>
                <div style={{ fontSize: 9, opacity: 0.45, flexShrink: 0, marginLeft: 8 }}>{cert.data}</div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: color + "30" }} />
      </div>
      {children}
    </div>
  );
}
