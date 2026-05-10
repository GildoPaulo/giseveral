import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CvData } from "../types";
import { SKILL_PCT } from "../types";

const C = {
  header:    "#0f4c81",
  accent:    "#c9a84c",
  gold:      "#b8860b",
  body:      "#1a1a2e",
  textMid:   "#374151",
  textMuted: "#6b7280",
  white:     "#ffffff",
  border:    "#e5e7eb",
  muted:     "#f3f4f6",
  accentLt:  "#e8f1fb",
} as const;

const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.body,
    flexDirection: "column",
  },
  // ── Header ──
  header: {
    backgroundColor: C.header,
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: "column",
    rowGap: 6,
  },
  headerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: C.white,
    letterSpacing: -0.3,
    lineHeight: 1.15,
  },
  headerTitle: {
    fontSize: 12,
    color: C.accent,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 3,
  },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  contactDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
  },
  contactText: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.82)",
  },
  // ── Body ──
  body: {
    flexDirection: "row",
    flex: 1,
    columnGap: 0,
  },
  leftCol: {
    width: "35%",
    backgroundColor: C.muted,
    paddingHorizontal: 18,
    paddingVertical: 22,
    flexDirection: "column",
    rowGap: 16,
  },
  rightCol: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
    flexDirection: "column",
    rowGap: 14,
  },
  // ── Section titles ──
  sectionTitleLeft: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: C.header,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    marginBottom: 6,
  },
  sectionTitleRight: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.header,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    marginBottom: 8,
  },
  // ── Left content ──
  skillRow: {
    marginBottom: 6,
  },
  skillLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  skillName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.body,
  },
  skillLevel: {
    fontSize: 8,
    color: C.textMuted,
  },
  skillBarBg: {
    height: 3,
    backgroundColor: C.border,
    borderRadius: 99,
  },
  skillBarFill: {
    height: 3,
    backgroundColor: C.accent,
    borderRadius: 99,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  langName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.body,
  },
  langLevel: {
    fontSize: 8.5,
    color: C.textMuted,
  },
  eduItem: {
    marginBottom: 8,
  },
  eduDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: C.body,
    lineHeight: 1.3,
  },
  eduInst: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.gold,
    marginTop: 1,
  },
  eduDate: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 1,
  },
  // ── Right content ──
  bodyText: {
    fontSize: 9.5,
    color: C.textMid,
    lineHeight: 1.65,
    flexShrink: 1,
    minWidth: 0,
  },
  expItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  expRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: C.header,
    flex: 1,
    minWidth: 0,
  },
  expDate: {
    fontSize: 8.5,
    color: C.textMuted,
    marginLeft: 8,
    flexShrink: 0,
  },
  expCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.gold,
    marginBottom: 3,
  },
  expDesc: {
    fontSize: 9,
    color: C.textMid,
    lineHeight: 1.6,
    flexShrink: 1,
    minWidth: 0,
  },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function CreativeCVDocument({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);
  const contacts  = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean);

  return (
    <Document title={`CV – ${p.nome}`} author={p.nome} subject="Curriculum Vitae">
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <Text style={S.headerName}>{p.nome || "O seu nome"}</Text>
          {p.titulo && <Text style={S.headerTitle}>{p.titulo}</Text>}
          {contacts.length > 0 && (
            <View style={S.contactRow}>
              {contacts.map((c, i) => (
                <View key={i} style={S.contactChip}>
                  <View style={S.contactDot} />
                  <Text style={S.contactText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <View style={S.body}>
          {/* Left */}
          <View style={S.leftCol}>
            {filledEdu.length > 0 && (
              <View>
                <Text style={S.sectionTitleLeft}>Educação</Text>
                {filledEdu.map((e) => (
                  <View key={e.id} style={S.eduItem}>
                    <Text style={S.eduDegree}>{e.grau}{e.curso ? ` em ${e.curso}` : ""}</Text>
                    <Text style={S.eduInst}>{e.instituicao}</Text>
                    <Text style={S.eduDate}>{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}{e.nota ? ` · Nota: ${e.nota}` : ""}</Text>
                  </View>
                ))}
              </View>
            )}

            {filledSk.length > 0 && (
              <View>
                <Text style={S.sectionTitleLeft}>Competências</Text>
                {filledSk.map((sk) => (
                  <View key={sk.id} style={S.skillRow}>
                    <View style={S.skillLabelRow}>
                      <Text style={S.skillName}>{sk.nome}</Text>
                      <Text style={S.skillLevel}>{sk.nivel}</Text>
                    </View>
                    <View style={S.skillBarBg}>
                      <View style={[S.skillBarFill, { width: `${SKILL_PCT[sk.nivel]}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {filledId.length > 0 && (
              <View>
                <Text style={S.sectionTitleLeft}>Idiomas</Text>
                {filledId.map((id) => (
                  <View key={id.id} style={S.langRow}>
                    <Text style={S.langName}>{id.idioma}</Text>
                    <Text style={S.langLevel}>{id.nivel}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right */}
          <View style={S.rightCol}>
            {p.objetivo && (
              <View>
                <Text style={S.sectionTitleRight}>Perfil Profissional</Text>
                <Text style={S.bodyText}>{p.objetivo}</Text>
              </View>
            )}

            {filledExp.length > 0 && (
              <View>
                <Text style={S.sectionTitleRight}>Experiência</Text>
                {filledExp.map((e) => (
                  <View key={e.id} style={S.expItem}>
                    <View style={S.expHeader}>
                      <Text style={S.expRole}>{e.cargo}</Text>
                      <Text style={S.expDate}>{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</Text>
                    </View>
                    <Text style={S.expCompany}>{e.empresa}</Text>
                    {e.descricao && <Text style={S.expDesc}>{e.descricao}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── HTML Preview ─────────────────────────────────────────────────────────────

export function CreativeCVPreview({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);
  const contacts  = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean);

  return (
    <div className="flex flex-col min-h-[700px] text-sm">
      {/* Header */}
      <div className="bg-[#0f4c81] text-white px-8 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{p.nome || "O seu nome"}</h1>
        {p.titulo && <p className="text-sm text-[#c9a84c] italic mb-3">{p.titulo}</p>}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {contacts.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />{c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left */}
        <div className="w-[34%] bg-gray-50 dark:bg-muted px-5 py-5 flex flex-col gap-5">
          {filledEdu.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#0f4c81] dark:text-foreground mb-2 pb-1 border-b-2 border-[#c9a84c]">Educação</div>
              {filledEdu.map((e) => (
                <div key={e.id} className="mb-3">
                  <div className="font-bold text-[12px] text-foreground leading-snug">{e.grau}{e.curso ? ` em ${e.curso}` : ""}</div>
                  <div className="text-[11px] font-semibold text-[#b8860b]">{e.instituicao}</div>
                  <div className="text-[10px] text-gray-400">{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}{e.nota ? ` · Nota: ${e.nota}` : ""}</div>
                </div>
              ))}
            </div>
          )}
          {filledSk.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#0f4c81] dark:text-foreground mb-2 pb-1 border-b-2 border-[#c9a84c]">Competências</div>
              {filledSk.map((sk) => (
                <div key={sk.id} className="mb-2.5">
                  <div className="flex justify-between text-[11px] mb-1"><span className="font-semibold">{sk.nome}</span><span className="text-gray-400">{sk.nivel}</span></div>
                  <div className="h-1 rounded-full bg-gray-200"><div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${SKILL_PCT[sk.nivel]}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          {filledId.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#0f4c81] dark:text-foreground mb-2 pb-1 border-b-2 border-[#c9a84c]">Idiomas</div>
              {filledId.map((id) => (
                <div key={id.id} className="flex justify-between text-[11px] mb-1.5"><span className="font-semibold">{id.idioma}</span><span className="text-gray-400">{id.nivel}</span></div>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-5">
          {p.objetivo && (
            <div>
              <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#0f4c81] dark:text-foreground mb-2 pb-1.5 border-b-2 border-[#c9a84c]">Perfil Profissional</div>
              <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{p.objetivo}</p>
            </div>
          )}
          {filledExp.length > 0 && (
            <div>
              <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#0f4c81] dark:text-foreground mb-2 pb-1.5 border-b-2 border-[#c9a84c]">Experiência</div>
              {filledExp.map((e) => (
                <div key={e.id} className="mb-4">
                  <div className="flex justify-between items-start gap-2 mb-0.5">
                    <span className="font-bold text-[13px] text-[#0f4c81] dark:text-foreground">{e.cargo}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#b8860b] mb-1">{e.empresa}</div>
                  {e.descricao && <p className="text-[11px] text-gray-500 leading-relaxed">{e.descricao}</p>}
                </div>
              ))}
            </div>
          )}
          {!p.objetivo && filledExp.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Preencha os dados para visualizar o CV.</div>
          )}
        </div>
      </div>
    </div>
  );
}
