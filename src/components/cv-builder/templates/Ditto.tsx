import type { CvData } from "../types";

interface Props { data: CvData }

export function DittoPreview({ data }: Props) {
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
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.1 }}>{personal.nome || "Seu Nome"}</div>
            {personal.titulo && (
              <div style={{ fontSize: 13, color: P, fontWeight: 600, marginTop: 3 }}>{personal.titulo}</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-3" style={{ fontSize: 10, opacity: 0.65 }}>
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
            <p style={{ fontSize: 10.5, lineHeight: 1.7 }}>{objetivo}</p>
          </Section>
        )}

        {sections.experiencia.visible && experiencia.length > 0 && (
          <Section title={sections.experiencia.title} color={design.textColor}>
            {experiencia.map((exp, i) => (
              <div key={exp.id} style={{ marginBottom: i < experiencia.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 11.5 }}>{exp.cargo}</span>
                  <span style={{ fontSize: 9.5, opacity: 0.55, flexShrink: 0, marginLeft: 8 }}>
                    {exp.inicio} – {exp.atual ? "Presente" : exp.fim}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: P }}>{exp.empresa}{exp.localizacao ? ` · ${exp.localizacao}` : ""}</div>
                {exp.descricao && <p style={{ fontSize: 10, lineHeight: 1.65, marginTop: 3, opacity: 0.7 }}>{exp.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.educacao.visible && educacao.length > 0 && (
          <Section title={sections.educacao.title} color={design.textColor}>
            {educacao.map((e, i) => (
              <div key={e.id} style={{ marginBottom: i < educacao.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{e.grau}{e.curso ? ` em ${e.curso}` : ""}</span>
                  <span style={{ fontSize: 9.5, opacity: 0.55, flexShrink: 0, marginLeft: 8 }}>
                    {e.anoInicio} – {e.anoFim || "Presente"}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: P, fontWeight: 500 }}>{e.instituicao}</div>
                {e.nota && <div style={{ fontSize: 9.5, opacity: 0.55 }}>Classificação: {e.nota}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Two columns for skills + languages */}
        {((sections.skills.visible && skills.length > 0) || (sections.idiomas.visible && idiomas.length > 0)) && (
          <div style={{ display: "flex", gap: 40 }}>
            {sections.skills.visible && skills.length > 0 && (
              <div style={{ flex: 2 }}>
                <Section title={sections.skills.title} color={design.textColor}>
                  <p style={{ fontSize: 10.5, lineHeight: 1.9 }}>
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
              <div style={{ flex: 1 }}>
                <Section title={sections.idiomas.title} color={design.textColor}>
                  {idiomas.map(id => (
                    <div key={id.id} style={{ fontSize: 10.5, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{id.idioma}</span>
                      <span style={{ opacity: 0.55, marginLeft: 5, fontSize: 10 }}>({id.nivel})</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{proj.nome}</span>
                  {proj.url && <a href={proj.url} style={{ fontSize: 9.5, color: P }}>{proj.url}</a>}
                </div>
                {proj.tecnologias && <div style={{ fontSize: 9.5, opacity: 0.5, marginTop: 1 }}>{proj.tecnologias}</div>}
                {proj.descricao && <p style={{ fontSize: 10, lineHeight: 1.6, marginTop: 3, opacity: 0.7 }}>{proj.descricao}</p>}
              </div>
            ))}
          </Section>
        )}

        {sections.certificacoes.visible && certificacoes.length > 0 && (
          <Section title={sections.certificacoes.title} color={design.textColor}>
            {certificacoes.map((cert, i) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: i < certificacoes.length - 1 ? 6 : 0 }}>
                <span>
                  <span style={{ fontWeight: 700, fontSize: 11 }}>{cert.nome}</span>
                  {cert.emissor && <span style={{ opacity: 0.55, marginLeft: 6, fontSize: 10 }}>· {cert.emissor}</span>}
                </span>
                <span style={{ fontSize: 9.5, opacity: 0.5, flexShrink: 0, marginLeft: 8 }}>{cert.data}</span>
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
        <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: color + "25" }} />
      </div>
      {children}
    </div>
  );
}

function Sep() {
  return <span style={{ opacity: 0.3 }}>|</span>;
}
