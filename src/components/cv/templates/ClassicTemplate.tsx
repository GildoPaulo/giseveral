import type { TemplateProps } from "./shared";
import { bullets, Footer, fullName, Photo, Progress, shell, showSection } from "./shared";

export function ClassicTemplate({ data, settings }: TemplateProps) {
  const c = settings.primaryColor;
  const section = (title: string) => (
    <div style={{ margin: "0 0 12px", fontFamily: settings.fontFamily }}>
      <div style={{ color: c, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0", fontSize: "13px" }}>{title}</div>
      <div style={{ height: "2px", width: "48px", background: c, marginTop: "5px" }} />
    </div>
  );

  return (
    <div style={shell(settings)}>
      <div style={{ display: "flex", flex: 1, fontFamily: settings.fontFamily }}>
        <aside style={{ width: "35%", background: c, color: "#ffffff", padding: "32px 24px", fontFamily: settings.fontFamily }}>
          <Photo data={data} />
          <h1 style={{ margin: "18px 0 4px", fontSize: "28px", lineHeight: 1.05, fontWeight: 800, fontFamily: settings.fontFamily }}>{fullName(data)}</h1>
          <p style={{ margin: 0, color: "#BFDBFE", fontSize: "14px", fontFamily: settings.fontFamily }}>{data.targetRole}</p>
          <div style={{ height: "1px", background: "#93C5FD", margin: "22px 0" }} />
          {showSection(data, "contact") && <><h2 style={{ fontSize: "12px", textTransform: "uppercase", fontFamily: settings.fontFamily }}>Contactos</h2>
          {[data.email, data.phone, [data.address, data.postalCode, data.city].filter(Boolean).join(", "), data.linkedin, data.website].filter(Boolean).map((x) => (
            <p key={x} style={{ fontSize: "11px", margin: "7px 0", fontFamily: settings.fontFamily }}>• {x}</p>
          ))}</>}
          {showSection(data, "skills") && data.skills.length > 0 && <h2 style={{ marginTop: "22px", fontSize: "12px", textTransform: "uppercase", fontFamily: settings.fontFamily }}>Competencias</h2>}
          {showSection(data, "skills") && data.skills.map((skill) => (
            <div key={skill.id} style={{ marginBottom: "10px", fontFamily: settings.fontFamily }}>
              <div style={{ fontSize: "11px" }}>{skill.name}</div>
              <Progress level={skill.level} color="#93C5FD" />
            </div>
          ))}
          {showSection(data, "languages") && data.languages.length > 0 && <h2 style={{ marginTop: "22px", fontSize: "12px", textTransform: "uppercase", fontFamily: settings.fontFamily }}>Idiomas</h2>}
          {showSection(data, "languages") && data.languages.map((lang) => (
            <p key={lang.id} style={{ fontSize: "11px", margin: "6px 0", fontFamily: settings.fontFamily }}>{lang.name} · {lang.level}</p>
          ))}
        </aside>
        <main style={{ width: "65%", padding: "34px 34px 22px", fontFamily: settings.fontFamily }}>
          {showSection(data, "profile") && data.profile && <>{section("Perfil profissional")}<p style={{ marginTop: 0, color: "#374151", fontFamily: settings.fontFamily }}>{data.profile}</p></>}
          {showSection(data, "experience") && data.experiences.length > 0 && <>{section("Experiencia profissional")}<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>{data.experiences.map((exp) => (
            <div key={exp.id} style={{ fontFamily: settings.fontFamily }}>
              <strong>{exp.role}</strong>
              <div style={{ color: c, fontSize: "12px" }}>{exp.company} · {exp.location}</div>
              <div style={{ color: "#6B7280", fontSize: "11px" }}>{exp.start} - {exp.current ? "Presente" : exp.end}</div>
              <ul style={{ paddingLeft: "16px", marginTop: "7px" }}>{bullets(exp.description).map((b) => <li key={b} style={{ marginBottom: "4px" }}>{b}</li>)}</ul>
            </div>
          ))}</div></>}
          {showSection(data, "education") && data.education.length > 0 && <>{section("Educacao")}{data.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: "12px", fontFamily: settings.fontFamily }}>
              <strong>{edu.course}</strong>
              <div style={{ color: c, fontSize: "12px" }}>{edu.institution} · {edu.location}</div>
              <div style={{ color: "#6B7280", fontSize: "11px" }}>{edu.start} - {edu.end}</div>
              <p style={{ margin: "5px 0 0" }}>{edu.description}</p>
            </div>
          ))}</>}
          {showSection(data, "projects") && data.projects.length > 0 && <>{section("Projectos")}{data.projects.map((item) => <p key={item.id}><strong>{item.title}</strong><br />{item.description}</p>)}</>}
          {showSection(data, "certifications") && data.certifications.length > 0 && <>{section("Certificacoes")}{data.certifications.map((item) => <p key={item.id}><strong>{item.title}</strong> · {item.issuer} {item.date}</p>)}</>}
          <div style={{ flex: 1 }} />
        </main>
      </div>
      <Footer data={data} />
    </div>
  );
}
