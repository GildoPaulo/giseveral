import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CvData } from "../types";

// ATS-friendly: single column, pure black & white, no bars, text-parseable
const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
    paddingHorizontal: 48,
    paddingVertical: 44,
    flexDirection: "column",
    rowGap: 0,
  },
  // Header
  headerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#1a1a2e",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 8,
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a2e",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 2,
    marginBottom: 4,
  },
  contactItem: {
    fontSize: 9,
    color: "#4b5563",
  },
  separator: {
    fontSize: 9,
    color: "#9ca3af",
  },
  // Sections
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#1a1a2e",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.7,
    flexShrink: 1,
    minWidth: 0,
  },
  // Experience
  expItem: {
    marginBottom: 10,
  },
  expTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  expRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#1a1a2e",
    flex: 1,
    minWidth: 0,
  },
  expDate: {
    fontSize: 9,
    color: "#6b7280",
    flexShrink: 0,
    marginLeft: 8,
  },
  expCompany: {
    fontSize: 9.5,
    color: "#374151",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 3,
  },
  expDesc: {
    fontSize: 9.5,
    color: "#4b5563",
    lineHeight: 1.65,
    flexShrink: 1,
    minWidth: 0,
  },
  // Education
  eduItem: {
    marginBottom: 8,
  },
  eduTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eduDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#1a1a2e",
    flex: 1,
    minWidth: 0,
  },
  eduDate: {
    fontSize: 9,
    color: "#6b7280",
    flexShrink: 0,
    marginLeft: 8,
  },
  eduInst: {
    fontSize: 9.5,
    color: "#374151",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 1,
  },
  eduNote: {
    fontSize: 9,
    color: "#6b7280",
  },
  // Skills — text chips (no bars, ATS parseable)
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 5,
  },
  skillChip: {
    fontSize: 9.5,
    color: "#1a1a2e",
    borderWidth: 0.75,
    borderColor: "#d1d5db",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 3,
  },
  // Languages — simple table-like rows
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 3,
  },
  langName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#1a1a2e",
  },
  langLevel: {
    fontSize: 9.5,
    color: "#6b7280",
  },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function ATSCVDocument({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);
  const contacts  = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean);

  return (
    <Document title={`CV – ${p.nome}`} author={p.nome} subject="Curriculum Vitae">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <Text style={S.headerName}>{p.nome || "O seu nome"}</Text>
        {p.titulo && <Text style={S.headerTitle}>{p.titulo}</Text>}
        <View style={S.headerDivider} />
        {contacts.length > 0 && (
          <View style={S.contactRow}>
            {contacts.map((c, i) => (
              <Text key={i} style={S.contactItem}>{c}{i < contacts.length - 1 ? "  ·" : ""}</Text>
            ))}
          </View>
        )}

        {/* Summary */}
        {p.objetivo && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Perfil</Text>
            <Text style={S.bodyText}>{p.objetivo}</Text>
          </View>
        )}

        {/* Experience */}
        {filledExp.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Experiência Profissional</Text>
            {filledExp.map((e) => (
              <View key={e.id} style={S.expItem}>
                <View style={S.expTopRow}>
                  <Text style={S.expRole}>{e.cargo}</Text>
                  <Text style={S.expDate}>{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</Text>
                </View>
                <Text style={S.expCompany}>{e.empresa}</Text>
                {e.descricao && <Text style={S.expDesc}>{e.descricao}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {filledEdu.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Educação</Text>
            {filledEdu.map((e) => (
              <View key={e.id} style={S.eduItem}>
                <View style={S.eduTopRow}>
                  <Text style={S.eduDegree}>{e.grau}{e.curso ? ` em ${e.curso}` : ""}</Text>
                  <Text style={S.eduDate}>{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}</Text>
                </View>
                <Text style={S.eduInst}>{e.instituicao}</Text>
                {e.nota && <Text style={S.eduNote}>Nota: {e.nota}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills — text only for ATS */}
        {filledSk.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Competências</Text>
            <View style={S.skillsWrap}>
              {filledSk.map((sk) => (
                <Text key={sk.id} style={S.skillChip}>{sk.nome}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {filledId.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Idiomas</Text>
            {filledId.map((id) => (
              <View key={id.id} style={S.langRow}>
                <Text style={S.langName}>{id.idioma}</Text>
                <Text style={S.langLevel}>{id.nivel}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ─── HTML Preview ─────────────────────────────────────────────────────────────

export function ATSCVPreview({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);
  const contacts  = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean);

  return (
    <div className="bg-white dark:bg-card px-10 py-10 min-h-[700px] text-sm">
      {/* Header */}
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">{p.nome || "O seu nome"}</h1>
      {p.titulo && <p className="text-[13px] italic text-muted-foreground mb-2">{p.titulo}</p>}
      <div className="border-b-2 border-foreground mb-2" />
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mb-2">
          {contacts.map((c, i) => (
            <span key={i}>{c}{i < contacts.length - 1 && <span className="mx-1.5 opacity-40">·</span>}</span>
          ))}
        </div>
      )}

      {/* Summary */}
      {p.objetivo && <ATSSection title="Perfil"><p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{p.objetivo}</p></ATSSection>}

      {/* Experience */}
      {filledExp.length > 0 && (
        <ATSSection title="Experiência Profissional">
          {filledExp.map((e) => (
            <div key={e.id} className="mb-4 pl-3 border-l-2 border-gray-200 dark:border-border">
              <div className="flex justify-between items-baseline gap-2 mb-0.5">
                <span className="font-bold text-[13px] text-foreground">{e.cargo}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
              </div>
              <div className="text-[11px] italic text-muted-foreground mb-1">{e.empresa}</div>
              {e.descricao && <p className="text-[11px] text-gray-500 leading-relaxed">{e.descricao}</p>}
            </div>
          ))}
        </ATSSection>
      )}

      {/* Education */}
      {filledEdu.length > 0 && (
        <ATSSection title="Educação">
          {filledEdu.map((e) => (
            <div key={e.id} className="mb-3 pl-3 border-l-2 border-gray-200 dark:border-border">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-bold text-[13px] text-foreground">{e.grau}{e.curso ? ` em ${e.curso}` : ""}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}</span>
              </div>
              <div className="text-[11px] italic text-muted-foreground">{e.instituicao}</div>
              {e.nota && <div className="text-[10px] text-muted-foreground/70 mt-0.5">Nota: {e.nota}</div>}
            </div>
          ))}
        </ATSSection>
      )}

      {/* Skills */}
      {filledSk.length > 0 && (
        <ATSSection title="Competências">
          <div className="flex flex-wrap gap-2">
            {filledSk.map((sk) => (
              <span key={sk.id} className="border border-border rounded px-2.5 py-1 text-[11px] text-foreground">{sk.nome}</span>
            ))}
          </div>
        </ATSSection>
      )}

      {/* Languages */}
      {filledId.length > 0 && (
        <ATSSection title="Idiomas">
          {filledId.map((id) => (
            <div key={id.id} className="flex justify-between text-[11px] border-b border-gray-100 dark:border-border/50 py-1">
              <span className="font-semibold text-foreground">{id.idioma}</span>
              <span className="text-muted-foreground">{id.nivel}</span>
            </div>
          ))}
        </ATSSection>
      )}

      {!p.objetivo && filledExp.length === 0 && filledEdu.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Preencha os dados para visualizar o CV.</div>
      )}
    </div>
  );
}

function ATSSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[10px] font-bold tracking-widest uppercase text-foreground mb-2 pb-1 border-b border-gray-300 dark:border-border">{title}</div>
      {children}
    </div>
  );
}
