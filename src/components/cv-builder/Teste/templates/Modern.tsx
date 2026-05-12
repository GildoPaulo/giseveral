import type { CvData } from "../types";
import { SKILL_PCT } from "../types";

interface Props { data: CvData }

export function ModernPreview({ data }: Props) {
  const { personal, objetivo, experiencia, educacao, skills, idiomas, projetos, certificacoes, design, sections } = data;
  const P = design.primaryColor;
  const sidebarBg = P;

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
        display: "flex",
      }}
    >
      {/* ── SIDEBAR ── */}
      <div
        style={{
          width: "32%",
          background: sidebarBg,
          color: "#fff",
          padding: "40px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {personal.foto && (
          <img
            src={personal.foto}
            alt={personal.nome}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.2)" }}
          />
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.3px" }}>{personal.nome || "Seu Nome"}</div>
          {personal.titulo && <div style={{ fontSize: 10.5, marginTop: 4, opacity: 0.75, fontWeight: 400 }}>{personal.titulo}</div>}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
          <SLabel label="Contacto" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
            {personal.email && <CI icon="✉" text={personal.email} />}
            {personal.telefone && <CI icon="☎" text={personal.telefone} />}
            {personal.localizacao && <CI icon="⌖" text={personal.localizacao} />}
            {personal.linkedin && <CI icon="in" text={personal.linkedin} />}
            {personal.website && <CI icon="◎" text={personal.website} />}
          </div>
        </div>

        {sections.skills.visible && skills.length > 0 && (
          <div>
            <SLabel label={sections.skills.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
              {skills.map(sk => (
                <div key={sk.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, marginBottom: 2, opacity: 0.9 }}>
                    <span>{sk.nome}</span>
                    <span style={{ opacity: 0.6, fontSize: 8.5 }}>{sk.nivel}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${SKILL_PCT[sk.nivel]}%`, height: "100%", background: "rgba(255,255,255,0.75)", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.idiomas.visible && idiomas.length > 0 && (
          <div>
            <SLabel label={sections.idiomas.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
              {idiomas.map(id => (
                <div key={id.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span>{id.idioma}</span>
                  <span style={{ opacity: 0.6, fontSize: 9 }}>{id.nivel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <div>
            <SLabel label={sections.certificacoes.title} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {certificacoes.map(cert => (
                <div key={cert.id}>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{cert.nome}</div>
                  <div style={{ fontSize: 9, opacity: 0.6 }}>{cert.emissor}</div>
                  <div style={{ fontSize: 9, opacity: 0.5 }}>{cert.data}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, padding: "40px 40px", display: "flex", flexDirection: "column", gap: 22 }}>
        {objetivo && (
          <div style={{ padding: "12px 16px", background: P + "0d", borderLeft: `3px solid ${P}`, borderRadius: 2 }}>
            <p style={{ fontSize: 10.5, lineHeight: 1.7, opacity: 0.75 }}>{objetivo}</p>
          </div>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <div>
            <MHead label={sections.experiencia.title} color={P} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {experiencia.map(exp => (
                <div key={exp.id} style={{ paddingLeft: 12, borderLeft: `2px solid ${P}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{exp.cargo}</div>
                      <div style={{ color: P, fontSize: 10.5, fontWeight: 600 }}>{exp.empresa}</div>
                      {exp.localizacao && <div style={{ fontSize: 9, opacity: 0.5 }}>{exp.localizacao}</div>}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.5, flexShrink: 0, marginLeft: 8 }}>
                      {exp.inicio} — {exp.atual ? "Presente" : exp.fim}
                    </div>
                  </div>
                  {exp.descricao && <p style={{ fontSize: 10, lineHeight: 1.65, marginTop: 4, opacity: 0.7 }}>{exp.descricao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.educacao.visible && educacao.length > 0 && (
          <div>
            <MHead label={sections.educacao.title} color={P} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {educacao.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>{e.grau}</div>
                    <div style={{ color: P, fontSize: 10, fontWeight: 500 }}>{e.instituicao}</div>
                    {e.curso && <div style={{ fontSize: 9.5, opacity: 0.6 }}>{e.curso}</div>}
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.5, flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                    {e.anoInicio} — {e.anoFim || "Presente"}
                    {e.nota ? <><br />{e.nota}</> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sections.projetos.visible && projetos.length > 0 && (
          <div>
            <MHead label={sections.projetos.title} color={P} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projetos.map(proj => (
                <div key={proj.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: 11 }}>{proj.nome}</span>
                    {proj.url && <a href={proj.url} style={{ fontSize: 9, color: P }}>{proj.url}</a>}
                  </div>
                  {proj.tecnologias && <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{proj.tecnologias}</div>}
                  {proj.descricao && <p style={{ fontSize: 10, lineHeight: 1.6, marginTop: 3, opacity: 0.7 }}>{proj.descricao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SLabel({ label }: { label: string }) {
  return <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.5 }}>{label}</div>;
}

function MHead({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color }}>{label}</span>
      <div style={{ flex: 1, height: 1.5, background: color + "25", borderRadius: 1 }} />
    </div>
  );
}

function CI({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9.5, opacity: 0.8 }}>
      <span style={{ opacity: 0.6, fontSize: 9, width: 10, textAlign: "center" }}>{icon}</span>
      <span style={{ wordBreak: "break-all" }}>{text}</span>
    </div>
  );
}
