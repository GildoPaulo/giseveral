import type { TemplateProps } from "./shared";
import { bullets, Footer, fullName, Photo, Progress, shell, showSection } from "./shared";

export function CreativeTemplate({ data, settings }: TemplateProps) {
  const c = settings.primaryColor;
  const heading = (x: string) => <h2 style={{ fontSize: "14px", margin: "0 0 12px", color: c, fontWeight: 800, fontFamily: settings.fontFamily }}>{x}</h2>;
  return (
    <div style={shell(settings)}>
      <header style={{ background: c, color: "#ffffff", padding: "34px 42px", display: "flex", alignItems: "center", gap: "22px", fontFamily: settings.fontFamily }}>
        <Photo data={data} size={92} border="#ffffff" />
        <div>
          <h1 style={{ margin: 0, fontSize: "36px", fontWeight: 800, fontFamily: settings.fontFamily }}>{fullName(data)}</h1>
          <p style={{ margin: "6px 0 0", color: "#DBEAFE", fontFamily: settings.fontFamily }}>{data.targetRole}</p>
        </div>
      </header>
      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "60% 40%", gap: "24px", padding: "30px 38px", fontFamily: settings.fontFamily }}>
        <section>
          {showSection(data, "profile") && data.profile && <div style={{ marginBottom: "22px" }}>{heading("Perfil profissional")}<p>{data.profile}</p></div>}
          {showSection(data, "experience") && data.experiences.length > 0 && <div>{heading("Experiencia")}{data.experiences.map((exp) => (
            <div key={exp.id} style={{ borderLeft: `4px solid ${c}`, padding: "10px 0 10px 14px", marginBottom: "14px", background: "#F9FAFB", fontFamily: settings.fontFamily }}>
              <strong>{exp.role}</strong>
              <div style={{ color: c, fontSize: "12px" }}>{exp.company} · {exp.location}</div>
              <div style={{ color: "#6B7280", fontSize: "11px" }}>{exp.start} - {exp.current ? "Presente" : exp.end}</div>
              <ul>{bullets(exp.description).map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ))}</div>}
          {showSection(data, "education") && data.education.length > 0 && <div>{heading("Educacao")}{data.education.map((edu) => <p key={edu.id}><strong>{edu.course}</strong><br />{edu.institution} · {edu.start}-{edu.end}</p>)}</div>}
          {showSection(data, "projects") && data.projects.length > 0 && <div>{heading("Projectos")}{data.projects.map((item) => <p key={item.id}><strong>{item.title}</strong><br />{item.description}</p>)}</div>}
        </section>
        <aside>
          {showSection(data, "contact") && <>{heading("Contactos")}
          {[data.email, data.phone, data.city, data.linkedin, data.website, data.github].filter(Boolean).map((x) => <p key={x} style={{ fontSize: "11px" }}>{x}</p>)}</>}
          {showSection(data, "skills") && data.skills.length > 0 && <div style={{ marginTop: "22px" }}>{heading("Competencias")}{data.skills.map((s) => <div key={s.id} style={{ marginBottom: "10px" }}>{s.name}<Progress level={s.level} color={c} /></div>)}</div>}
          {showSection(data, "languages") && data.languages.length > 0 && <div style={{ marginTop: "22px" }}>{heading("Idiomas")}{data.languages.map((l) => <p key={l.id}>{l.name} · {l.level}</p>)}</div>}
          {showSection(data, "certifications") && data.certifications.length > 0 && <div style={{ marginTop: "22px" }}>{heading("Certificacoes")}{data.certifications.map((item) => <p key={item.id}>{item.title}<br />{item.issuer} {item.date}</p>)}</div>}
        </aside>
      </main>
      <Footer data={data} />
    </div>
  );
}
