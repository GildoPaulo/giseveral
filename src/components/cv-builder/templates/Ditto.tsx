import type { CvData } from "../types";
import { a4PageStyle, flexColumnStyle, longTextStyle } from "./templateStyles";

// ── Font-size scaling ──────────────────────────────────────────────────────────
// The TopBar feeds design.fontSize (12–32 px) here. The main Preview function
// updates __fs at the top of every render; helper components read the same
// module-level value via s(n). Base = 14 (matches DEFAULT_DESIGN.fontSize).
let __fs = 14;
const s = (n: number): number => Math.round(n * (__fs / 14) * 100) / 100;

interface Props { data: CvData }

export function DittoPreview({ data }: Props) {
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
        padding: "52px 64px",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-start gap-4">
          {personal.foto && (
            <img
              src={personal.foto}
              alt={personal.nome}
              style={{ width: 64, height: 64, borderRadius: 4, objectFit: "cover", flexShrink: 0, marginTop: 4 }}
            />
          )}
          <div style={flexColumnStyle}>
            <div style={{ fontSize: s(26), fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.1 }}>{personal.nome || "Seu Nome"}</div>
            {personal.titulo && (
              <div style={{ fontSize: s(13), color: P, fontWeight: 600, marginTop: 3 }}>{personal.titulo}</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-3" style={{ fontSize: s(10), opacity: 0.65 }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.email && personal.telefone && <Sep />}
          {personal.telefone && <span>{personal.telefone}</span>}
          {personal.localizacao && <><Sep /><span>{personal.localizacao}</span></>}
          {personal.linkedin && <><Sep /><span>{personal.linkedin}</span></>}
          {personal.website && <><Sep /><span>{personal.website}</span></>}
        </div>
        <div style={{ marginTop: 14, borderBottom: `2px solid ${design.textColor}` }} />
      </div>

      {/* ── SECTIONS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {objetivo && (
          <Section title="Resumo Profissional" color={design.textColor}>
            <p style={{ fontSize: s(10.5), lineHeight: 1.7, ...longTextStyle }}>{objetivo}</p>
          </Section>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <Section title={sections.experiencia.title} color={design.textColor}>
            {experiencia.map((exp, i) => (
              <div key={exp.id} style={{ marginBottom: i < experiencia.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, ...flexColumnStyle }}>
                  <span style={{ fontWeight: 700, fontSize: s(11.5) }}>{exp.cargo}</span>
                  <span style={{ fontSize: s(9.5), opacity: 0.55, flexShrink: 0, marginLeft: 8 }}>
                    {exp.inicio} – {exp.atual ? "Presente" : exp.fim}
                  </span>
                </div>
                <div style={{ fontSize: s(10.5), fontWeight: 600, color: P }}>{exp.empresa}{exp.localizacao ? ` · ${exp.localizacao}` : ""}</div>
                {exp.descricao && <p style={{ fontSize: s(10), lineHeight: 1.65, marginTop: 3, opacity: 0.7, ...longTextStyle }}>{exp.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.educacao.visible && educacao.length > 0 && (
          <Section title={sections.educacao.title} color={design.textColor}>
            {educacao.map((e, i) => (
              <div key={e.id} style={{ marginBottom: i < educacao.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, ...flexColumnStyle }}>
                  <span style={{ fontWeight: 700, fontSize: s(11) }}>{e.grau}{e.curso ? ` em ${e.curso}` : ""}</span>
                  <span style={{ fontSize: s(9.5), opacity: 0.55, flexShrink: 0, marginLeft: 8 }}>
                    {e.anoInicio} – {e.anoFim || "Presente"}
                  </span>
                </div>
                <div style={{ fontSize: s(10.5), color: P, fontWeight: 500 }}>{e.instituicao}</div>
                {e.nota && <div style={{ fontSize: s(9.5), opacity: 0.55 }}>Classificação: {e.nota}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Two columns for skills + languages */}
        {((sections.skills.visible && skills.length > 0) || (sections.idiomas.visible && idiomas.length > 0)) && (
          <div style={{ display: "flex", gap: 40, ...flexColumnStyle }}>
            {sections.skills.visible && skills.length > 0 && (
              <div style={{ flex: 2, ...flexColumnStyle }}>
                <Section title={sections.skills.title} color={design.textColor}>
                  <p style={{ fontSize: s(10.5), lineHeight: 1.9 }}>
                    {skills.map((sk, i) => (
                      <span key={sk.id}>
                        <span style={{ fontWeight: 600 }}>{sk.nome}</span>
                        {i < skills.length - 1 ? <span style={{ opacity: 0.4, margin: "0 5px" }}>·</span> : null}
                      </span>
                    ))}
                  </p>
                </Section>
              </div>
            )}
            {sections.idiomas.visible && idiomas.length > 0 && (
              <div style={{ flex: 1, ...flexColumnStyle }}>
                <Section title={sections.idiomas.title} color={design.textColor}>
                  {idiomas.map(id => (
                    <div key={id.id} style={{ fontSize: s(10.5), marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{id.idioma}</span>
                      <span style={{ opacity: 0.55, marginLeft: 5, fontSize: s(10) }}>({id.nivel})</span>
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>
        )}

        {sections.projetos.visible && projetos.length > 0 && (
          <Section title={sections.projetos.title} color={design.textColor}>
            {projetos.map((proj, i) => (
              <div key={proj.id} style={{ marginBottom: i < projetos.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, ...flexColumnStyle }}>
                  <span style={{ fontWeight: 700, fontSize: s(11) }}>{proj.nome}</span>
                  {proj.url && <a href={proj.url} style={{ fontSize: s(9.5), color: P }}>{proj.url}</a>}
                </div>
                {proj.tecnologias && <div style={{ fontSize: s(9.5), opacity: 0.5, marginTop: 1 }}>{proj.tecnologias}</div>}
                {proj.descricao && <p style={{ fontSize: s(10), lineHeight: 1.6, marginTop: 3, opacity: 0.7, ...longTextStyle }}>{proj.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <Section title={sections.certificacoes.title} color={design.textColor}>
            {certificacoes.map((cert, i) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: i < certificacoes.length - 1 ? 6 : 0, gap: 10, ...flexColumnStyle }}>
                <span>
                  <span style={{ fontWeight: 700, fontSize: s(11) }}>{cert.nome}</span>
                  {cert.emissor && <span style={{ opacity: 0.55, marginLeft: 6, fontSize: s(10) }}>· {cert.emissor}</span>}
                </span>
                <span style={{ fontSize: s(9.5), opacity: 0.5, flexShrink: 0, marginLeft: 8 }}>{cert.data}</span>
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: s(9.5), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: color + "25" }} />
      </div>
      {children}
    </div>
  );
}

function Sep() {
  return <span style={{ opacity: 0.3 }}>|</span>;
}
