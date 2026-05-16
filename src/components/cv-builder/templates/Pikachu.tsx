import type { CvData } from "../types";
import { SKILL_PCT } from "../types";
import { a4PageStyle, flexColumnStyle, longTextStyle } from "./templateStyles";
import { TemplateFooter } from "./TemplateFooter";
import { ExperienceBody } from "./experienceBody";

// ── Font-size scaling ──────────────────────────────────────────────────────────
// The TopBar feeds design.fontSize (12–32 px) here. The main Preview function
// updates __fs at the top of every render; helper components read the same
// module-level value via s(n). Base = 14 (matches DEFAULT_DESIGN.fontSize).
let __fs = 14;
const s = (n: number): number => Math.round(n * (__fs / 14) * 100) / 100;

interface Props { data: CvData }

export function PikachuPreview({ data }: Props) {
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: P,
          color: "#fff",
          padding: "40px 48px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        {personal.foto && (
          <img
            src={personal.foto}
            alt={personal.nome}
            style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, ...flexColumnStyle }}>
          <div style={{ fontSize: s(28), fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{personal.nome || "Seu Nome"}</div>
          {personal.titulo && (
            <div style={{ fontSize: s(13), marginTop: 5, opacity: 0.85, fontWeight: 500 }}>{personal.titulo}</div>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4" style={{ fontSize: s(10), opacity: 0.75 }}>
            {personal.email && <span>✉ {personal.email}</span>}
            {personal.telefone && <span>☎ {personal.telefone}</span>}
            {personal.localizacao && <span>⌖ {personal.localizacao}</span>}
            {personal.linkedin && <span>in {personal.linkedin}</span>}
            {personal.website && <span>◎ {personal.website}</span>}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, ...flexColumnStyle }}>
        {/* Main (left, 62%) */}
        <div style={{ width: "62%", padding: "32px 36px", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 22, ...flexColumnStyle }}>
          {objetivo && (
            <div>
              <Head label="Perfil" color={P} />
              <p style={{ fontSize: s(10.5), lineHeight: 1.7, opacity: 0.75, ...longTextStyle }}>{objetivo}</p>
            </div>
          )}

          {sections.experiencia.visible && experiencia.length > 0 && (
            <div>
              <Head label={sections.experiencia.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experiencia.map(exp => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, ...flexColumnStyle }}>
                      <div style={flexColumnStyle}>
                        <div style={{ fontWeight: 700, fontSize: s(12) }}>{exp.cargo}</div>
                        <div style={{ color: P, fontSize: s(10.5), fontWeight: 600 }}>{exp.empresa}</div>
                        {exp.localizacao && <div style={{ fontSize: s(9), opacity: 0.5 }}>{exp.localizacao}</div>}
                      </div>
                      <div style={{ fontSize: s(9), opacity: 0.5, flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                        {exp.inicio} — {exp.atual ? "Presente" : exp.fim}
                      </div>
                    </div>
                    <ExperienceBody exp={exp} fontSize={s(10)} lineHeight={1.65} marginTop={4} opacity={0.7} textStyle={longTextStyle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.projetos.visible && projetos.length > 0 && (
            <div>
              <Head label={sections.projetos.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projetos.map(proj => (
                  <div key={proj.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, ...flexColumnStyle }}>
                      <span style={{ fontWeight: 700, fontSize: s(11) }}>{proj.nome}</span>
                      {proj.url && <a href={proj.url} style={{ fontSize: s(9), color: P }}>{proj.url}</a>}
                    </div>
                    {proj.tecnologias && <div style={{ fontSize: s(9), opacity: 0.5, marginTop: 1 }}>{proj.tecnologias}</div>}
                    {proj.descricao && <p style={{ fontSize: s(10), lineHeight: 1.6, marginTop: 3, opacity: 0.7, ...longTextStyle }}>{proj.descricao}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (right, 38%) */}
        <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20, background: "#fafafa", ...flexColumnStyle }}>
          {sections.skills.visible && skills.length > 0 && (
            <div>
              <Head label={sections.skills.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {skills.map(sk => (
                  <div key={sk.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: s(10), marginBottom: 2, gap: 8, ...flexColumnStyle }}>
                      <span style={{ fontWeight: 500 }}>{sk.nome}</span>
                      <span style={{ opacity: 0.4, fontSize: s(9) }}>{sk.nivel}</span>
                    </div>
                    <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: P, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.educacao.visible && educacao.length > 0 && (
            <div>
              <Head label={sections.educacao.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {educacao.map(e => (
                  <div key={e.id}>
                    <div style={{ fontWeight: 700, fontSize: s(11) }}>{e.grau}</div>
                    <div style={{ color: P, fontSize: s(10), fontWeight: 500 }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: s(9.5), opacity: 0.6 }}>{e.curso}</div>}
                    <div style={{ fontSize: s(9), opacity: 0.45, marginTop: 1 }}>
                      {e.anoInicio}{e.anoFim ? ` — ${e.anoFim}` : " — Presente"}
                      {e.nota ? ` · ${e.nota}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.idiomas.visible && idiomas.length > 0 && (
            <div>
              <Head label={sections.idiomas.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {idiomas.map(id => (
                  <div key={id.id} style={{ display: "flex", justifyContent: "space-between", fontSize: s(10) }}>
                    <span style={{ fontWeight: 600 }}>{id.idioma}</span>
                    <span style={{ opacity: 0.55, fontSize: s(9.5) }}>{id.nivel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.certificacoes.visible && certificacoes.length > 0 && (
            <div>
              <Head label={sections.certificacoes.title} color={P} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certificacoes.map(cert => (
                  <div key={cert.id}>
                    <div style={{ fontWeight: 600, fontSize: s(11) }}>{cert.nome}</div>
                    <div style={{ fontSize: s(9.5), opacity: 0.55 }}>{cert.emissor}</div>
                    <div style={{ fontSize: s(9), opacity: 0.4 }}>{cert.data}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1" />
          <TemplateFooter data={data} />
        </div>
      </div>
    </div>
  );
}

function Head({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 4, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: s(10), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color }}>{label}</span>
    </div>
  );
}
