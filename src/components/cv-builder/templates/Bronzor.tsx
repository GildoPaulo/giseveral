import type { CvData } from "../types";
import { SKILL_PCT } from "../types";
import { a4PageStyle, flexColumnStyle, longTextStyle } from "./templateStyles";
import { TemplateFooter } from "./TemplateFooter";

// ── Font-size scaling ──────────────────────────────────────────────────────────
// The TopBar feeds design.fontSize (12–32 px) here. The main Preview function
// updates __fs at the top of every render; helper components read the same
// module-level value via s(n). Base = 14 (matches DEFAULT_DESIGN.fontSize).
let __fs = 14;
const s = (n: number): number => Math.round(n * (__fs / 14) * 100) / 100;

interface Props { data: CvData }

export function BronzorPreview({ data }: Props) {
  __fs = data.design.fontSize ?? 14;
  const { personal, objetivo, experiencia, educacao, skills, idiomas, projetos, certificacoes, design, sections } = data;
  const P = design.primaryColor;

  return (
    <div
      style={{
        ...a4PageStyle,
        background: design.backgroundColor,
        color: design.textColor,
        fontFamily: `${design.fontFamily}, sans-serif`,
        fontSize: s(11),
        lineHeight: 1.5,
        padding: "48px 56px",
        display: "flex",
        flexDirection: "column",
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
        <div style={{ fontSize: s(30), fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1 }}>{personal.nome || "Seu Nome"}</div>
        {personal.titulo && (
          <div style={{ fontSize: s(14), color: P, fontWeight: 600, marginTop: 3 }}>{personal.titulo}</div>
        )}
        <div style={{ clear: "both" }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3" style={{ fontSize: s(10), opacity: 0.6 }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.telefone && <span>☎ {personal.telefone}</span>}
          {personal.localizacao && <span>⌖ {personal.localizacao}</span>}
          {personal.linkedin && <span>in {personal.linkedin}</span>}
          {personal.website && <span>◎ {personal.website}</span>}
        </div>
        <div style={{ marginTop: 16, height: 3, background: P, borderRadius: 2 }} />
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col gap-6" style={{ flex: 1, ...flexColumnStyle }}>
        {objetivo && (
          <div style={{ paddingLeft: 12, borderLeft: `3px solid ${P}` }}>
            <p style={{ fontSize: s(11), lineHeight: 1.7, opacity: 0.75, ...longTextStyle }}>{objetivo}</p>
          </div>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <Section title={sections.experiencia.title} color={P}>
            {experiencia.map(exp => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div className="flex justify-between items-start" style={{ gap: 10, ...flexColumnStyle }}>
                  <div style={flexColumnStyle}>
                    <span style={{ fontWeight: 700, fontSize: s(12) }}>{exp.cargo}</span>
                    <span style={{ opacity: 0.45, fontSize: s(10), margin: "0 6px" }}>·</span>
                    <span style={{ color: P, fontWeight: 600, fontSize: s(11) }}>{exp.empresa}</span>
                    {exp.localizacao && <span style={{ opacity: 0.45, fontSize: s(9), marginLeft: 6 }}>({exp.localizacao})</span>}
                  </div>
                  <span style={{ fontSize: s(9), opacity: 0.5, flexShrink: 0 }}>
                    {exp.inicio} — {exp.atual ? "Presente" : exp.fim}
                  </span>
                </div>
                {exp.descricao && <p style={{ fontSize: s(10), lineHeight: 1.65, marginTop: 4, opacity: 0.7, ...longTextStyle }}>{exp.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.projetos.visible && projetos.length > 0 && (
          <Section title={sections.projetos.title} color={P}>
            {projetos.map(proj => (
              <div key={proj.id} style={{ marginBottom: 12 }}>
                <div className="flex justify-between items-baseline" style={{ gap: 10, ...flexColumnStyle }}>
                  <span style={{ fontWeight: 700, fontSize: s(11) }}>{proj.nome}</span>
                  {proj.url && <a href={proj.url} style={{ fontSize: s(9), color: P }}>{proj.url}</a>}
                </div>
                {proj.tecnologias && <span style={{ fontSize: s(9), opacity: 0.5, display: "block", marginTop: 1 }}>{proj.tecnologias}</span>}
                {proj.descricao && <p style={{ fontSize: s(10), lineHeight: 1.6, marginTop: 3, opacity: 0.7, ...longTextStyle }}>{proj.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Two-column: Education + Languages */}
        <div className="flex gap-8" style={flexColumnStyle}>
          {sections.educacao.visible && educacao.length > 0 && (
            <div style={{ flex: 1, ...flexColumnStyle }}>
              <Section title={sections.educacao.title} color={P}>
                {educacao.map(e => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: s(11) }}>{e.grau}</div>
                    <div style={{ color: P, fontSize: s(10), fontWeight: 500 }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: s(9.5), opacity: 0.6 }}>{e.curso}</div>}
                    <div style={{ fontSize: s(9), opacity: 0.45, marginTop: 1 }}>
                      {e.anoInicio}{e.anoFim ? ` — ${e.anoFim}` : " — Presente"}
                      {e.nota ? ` · ${e.nota}` : ""}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
          {sections.idiomas.visible && idiomas.length > 0 && (
            <div style={{ flex: 1, ...flexColumnStyle }}>
              <Section title={sections.idiomas.title} color={P}>
                {idiomas.map(id => (
                  <div key={id.id} className="flex justify-between" style={{ marginBottom: 6, fontSize: s(10) }}>
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
                <div key={sk.id} className="flex items-center gap-3" style={flexColumnStyle}>
                  <span style={{ width: 120, fontSize: s(10), fontWeight: 500, flexShrink: 0 }}>{sk.nome}</span>
                  <div style={{ flex: 1, minWidth: 0, height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: P, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: s(9), opacity: 0.45, width: 56, textAlign: "right", flexShrink: 0 }}>{sk.nivel}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <Section title={sections.certificacoes.title} color={P}>
            {certificacoes.map(cert => (
              <div key={cert.id} className="flex justify-between items-start" style={{ marginBottom: 8, gap: 10, ...flexColumnStyle }}>
                <div style={flexColumnStyle}>
                  <div style={{ fontWeight: 600, fontSize: s(11) }}>{cert.nome}</div>
                  <div style={{ fontSize: s(10), opacity: 0.55 }}>{cert.emissor}</div>
                </div>
                <div style={{ fontSize: s(9), opacity: 0.45, flexShrink: 0, marginLeft: 8 }}>{cert.data}</div>
              </div>
            ))}
          </Section>
        )}
        <div className="flex-1" />
        <TemplateFooter data={data} />
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: s(9.5), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: color + "30" }} />
      </div>
      {children}
    </div>
  );
}
