import type { TemplateProps } from "./shared";
import { bullets, Footer, fullName, shell, showSection } from "./shared";

export function ProfessionalTemplate({ data, settings }: TemplateProps) {
  const section = (x: string) => <h2 style={{ margin: "22px 0 10px", paddingTop: "10px", borderTop: "1px solid #D1D5DB", textTransform: "uppercase", letterSpacing: "0", fontSize: "13px", fontWeight: 800, fontFamily: settings.fontFamily }}>{x}</h2>;
  return (
    <div style={shell(settings)}>
      <main style={{ padding: "42px 58px 22px", flex: 1, fontFamily: settings.fontFamily }}>
        <header style={{ textAlign: "center", fontFamily: settings.fontFamily }}>
          <h1 style={{ margin: 0, fontSize: "34px", color: settings.primaryColor, fontWeight: 800, fontFamily: settings.fontFamily }}>{fullName(data)}</h1>
          <p style={{ margin: "6px 0", fontWeight: 700, fontFamily: settings.fontFamily }}>{data.targetRole}</p>
          {showSection(data, "contact") && <p style={{ margin: 0, color: "#4B5563", fontSize: "11px", fontFamily: settings.fontFamily }}>{[data.email, data.phone, data.city, data.linkedin].filter(Boolean).join(" | ")}</p>}
        </header>
        {showSection(data, "profile") && data.profile && <>{section("Perfil profissional")}<p>{data.profile}</p></>}
        {showSection(data, "experience") && data.experiences.length > 0 && <>{section("Experiencia profissional")}{data.experiences.map((exp) => (
          <div key={exp.id} style={{ marginBottom: "14px", fontFamily: settings.fontFamily }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <strong>{exp.role} - {exp.company}</strong>
              <span style={{ color: "#6B7280", fontSize: "11px" }}>{exp.start} - {exp.current ? "Presente" : exp.end}</span>
            </div>
            <div style={{ color: "#6B7280", fontSize: "11px" }}>{exp.location}</div>
            <ul>{bullets(exp.description).map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        ))}</>}
        {showSection(data, "education") && data.education.length > 0 && <>{section("Educacao")}{data.education.map((edu) => (
          <p key={edu.id}><strong>{edu.course}</strong> - {edu.institution}, {edu.location} ({edu.start}-{edu.end})<br />{edu.description}</p>
        ))}</>}
        {showSection(data, "skills") && data.skills.length > 0 && <>{section("Competencias")}<p>{data.skills.map((s) => s.name).join(", ")}</p></>}
        {showSection(data, "languages") && data.languages.length > 0 && <>{section("Idiomas")}<p>{data.languages.map((l) => `${l.name}: ${l.level}`).join(", ")}</p></>}
        {showSection(data, "projects") && data.projects.length > 0 && <>{section("Projectos")}{data.projects.map((item) => <p key={item.id}><strong>{item.title}</strong><br />{item.description}</p>)}</>}
        {showSection(data, "certifications") && data.certifications.length > 0 && <>{section("Certificacoes")}{data.certifications.map((item) => <p key={item.id}><strong>{item.title}</strong> - {item.issuer} {item.date}</p>)}</>}
        <div style={{ flex: 1 }} />
      </main>
      <Footer data={data} />
    </div>
  );
}
