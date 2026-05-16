import type { TemplateProps } from "./shared";
import { bullets, Footer, fullName, Photo, shell, showSection } from "./shared";

export function ModernTemplate({ data, settings }: TemplateProps) {
  const c = settings.primaryColor;
  const title = (x: string) => <h2 style={{ borderBottom: `2px solid ${c}`, paddingBottom: "5px", margin: "24px 0 12px", fontSize: "15px", fontWeight: 800, fontFamily: settings.fontFamily }}>{x}</h2>;
  return (
    <div style={shell(settings)}>
      <div style={{ display: "flex", flex: 1, fontFamily: settings.fontFamily }}>
        <div style={{ width: "8px", background: c }} />
        <main style={{ padding: "38px 52px 22px", flex: 1, fontFamily: settings.fontFamily }}>
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <Photo data={data} size={76} border={c} />
            <div>
              <h1 style={{ margin: 0, fontSize: "38px", fontWeight: 800, color: "#111827", fontFamily: settings.fontFamily }}>{fullName(data)}</h1>
              <p style={{ margin: "5px 0 0", color: c, fontWeight: 700, fontFamily: settings.fontFamily }}>{data.targetRole}</p>
            </div>
          </div>
          {showSection(data, "contact") && <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", color: "#4B5563", fontSize: "11px", fontFamily: settings.fontFamily }}>
            {[data.email, data.phone, data.city, data.linkedin, data.website].filter(Boolean).join(" · ")}
          </div>}
          {showSection(data, "profile") && data.profile && <>{title("Perfil profissional")}<p>{data.profile}</p></>}
          {showSection(data, "experience") && data.experiences.length > 0 && <>{title("Experiencia profissional")}{data.experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: "15px", fontFamily: settings.fontFamily }}>
              <strong>{exp.role}</strong> <span style={{ color: c }}>@ {exp.company}</span>
              <div style={{ color: "#6B7280", fontSize: "11px" }}>{exp.location} · {exp.start} - {exp.current ? "Presente" : exp.end}</div>
              <ul style={{ marginTop: "7px" }}>{bullets(exp.description).map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ))}</>}
          {showSection(data, "education") && data.education.length > 0 && <>{title("Educacao")}{data.education.map((edu) => (
            <p key={edu.id}><strong>{edu.course}</strong>, {edu.institution} <span style={{ color: "#6B7280" }}>({edu.start}-{edu.end})</span><br />{edu.description}</p>
          ))}</>}
          {showSection(data, "skills") && data.skills.length > 0 && <>{title("Competencias")}<p>{data.skills.map((s) => s.name).join(" · ")}</p></>}
          {showSection(data, "languages") && data.languages.length > 0 && <>{title("Idiomas")}<p>{data.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p></>}
          {showSection(data, "projects") && data.projects.length > 0 && <>{title("Projectos")}{data.projects.map((item) => <p key={item.id}><strong>{item.title}</strong><br />{item.description}</p>)}</>}
          {showSection(data, "certifications") && data.certifications.length > 0 && <>{title("Certificacoes")}{data.certifications.map((item) => <p key={item.id}><strong>{item.title}</strong> · {item.issuer} {item.date}</p>)}</>}
          <div style={{ flex: 1 }} />
        </main>
      </div>
      <Footer data={data} />
    </div>
  );
}
