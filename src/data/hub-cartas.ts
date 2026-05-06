// ── Types ─────────────────────────────────────────────────────────────────────

export type LetterField = {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "date" | "select";
  options?: string[];
  required?: boolean;
};

export type LetterType = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  fields: LetterField[];
  template: string;
};

// ── Template helpers ──────────────────────────────────────────────────────────

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `[${key}]`);
}

/** Extract all {{PLACEHOLDER}} keys from a template string */
export function extractPlaceholders(template: string): string[] {
  const matches = [...template.matchAll(/\{\{(\w+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

/** Convert a snake_CASE or UPPER_CASE key to a human-readable label */
export function keyToLabel(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Letter Types ──────────────────────────────────────────────────────────────

export const LETTER_TYPES: LetterType[] = [
  // ─── 1. Carta de Motivação para Bolsa ──────────────────────────────────────
  {
    id: "bolsa-motivacao",
    title: "Carta de Motivação para Bolsa",
    description: "Candidatura a bolsas de estudo nacionais e internacionais.",
    icon: "🎓",
    category: "académico",
    fields: [
      { key: "NOME_COMPLETO",   label: "Nome completo",             placeholder: "Ex: Maria Fernanda Cossa",       type: "text",     required: true },
      { key: "BOLSA_NOME",      label: "Nome da bolsa",             placeholder: "Ex: Bolsa Chevening 2025",       type: "text",     required: true },
      { key: "ENTIDADE",        label: "Entidade concedente",       placeholder: "Ex: Governo do Reino Unido",     type: "text",     required: true },
      { key: "CURSO",           label: "Curso pretendido",          placeholder: "Ex: Mestrado em Saúde Pública",  type: "text",     required: true },
      { key: "UNIVERSIDADE",    label: "Universidade alvo",         placeholder: "Ex: University of Edinburgh",    type: "text",     required: true },
      { key: "PAIS",            label: "País de destino",           placeholder: "Ex: Reino Unido",                type: "text",     required: true },
      { key: "MOTIVO",          label: "Por que merece esta bolsa", placeholder: "Descreva as suas motivações académicas e profissionais…", type: "textarea", required: true },
      { key: "EXPERIENCIA",     label: "Experiência relevante",     placeholder: "Ex: 3 anos como enfermeira no HCM…", type: "textarea", required: true },
      { key: "OBJETIVO",        label: "Objectivo de carreira",     placeholder: "Ex: Contribuir para a saúde pública em Moçambique…", type: "textarea", required: true },
      { key: "DATA",            label: "Data da carta",             placeholder: "",                               type: "date",     required: true },
    ],
    template: `Maputo, {{DATA}}

A: Comité de Selecção — {{BOLSA_NOME}}
{{ENTIDADE}}

Assunto: Candidatura à {{BOLSA_NOME}}

Exmos. Senhores,

O meu nome é {{NOME_COMPLETO}} e venho, por este meio, manifestar o meu interesse genuíno em concorrer à {{BOLSA_NOME}} para prosseguir os meus estudos no programa de {{CURSO}} na {{UNIVERSIDADE}}, em {{PAIS}}.

{{MOTIVO}}

No que diz respeito à minha trajectória académica e profissional, {{EXPERIENCIA}}

A obtenção desta bolsa representaria uma oportunidade transformadora para alcançar o meu objectivo de {{OBJETIVO}}. Estou convicto(a) de que os conhecimentos e competências adquiridos durante o programa contribuirão de forma significativa para o desenvolvimento de Moçambique.

Coloco-me ao inteiro dispor para qualquer informação adicional que considerem necessária.

Com os melhores cumprimentos,

{{NOME_COMPLETO}}`,
  },

  // ─── 2. Carta de Apresentação para Emprego ─────────────────────────────────
  {
    id: "apresentacao-emprego",
    title: "Carta de Apresentação",
    description: "Carta para acompanhar o CV numa candidatura a emprego.",
    icon: "💼",
    category: "profissional",
    fields: [
      { key: "NOME_COMPLETO",   label: "Nome completo",              placeholder: "Ex: Carlos Alberto Nhaca",       type: "text",     required: true },
      { key: "CARGO",           label: "Cargo pretendido",           placeholder: "Ex: Analista de Sistemas",       type: "text",     required: true },
      { key: "EMPRESA",         label: "Nome da empresa",            placeholder: "Ex: Standard Bank Moçambique",   type: "text",     required: true },
      { key: "COMO_SOUBE",      label: "Como soube da vaga",         placeholder: "Ex: portal LinkedIn, dia 15/04", type: "text",     required: true },
      { key: "FORMACAO",        label: "Formação académica",         placeholder: "Ex: Licenciatura em Informática (UEM, 2022)", type: "text",     required: true },
      { key: "EXPERIENCIA",     label: "Experiência profissional",   placeholder: "Ex: 2 anos como programador júnior na empresa XYZ…", type: "textarea", required: true },
      { key: "HABILIDADES",     label: "Competências relevantes",    placeholder: "Ex: Python, SQL, Power BI, trabalho em equipa…", type: "textarea", required: true },
      { key: "VALOR_EMPRESA",   label: "O que pode oferecer",        placeholder: "Ex: experiência em análise de dados financeiros…", type: "textarea", required: true },
      { key: "TELEFONE",        label: "Telefone",                   placeholder: "Ex: +258 84 000 0000",           type: "text",     required: true },
      { key: "EMAIL",           label: "E-mail",                     placeholder: "Ex: carlos@email.com",           type: "text",     required: true },
      { key: "DATA",            label: "Data",                       placeholder: "",                               type: "date",     required: true },
    ],
    template: `Maputo, {{DATA}}

A: Departamento de Recursos Humanos
{{EMPRESA}}

Assunto: Candidatura ao cargo de {{CARGO}}

Exmos. Senhores,

Chamo-me {{NOME_COMPLETO}} e venho candidatar-me ao cargo de {{CARGO}} na {{EMPRESA}}, vaga que tomei conhecimento através do(a) {{COMO_SOUBE}}.

Sou formado(a) em {{FORMACAO}}. {{EXPERIENCIA}}

As minhas principais competências incluem: {{HABILIDADES}}

Acredito que posso acrescentar valor à {{EMPRESA}} através da(o) {{VALOR_EMPRESA}}. Estou altamente motivado(a) para integrar a vossa equipa e contribuir para os objectivos da organização.

Estou disponível para entrevista a qualquer momento conveniente para V. Exas.

Aguardo o vosso contacto.

Com os melhores cumprimentos,

{{NOME_COMPLETO}}
Tel.: {{TELEFONE}}
E-mail: {{EMAIL}}`,
  },

  // ─── 3. Solicitação de Estágio ─────────────────────────────────────────────
  {
    id: "solicitacao-estagio",
    title: "Solicitação de Estágio",
    description: "Pedido formal de estágio curricular ou profissional a uma empresa.",
    icon: "📄",
    category: "académico",
    fields: [
      { key: "NOME_COMPLETO",  label: "Nome completo",           placeholder: "Ex: Filipe Guambe",                type: "text",     required: true },
      { key: "CURSO",          label: "Curso que frequenta",     placeholder: "Ex: Licenciatura em Gestão de Empresas", type: "text",  required: true },
      { key: "ANO",            label: "Ano/Semestre actual",     placeholder: "Ex: 4º ano, 2º semestre",          type: "text",     required: true },
      { key: "UNIVERSIDADE",   label: "Instituição de ensino",   placeholder: "Ex: ISPU — Maputo",                type: "text",     required: true },
      { key: "EMPRESA",        label: "Nome da empresa/organização", placeholder: "Ex: Vodacom Moçambique",       type: "text",     required: true },
      { key: "AREA",           label: "Área de estágio desejada",placeholder: "Ex: Departamento de Marketing Digital", type: "text", required: true },
      { key: "PERIODO",        label: "Período proposto",        placeholder: "Ex: Julho a Setembro de 2025",     type: "text",     required: true },
      { key: "MOTIVO",         label: "Motivação para esta empresa", placeholder: "Ex: a Vodacom é líder no sector das telecomunicações…", type: "textarea", required: true },
      { key: "COMPETENCIAS",   label: "Competências relevantes", placeholder: "Ex: Excel avançado, comunicação em inglês, análise de dados…", type: "textarea", required: true },
      { key: "CONTACTO",       label: "Contacto (tel/email)",    placeholder: "Ex: +258 84 000 0000 | filipe@email.com", type: "text", required: true },
      { key: "DATA",           label: "Data da carta",           placeholder: "",                                 type: "date",     required: true },
    ],
    template: `Maputo, {{DATA}}

A: Departamento de Recursos Humanos / Gestão de Talentos
{{EMPRESA}}

Assunto: Solicitação de Estágio Curricular — {{AREA}}

Exmos. Senhores,

O meu nome é {{NOME_COMPLETO}}, estudante do {{ANO}} do curso de {{CURSO}} na {{UNIVERSIDADE}}.

Venho por este meio solicitar a V. Exas. a oportunidade de realizar o meu estágio curricular na {{EMPRESA}}, especificamente na área de {{AREA}}, durante o período de {{PERIODO}}.

A minha motivação para escolher a vossa organização prende-se com o facto de {{MOTIVO}}

No que respeita às minhas competências académicas e pessoais, destaco: {{COMPETENCIAS}}

Encontro-me disponível para entrevista ou para prestar qualquer esclarecimento adicional. Agradeço antecipadamente a atenção dispensada.

Estou ao dispor para qualquer contacto através de {{CONTACTO}}.

Com os melhores cumprimentos,

{{NOME_COMPLETO}}
{{CURSO}} — {{UNIVERSIDADE}}`,
  },

  // ─── 4. Carta de Recomendação ──────────────────────────────────────────────
  {
    id: "carta-recomendacao",
    title: "Carta de Recomendação",
    description: "Para professores ou superiores que recomendam um estudante ou colaborador.",
    icon: "⭐",
    category: "académico",
    fields: [
      { key: "NOME_RECOMENDADOR",  label: "Nome do recomendador",    placeholder: "Ex: Prof. Dr. João Sithole",         type: "text",     required: true },
      { key: "CARGO_RECOMENDADOR", label: "Cargo/Título",            placeholder: "Ex: Professor Catedrático, UEM",     type: "text",     required: true },
      { key: "NOME_CANDIDATO",     label: "Nome do candidato",       placeholder: "Ex: Fátima Muianga",                 type: "text",     required: true },
      { key: "RELACAO",            label: "Como os conhece",         placeholder: "Ex: orientei a sua monografia durante 2 anos…", type: "textarea", required: true },
      { key: "QUALIDADES",         label: "Qualidades do candidato", placeholder: "Ex: rigor académico, liderança, comunicação…", type: "textarea", required: true },
      { key: "CONQUISTAS",         label: "Conquistas específicas",  placeholder: "Ex: melhor nota da turma, publicou artigo…", type: "textarea", required: true },
      { key: "RECOMENDACAO",       label: "Recomendação final",      placeholder: "Ex: recomendo vivamente sem qualquer reserva para…", type: "textarea", required: true },
      { key: "DESTINO",            label: "Para onde é a carta",     placeholder: "Ex: Programa de Mestrado, UCT",      type: "text",     required: true },
      { key: "CONTACTO",           label: "Contacto do recomendador",placeholder: "Ex: joao.sithole@uem.ac.mz",         type: "text",     required: true },
      { key: "DATA",               label: "Data",                    placeholder: "",                                   type: "date",     required: true },
    ],
    template: `Maputo, {{DATA}}

A Quem Possa Interessar / {{DESTINO}}

Assunto: Carta de Recomendação — {{NOME_CANDIDATO}}

Escrevo na qualidade de {{CARGO_RECOMENDADOR}} para recomendar {{NOME_CANDIDATO}} com o mais elevado entusiasmo.

Conheço {{NOME_CANDIDATO}} porque {{RELACAO}}

Ao longo do nosso contacto, tive oportunidade de verificar as seguintes qualidades: {{QUALIDADES}}

Entre as suas realizações mais notáveis destaco: {{CONQUISTAS}}

Em suma, {{RECOMENDACAO}} Não hesito em afirmar que {{NOME_CANDIDATO}} possui todas as características necessárias para se destacar em qualquer ambiente académico ou profissional exigente.

Para quaisquer informações adicionais, estou disponível através de {{CONTACTO}}.

Atentamente,

{{NOME_RECOMENDADOR}}
{{CARGO_RECOMENDADOR}}`,
  },

  // ─── 5. Candidatura Espontânea ────────────────────────────────────────────
  {
    id: "candidatura-espontanea",
    title: "Candidatura Espontânea",
    description: "Carta de candidatura sem vaga específica aberta.",
    icon: "🚀",
    category: "profissional",
    fields: [
      { key: "NOME_COMPLETO",  label: "Nome completo",            placeholder: "Ex: Sílvia Machaieie",             type: "text",     required: true },
      { key: "EMPRESA",        label: "Empresa alvo",             placeholder: "Ex: FNB Moçambique",               type: "text",     required: true },
      { key: "AREA_INTERESSE", label: "Área de interesse",        placeholder: "Ex: Finanças e Risco de Crédito",  type: "text",     required: true },
      { key: "FORMACAO",       label: "Formação académica",       placeholder: "Ex: Licenciatura em Finanças, UEM", type: "text",    required: true },
      { key: "EXPERIENCIA",    label: "Experiência profissional", placeholder: "Ex: 4 anos no sector bancário como analista de crédito…", type: "textarea", required: true },
      { key: "DIFERENCIAIS",   label: "O que te distingue",       placeholder: "Ex: certificação CFA nível I, domínio de VBA, inglês fluente…", type: "textarea", required: true },
      { key: "VALOR",          label: "Valor que pode trazer",    placeholder: "Ex: melhorar os processos de análise de risco com modelos preditivos…", type: "textarea", required: true },
      { key: "POR_QUE_EMPRESA",label: "Por que esta empresa",     placeholder: "Ex: o FNB é reconhecido pela sua inovação e cultura de meritocracia…", type: "textarea", required: true },
      { key: "TELEFONE",       label: "Telefone",                 placeholder: "Ex: +258 84 000 0000",             type: "text",     required: true },
      { key: "EMAIL",          label: "E-mail",                   placeholder: "Ex: silvia@email.com",             type: "text",     required: true },
      { key: "DATA",           label: "Data",                     placeholder: "",                                 type: "date",     required: true },
    ],
    template: `Maputo, {{DATA}}

A: Departamento de Recursos Humanos
{{EMPRESA}}

Assunto: Candidatura Espontânea — {{AREA_INTERESSE}}

Exmos. Senhores,

O meu nome é {{NOME_COMPLETO}}, profissional formado(a) em {{FORMACAO}}, e escrevo-lhes para manifestar o meu interesse em integrar a equipa da {{EMPRESA}} na área de {{AREA_INTERESSE}}.

{{POR_QUE_EMPRESA}}

A minha trajectória profissional inclui {{EXPERIENCIA}}

Os factores que me distinguem são: {{DIFERENCIAIS}}

Estou convicto(a) de que posso contribuir para a {{EMPRESA}} através da(o) {{VALOR}}

Coloco à vossa disposição o meu CV actualizado e estou inteiramente disponível para uma entrevista. Pode contactar-me através do {{TELEFONE}} ou {{EMAIL}}.

Aguardo com expectativa uma oportunidade de demonstrar o meu valor.

Com os melhores cumprimentos,

{{NOME_COMPLETO}}
Tel.: {{TELEFONE}} | E-mail: {{EMAIL}}`,
  },
];

export function getLetterTypeById(id: string): LetterType | undefined {
  return LETTER_TYPES.find((l) => l.id === id);
}
