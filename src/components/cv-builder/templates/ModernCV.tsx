import { Document, Page, View, Text, Link, StyleSheet } from "@react-pdf/renderer";
import type { CvData } from "../types";
import { SKILL_PCT } from "../types";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  sidebar:    "#1e2a4a",
  sidebarFg:  "#ffffff",
  accent:     "#c9a84c",
  gold:       "#b8860b",
  body:       "#1a1a2e",
  textMid:    "#374151",
  textMuted:  "#6b7280",
  white:      "#ffffff",
  border:     "#e5e7eb",
  sideAlpha:  "rgba(255,255,255,0.18)",
  skillBg:    "rgba(255,255,255,0.15)",
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.body,
  },
  // ── Sidebar ──
  sidebar: {
    width: "33%",
    backgroundColor: C.sidebar,
    paddingHorizontal: 18,
    paddingVertical: 28,
    flexDirection: "column",
    rowGap: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 6,
  },
  avatarText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: C.sidebarFg,
  },
  sideName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: C.sidebarFg,
    textAlign: "center",
    lineHeight: 1.2,
  },
  sideTitle: {
    fontSize: 10,
    color: C.accent,
    textAlign: "center",
    marginTop: 3,
    fontFamily: "Helvetica-Oblique",
  },
  sideSection: {
    flexDirection: "column",
    rowGap: 6,
  },
  sideSectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.18)",
    marginBottom: 2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 5,
    marginBottom: 4,
  },
  contactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.accent,
    marginTop: 1,
    flexShrink: 0,
  },
  contactText: {
    fontSize: 8.5,
    color: C.sidebarFg,
    flex: 1,
    lineHeight: 1.5,
  },
  skillRow: {
    flexDirection: "column",
    rowGap: 2,
    marginBottom: 6,
  },
  skillLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skillName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.sidebarFg,
  },
  skillLevel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
  },
  skillBarBg: {
    height: 3.5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 99,
    marginTop: 3,
  },
  skillBarFill: {
    height: 3.5,
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
    color: C.sidebarFg,
  },
  langLevel: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.65)",
  },
  // ── Main ──
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexDirection: "column",
    rowGap: 16,
  },
  section: {
    flexDirection: "column",
    rowGap: 8,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1.2,
    color: C.body,
    textTransform: "uppercase",
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 9.5,
    color: C.textMid,
    lineHeight: 1.65,
    flexShrink: 1,
    minWidth: 0,
  },
  expItem: {
    flexDirection: "column",
    rowGap: 2,
    marginBottom: 8,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  expRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.body,
    flex: 1,
    minWidth: 0,
  },
  expDate: {
    fontSize: 8.5,
    color: C.textMuted,
    flexShrink: 0,
    marginLeft: 8,
  },
  expCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.gold,
    marginBottom: 2,
  },
  expDesc: {
    fontSize: 9,
    color: C.textMid,
    lineHeight: 1.6,
    flexShrink: 1,
    minWidth: 0,
  },
  eduItem: {
    flexDirection: "column",
    rowGap: 2,
    marginBottom: 6,
  },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eduDegree: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.body,
    flex: 1,
    minWidth: 0,
  },
  eduDate: {
    fontSize: 8.5,
    color: C.textMuted,
    flexShrink: 0,
    marginLeft: 8,
  },
  eduInst: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: C.gold,
  },
  eduNote: {
    fontSize: 8.5,
    color: C.textMuted,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.sideSection}>
      <Text style={S.sideSectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function ContactItem({ value }: { value: string }) {
  return (
    <View style={S.contactItem}>
      <View style={S.contactDot} />
      <Text style={S.contactText}>{value}</Text>
    </View>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.section}>
      <Text style={S.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function ModernCVDocument({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);

  const initials = p.nome
    ? p.nome.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "CV";

  const contacts = [p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean);

  return (
    <Document title={`CV – ${p.nome}`} author={p.nome} subject="Curriculum Vitae">
      <Page size="A4" style={S.page}>

        {/* ── Sidebar ── */}
        <View style={S.sidebar}>
          {/* Avatar + name */}
          <View>
            <View style={S.avatar}><Text style={S.avatarText}>{initials}</Text></View>
            <Text style={S.sideName}>{p.nome || "O seu nome"}</Text>
            {p.titulo && <Text style={S.sideTitle}>{p.titulo}</Text>}
          </View>

          {/* Contact */}
          {contacts.length > 0 && (
            <SideSection title="Contacto">
              {contacts.map((c, i) => <ContactItem key={i} value={c} />)}
            </SideSection>
          )}

          {/* Skills */}
          {filledSk.length > 0 && (
            <SideSection title="Competências">
              {filledSk.map((sk) => (
                <View key={sk.id} style={S.skillRow}>
                  <View style={S.skillLabel}>
                    <Text style={S.skillName}>{sk.nome}</Text>
                    <Text style={S.skillLevel}>{sk.nivel}</Text>
                  </View>
                  <View style={S.skillBarBg}>
                    <View style={[S.skillBarFill, { width: `${SKILL_PCT[sk.nivel]}%` }]} />
                  </View>
                </View>
              ))}
            </SideSection>
          )}

          {/* Languages */}
          {filledId.length > 0 && (
            <SideSection title="Idiomas">
              {filledId.map((id) => (
                <View key={id.id} style={S.langRow}>
                  <Text style={S.langName}>{id.idioma}</Text>
                  <Text style={S.langLevel}>{id.nivel}</Text>
                </View>
              ))}
            </SideSection>
          )}
        </View>

        {/* ── Main ── */}
        <View style={S.main}>
          {p.objetivo && (
            <MainSection title="Objetivo Profissional">
              <Text style={S.bodyText}>{p.objetivo}</Text>
            </MainSection>
          )}

          {filledExp.length > 0 && (
            <MainSection title="Experiência Profissional">
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
            </MainSection>
          )}

          {filledEdu.length > 0 && (
            <MainSection title="Educação">
              {filledEdu.map((e) => (
                <View key={e.id} style={S.eduItem}>
                  <View style={S.eduHeader}>
                    <Text style={S.eduDegree}>{e.grau}{e.curso ? ` em ${e.curso}` : ""}</Text>
                    <Text style={S.eduDate}>{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}</Text>
                  </View>
                  <Text style={S.eduInst}>{e.instituicao}</Text>
                  {e.nota && <Text style={S.eduNote}>Nota: {e.nota}</Text>}
                </View>
              ))}
            </MainSection>
          )}
        </View>

      </Page>
    </Document>
  );
}

// ─── HTML Preview ─────────────────────────────────────────────────────────────

export function ModernCVPreview({ data }: { data: CvData }) {
  const { personal: p, educacao, experiencia, skills, idiomas } = data;
  const filledExp = experiencia.filter((e) => e.empresa);
  const filledEdu = educacao.filter((e) => e.instituicao);
  const filledSk  = skills.filter((s) => s.nome);
  const filledId  = idiomas.filter((i) => i.idioma);
  const initials  = p.nome ? p.nome.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() : "CV";

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-[700px] text-sm">
      {/* Sidebar */}
      <div className="bg-[#1e2a4a] text-white px-5 py-7 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 border-[3px] border-white/20 flex items-center justify-center text-3xl font-extrabold mb-3">{initials}</div>
          <div className="font-extrabold text-base leading-tight">{p.nome || "O seu nome"}</div>
          {p.titulo && <div className="text-[11px] text-[#c9a84c] italic mt-1">{p.titulo}</div>}
        </div>

        {[p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean).length > 0 && (
          <div>
            <div className="text-[9px] font-extrabold tracking-widest uppercase opacity-55 mb-2 pb-1 border-b border-white/18">Contacto</div>
            {[p.email, p.telefone, p.localizacao, p.linkedin].filter(Boolean).map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c9a84c] flex-shrink-0 mt-1.5" />
                <span className="text-[11px] break-all leading-snug">{c}</span>
              </div>
            ))}
          </div>
        )}

        {filledSk.length > 0 && (
          <div>
            <div className="text-[9px] font-extrabold tracking-widest uppercase opacity-55 mb-2 pb-1 border-b border-white/18">Competências</div>
            {filledSk.map((sk) => (
              <div key={sk.id} className="mb-2.5">
                <div className="flex justify-between text-[11px] mb-1"><span className="font-semibold">{sk.nome}</span><span className="opacity-65">{sk.nivel}</span></div>
                <div className="h-1 rounded-full bg-white/18"><div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${SKILL_PCT[sk.nivel]}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        {filledId.length > 0 && (
          <div>
            <div className="text-[9px] font-extrabold tracking-widest uppercase opacity-55 mb-2 pb-1 border-b border-white/18">Idiomas</div>
            {filledId.map((id) => (
              <div key={id.id} className="flex justify-between text-[11px] mb-1.5"><span className="font-semibold">{id.idioma}</span><span className="opacity-65">{id.nivel}</span></div>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div className="bg-white dark:bg-card px-7 py-8">
        {p.objetivo && <PreviewSection title="Objetivo Profissional"><p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{p.objetivo}</p></PreviewSection>}
        {filledExp.length > 0 && (
          <PreviewSection title="Experiência Profissional">
            {filledExp.map((e) => (
              <div key={e.id} className="mb-4">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <span className="font-bold text-[13px] text-[#1e2a4a] dark:text-foreground">{e.cargo}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{e.atual ? `${e.inicio} – Presente` : `${e.inicio}${e.fim ? ` – ${e.fim}` : ""}`}</span>
                </div>
                <div className="text-[11px] font-semibold text-[#b8860b] mb-1">{e.empresa}</div>
                {e.descricao && <p className="text-[11px] text-gray-500 leading-relaxed">{e.descricao}</p>}
              </div>
            ))}
          </PreviewSection>
        )}
        {filledEdu.length > 0 && (
          <PreviewSection title="Educação">
            {filledEdu.map((e) => (
              <div key={e.id} className="mb-3">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <span className="font-bold text-[13px] text-[#1e2a4a] dark:text-foreground">{e.grau}{e.curso ? ` em ${e.curso}` : ""}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{e.anoInicio}{e.anoFim ? ` – ${e.anoFim}` : ""}</span>
                </div>
                <div className="text-[11px] font-semibold text-[#b8860b]">{e.instituicao}</div>
                {e.nota && <div className="text-[10px] text-gray-400 mt-0.5">Nota: {e.nota}</div>}
              </div>
            ))}
          </PreviewSection>
        )}
        {!p.objetivo && filledExp.length === 0 && filledEdu.length === 0 && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Preencha os dados para visualizar o CV.</div>
        )}
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[9px] font-extrabold tracking-widest uppercase text-[#1e2a4a] dark:text-foreground mb-2.5 pb-1.5 border-b-2 border-[#c9a84c]">{title}</div>
      {children}
    </div>
  );
}
