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

export function OnyxPreview({ data }: Props) {
  __fs = data.design.fontSize ?? 14;
  const { personal, objetivo, experiencia, educacao, skills, idiomas, projetos, certificacoes, design, sections } = data;
  const P = design.primaryColor;
  const sidebarBg = "#0f172a";
  const sidebarFg = "#f1f5f9";
  const sidebarMuted = "#94a3b8";

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
      }}
    >
      {/* ── SIDEBAR ── */}
      <div style={{ width: "34%", background: sidebarBg, color: sidebarFg, padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24, ...flexColumnStyle }}>
        {personal.foto && (
          <img
            src={personal.foto}
            alt={personal.nome}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, marginBottom: 4 }}
          />
        )}
        <div>
          <div style={{ fontSize: s(20), fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.3px", ...longTextStyle }}>{personal.nome || "Seu Nome"}</div>
          {personal.titulo && (
            <div style={{ fontSize: s(11), color: P, fontWeight: 600, marginTop: 4 }}>{personal.titulo}</div>
          )}
        </div>

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SideLabel label="Contacto" />
          {personal.email && <CI icon="✉" text={personal.email} color={sidebarMuted} />}
          {personal.telefone && <CI icon="☎" text={personal.telefone} color={sidebarMuted} />}
          {personal.localizacao && <CI icon="⌖" text={personal.localizacao} color={sidebarMuted} />}
          {personal.linkedin && <CI icon="in" text={personal.linkedin} color={sidebarMuted} />}
          {personal.website && <CI icon="◎" text={personal.website} color={sidebarMuted} />}
        </div>

        {sections.skills.visible && skills.length > 0 && (
          <div>
            <SideLabel label={sections.skills.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {skills.map(sk => (
                <div key={sk.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: s(10), marginBottom: 2, gap: 8, ...flexColumnStyle }}>
                    <span>{sk.nome}</span>
                    <span style={{ color: sidebarMuted, fontSize: s(9) }}>{sk.nivel}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: P, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.idiomas.visible && idiomas.length > 0 && (
          <div>
            <SideLabel label={sections.idiomas.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
              {idiomas.map(id => (
                <div key={id.id} style={{ display: "flex", justifyContent: "space-between", fontSize: s(10) }}>
                  <span>{id.idioma}</span>
                  <span style={{ color: sidebarMuted, fontSize: s(9) }}>{id.nivel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <div>
            <SideLabel label={sections.certificacoes.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {certificacoes.map(cert => (
                <div key={cert.id}>
                  <div style={{ fontSize: s(10), fontWeight: 600 }}>{cert.nome}</div>
                  <div style={{ fontSize: s(9), color: sidebarMuted }}>{cert.emissor}</div>
                  <div style={{ fontSize: s(9), color: sidebarMuted }}>{cert.data}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, padding: "40px 40px", display: "flex", flexDirection: "column", gap: 24, ...flexColumnStyle }}>
        {objetivo && (
          <div>
            <MainHead label="Perfil" color={P} />
            <p style={{ fontSize: s(10.5), lineHeight: 1.7, opacity: 0.75, ...longTextStyle }}>{objetivo}</p>
          </div>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <div>
            <MainHead label={sections.experiencia.title} color={P} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {experiencia.map(exp => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, ...flexColumnStyle }}>
                    <div style={flexColumnStyle}>
                      <div style={{ fontWeight: 700, fontSize: s(12) }}>{exp.cargo}</div>
                      <div style={{ color: P, fontSize: s(10.5), fontWeight: 500 }}>{exp.empresa}</div>
                      {exp.localizacao && <div style={{ fontSize: s(9), opacity: 0.5 }}>{exp.localizacao}</div>}
                    </div>
                    <div style={{ fontSize: s(9), opacity: 0.5, flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                      {exp.inicio}<br />{exp.atual ? "Presente" : exp.fim}
                    </div>
                  </div>
                  {exp.descricao && <p style={{ fontSize: s(10), lineHeight: 1.65, marginTop: 5, opacity: 0.7, ...longTextStyle }}>{exp.descricao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.educacao.visible && educacao.length > 0 && (
          <div>
            <MainHead label={sections.educacao.title} color={P} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {educacao.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, ...flexColumnStyle }}>
                  <div style={flexColumnStyle}>
                    <div style={{ fontWeight: 700, fontSize: s(11) }}>{e.grau}</div>
                    <div style={{ color: P, fontSize: s(10), fontWeight: 500 }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: s(9.5), opacity: 0.6 }}>{e.curso}</div>}
                  </div>
                  <div style={{ fontSize: s(9), opacity: 0.5, flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                    {e.anoInicio}<br />{e.anoFim || "Presente"}
                    {e.nota ? <><br />{e.nota}</> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.projetos.visible && projetos.length > 0 && (
          <div>
            <MainHead label={sections.projetos.title} color={P} />
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
        <div className="flex-1" />
        <TemplateFooter data={data} />
      </div>
    </div>
  );
}

function SideLabel({ label }: { label: string }) {
  return (
    <div style={{ fontSize: s(8.5), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#64748b", marginBottom: 2 }}>
      {label}
    </div>
  );
}

function MainHead({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: s(9.5), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color }}>{label}</span>
      <div style={{ flex: 1, height: 1.5, background: color, borderRadius: 1 }} />
    </div>
  );
}

function CI({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: s(9.5), color }}>
      <span style={{ opacity: 0.6, fontSize: s(9) }}>{icon}</span>
      <span style={{ wordBreak: "break-all" }}>{text}</span>
    </div>
  );
}
