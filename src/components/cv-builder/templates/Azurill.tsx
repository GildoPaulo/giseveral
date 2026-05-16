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

function CI({ icon, text, href }: { icon: string; text: string; href?: string }) {
  if (!text) return null;
  const inner = (
    <span className="flex items-center gap-1">
      <span className="opacity-60">{icon}</span>
      <span>{text}</span>
    </span>
  );
  return href ? (
    <a href={href} className="no-underline" style={{ color: "inherit" }}>{inner}</a>
  ) : inner;
}

export function AzurillPreview({ data }: Props) {
  __fs = data.design.fontSize ?? 14;
  const { personal, objetivo, experiencia, educacao, skills, idiomas, projetos, certificacoes, design, sections } = data;
  const P = design.primaryColor;

  return (
    <div
      className="relative overflow-hidden"
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
      <div className="flex flex-col items-center text-center px-14 pt-10 pb-7" style={{ borderBottom: `2px solid ${P}` }}>
        {personal.foto && (
          <img
            src={personal.foto}
            alt={personal.nome}
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${P}`, marginBottom: 12 }}
          />
        )}
        <div style={{ fontSize: s(28), fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.2 }}>{personal.nome || "Seu Nome"}</div>
        {personal.titulo && (
          <div style={{ fontSize: s(13), color: P, marginTop: 4, fontWeight: 500 }}>{personal.titulo}</div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3" style={{ fontSize: s(10), opacity: 0.7 }}>
          <CI icon="✉" text={personal.email} href={`mailto:${personal.email}`} />
          <CI icon="☎" text={personal.telefone} />
          <CI icon="⌖" text={personal.localizacao} />
          <CI icon="in" text={personal.linkedin} href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} />
          {personal.website && <CI icon="◎" text={personal.website} href={personal.website.startsWith("http") ? personal.website : `https://${personal.website}`} />}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex" style={{ flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div className="flex flex-col gap-6 px-7 py-7" style={{ ...flexColumnStyle, width: "38%", background: "#f8f9fb", borderRight: "1px solid #e5e7eb" }}>
          {objetivo && (
            <div>
              <SectionHead label="Perfil" color={P} />
              <p style={{ fontSize: s(10), lineHeight: 1.6, opacity: 0.75, ...longTextStyle }}>{objetivo}</p>
            </div>
          )}
          {sections.educacao.visible && educacao.length > 0 && (
            <div>
              <SectionHead label={sections.educacao.title} color={P} />
              <div className="flex flex-col gap-3">
                {educacao.map(e => (
                  <div key={e.id}>
                    <div style={{ fontWeight: 600, fontSize: s(10) }}>{e.grau}</div>
                    <div style={{ fontSize: s(10), color: P }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: s(9), opacity: 0.6 }}>{e.curso}</div>}
                    <div style={{ fontSize: s(9), opacity: 0.5, marginTop: 1 }}>
                      {e.anoInicio}{e.anoFim ? ` — ${e.anoFim}` : " — Presente"}
                      {e.nota ? ` · ${e.nota}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sections.skills.visible && skills.length > 0 && (
            <div>
              <SectionHead label={sections.skills.title} color={P} />
              <div className="flex flex-col gap-2">
                {skills.map(sk => (
                  <div key={sk.id}>
                    <div className="flex justify-between" style={{ fontSize: s(10), marginBottom: 2, gap: 8, ...flexColumnStyle }}>
                      <span>{sk.nome}</span>
                      <span style={{ opacity: 0.4, fontSize: s(9) }}>{sk.nivel}</span>
                    </div>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: P, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sections.idiomas.visible && idiomas.length > 0 && (
            <div>
              <SectionHead label={sections.idiomas.title} color={P} />
              <div className="flex flex-col gap-1.5">
                {idiomas.map(id => (
                  <div key={id.id} className="flex justify-between" style={{ fontSize: s(10) }}>
                    <span style={{ fontWeight: 500 }}>{id.idioma}</span>
                    <span style={{ opacity: 0.55 }}>{id.nivel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex flex-col gap-7 px-8 py-7 flex-1" style={flexColumnStyle}>
          {sections.experiencia.visible && experiencia.length > 0 && (
            <div>
              <SectionHead label={sections.experiencia.title} color={P} />
              <div className="relative">
                <div style={{ position: "absolute", left: 8, top: 4, bottom: 4, width: 1, background: P + "30" }} />
                <div className="flex flex-col gap-4 pl-5">
                  {experiencia.map(exp => (
                    <div key={exp.id} style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: -21, top: 5, width: 9, height: 9, borderRadius: "50%", border: `2px solid ${P}`, background: design.backgroundColor }} />
                      <div className="flex justify-between items-start" style={{ gap: 10, ...flexColumnStyle }}>
                        <div style={flexColumnStyle}>
                          <div style={{ fontWeight: 700, fontSize: s(11) }}>{exp.cargo}</div>
                          <div style={{ fontSize: s(10), color: P, fontWeight: 500 }}>{exp.empresa}</div>
                          {exp.localizacao && <div style={{ fontSize: s(9), opacity: 0.5 }}>{exp.localizacao}</div>}
                        </div>
                        <div style={{ fontSize: s(9), opacity: 0.5, flexShrink: 0, marginLeft: 8 }}>
                          {exp.inicio} — {exp.atual ? "Presente" : exp.fim}
                        </div>
                      </div>
                      <ExperienceBody exp={exp} fontSize={s(10)} lineHeight={1.6} marginTop={4} opacity={0.75} textStyle={longTextStyle} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {sections.projetos.visible && projetos.length > 0 && (
            <div>
              <SectionHead label={sections.projetos.title} color={P} />
              <div className="flex flex-col gap-3">
                {projetos.map(proj => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline" style={{ gap: 10, ...flexColumnStyle }}>
                      <span style={{ fontWeight: 600, fontSize: s(11) }}>{proj.nome}</span>
                      {proj.url && <a href={proj.url} style={{ fontSize: s(9), color: P }}>{proj.url}</a>}
                    </div>
                    {proj.tecnologias && <div style={{ fontSize: s(9), opacity: 0.5, marginTop: 1 }}>{proj.tecnologias}</div>}
                    {proj.descricao && <p style={{ fontSize: s(10), lineHeight: 1.6, marginTop: 3, opacity: 0.75, ...longTextStyle }}>{proj.descricao}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {sections.certificacoes.visible && certificacoes.length > 0 && (
            <div>
              <SectionHead label={sections.certificacoes.title} color={P} />
              <div className="flex flex-col gap-2">
                {certificacoes.map(cert => (
                  <div key={cert.id} className="flex justify-between items-start" style={{ gap: 10, ...flexColumnStyle }}>
                    <div style={flexColumnStyle}>
                      <div style={{ fontWeight: 600, fontSize: s(11) }}>{cert.nome}</div>
                      <div style={{ fontSize: s(10), opacity: 0.55 }}>{cert.emissor}</div>
                    </div>
                    <div style={{ fontSize: s(9), opacity: 0.45, flexShrink: 0, marginLeft: 8 }}>{cert.data}</div>
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

function SectionHead({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ fontSize: s(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 14, height: 2, background: color, borderRadius: 1 }} />
      {label}
    </div>
  );
}
