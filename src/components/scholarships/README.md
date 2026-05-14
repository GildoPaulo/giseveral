# 💼 Sistema Inteligente de Candidaturas a Bolsas

Plataforma integrada para aplicação a bolsas de estudo com IA matching, formulários multi-step, e gestão de documentos.

## 🎯 Componentes

### 1. AI Matching (`scholarshipMatching.ts`)
Análise inteligente do perfil do utilizador contra requisitos de bolsa.

```typescript
// Matching com IA
const result = await matchCvToScholarship(cvData, scholarship);
console.log(result.overallScore); // 0-100
console.log(result.matchReasons); // Array de razões positivas
console.log(result.recommendations); // Sugestões de preparação
```

**Dimensões analisadas:**
- 🎓 Educação (match com nível académico)
- 💼 Experiência (anos e relevância)
- 🌍 Idiomas (requisitos linguísticos)
- 📚 Área de estudo (alinhamento curricular)
- 📍 Localização (preferências geográficas)
- 💰 Cobertura financeira

**Fallback Rule-based:**
Se Gemini indisponível, usa scoring automático baseado em regras.

### 2. Base de Dados
Migração: `20260513000001_scholarship_applications.sql`

**Tabelas principais:**

#### `scholarship_applications`
```sql
id, user_id, scholarship_id, status, match_score, match_reasons,
personal_statement, motivation_letter, completed_steps, current_step,
progress_percent, created_at, updated_at
```

#### `application_documents`
```sql
id, application_id, document_type, file_path, file_size,
status (uploaded|verified|rejected), created_at
```

#### `autofill_profiles`
```sql
id, user_id, profile_name, personal_statement, motivation_template,
cv_data (JSON snapshot), preferred_documents, created_at
```

#### `matching_scores`
```sql
Score breakdown para analytics e ML improvements
```

**RLS Policies:** Cada utilizador vê apenas os seus dados.

### 3. React Components

#### `ScholarshipApplicationPage`
Página completa com 3 abas:
1. **IA Matching** - Score visual + razões
2. **Candidatura** - Formulário multi-step
3. **Detalhes** - Informações da bolsa

```tsx
<ScholarshipApplicationPage
  scholarship={scholarship}
  cvData={cvData}
  userId={userId}
/>
```

#### `MatchingScoreDisplay`
Visualização do score:
- Barra circular com % e interpretação
- Scores por dimensão (6 barras)
- Razões positivas (✓)
- Recomendações (i)
- Nível de prontidão (ready/needs_prep/good_fit/not_suitable)

#### `ApplicationForm`
Formulário com 6 passos:

1. **Review** - Revisão da bolsa e requisitos
2. **Personal** - Declaração pessoal (200-500 palavras)
3. **Motivation** - Carta de motivação (300-600 palavras)
4. **Documents** - Upload de CV, certidões, etc.
5. **Preview** - Resumo para confirmação
6. **Submit** - Submissão final

Indicador visual de progresso + botões Anterior/Próximo.

### 4. React Hooks

#### `useScholarshipApplication(applicationId?)`
Gerenciar uma candidatura.

```typescript
const {
  application,
  documents,
  loading,
  saving,
  createApplication,
  updateApplication,
  moveToStep,
  updatePersonalStatement,
  updateMotivationLetter,
  uploadDocument,
  deleteDocument,
  submitApplication,
} = useScholarshipApplication(appId);
```

#### `useUserApplications()`
Listar todas as candidaturas do utilizador.

```typescript
const { applications, loading } = useUserApplications();
// applications: array de ScholarshipApplication
```

#### `useScholarshipMatching()`
Fazer matching em batch.

```typescript
const { matching, results, matchWithScholarships } = useScholarshipMatching();
await matchWithScholarships(scholarshipIds);
// results: Map<scholarshipId, {score, reasons}>
```

## 📋 Status da Candidatura

```
draft → submitted → in_review → accepted/rejected → completed
```

## 🔧 Tipos TypeScript

```typescript
// Aplicações
type ApplicationStatus = "draft" | "submitted" | "in_review" | "accepted" | "rejected" | "completed";
type ReadinessLevel = "ready" | "needs_prep" | "good_fit" | "not_suitable";

// Documentos
type DocumentType = "cv" | "motivation_letter" | "recommendation" | "transcript" | "certificate" | "custom";
type DocumentStatus = "uploaded" | "verified" | "rejected";

// Steps do formulário
APPLICATION_STEPS = ["review", "personal", "motivation", "documents", "preview", "submit"]
```

## 🚀 Como Usar

### 1. Criar candidatura
```typescript
const appId = await createApplication(scholarshipId);
```

### 2. Preencher dados
```typescript
await updatePersonalStatement("Sou engenheiro com 5 anos de experiência...");
await updateMotivationLetter("Desejo esta bolsa porque...");
```

### 3. Upload de documentos
```typescript
await uploadDocument(file, "cv", "CV - João Silva");
```

### 4. Submeter
```typescript
await submitApplication(); // Status muda para "submitted"
```

## 📊 Matching Score

Exemplo de resultado:

```json
{
  "overallScore": 82,
  "educationMatch": 95,
  "experienceMatch": 75,
  "languageMatch": 85,
  "areaMatch": 78,
  "locationMatch": 60,
  "coverageMatch": 90,
  "matchReasons": [
    "Seu mestrado alinha-se perfeitamente com os requisitos",
    "Tem fluência em inglês (requisito obrigatório)",
    "Experiência em área relevante"
  ],
  "recommendations": [
    "Realce projetos em IA no CV",
    "Mencione prêmios internacionais na motivação"
  ],
  "readinessLevel": "ready"
}
```

## 🎨 Interpretação de Scores

| Score | Label | Cor | Conselho |
|-------|-------|-----|----------|
| 80-100 | Excelente compatibilidade | 🟢 Verde | Recomenda-se aplicar |
| 60-79 | Boa compatibilidade | 🔵 Azul | Considere aplicar |
| 40-59 | Compatibilidade moderada | 🟡 Amarelo | Pode precisar preparação |
| <40 | Baixa compatibilidade | 🔴 Vermelho | Procure alternativas |

## 💾 Supabase Storage

Documentos são guardados em: `application-documents/{applicationId}/{timestamp}_{filename}`

## 🔐 Segurança

- ✅ RLS policies - Utilizadores veem apenas dados próprios
- ✅ File validation - Tipos MIME verificados
- ✅ Auth required - Todos endpoints protegidos
- ✅ Rate limiting - Recomendado via Cloudflare

## 📈 Analytics & Feedback

Tabela `matching_scores` permite:
- Análise do match score vs. resultado real
- Feedback do utilizador para ML improvements
- Padrões de sucesso por área/país

## 🔄 Próximas Fases

### Phase 2: PDF Edital Import
- Parser de PDFs com IA
- Extração automática de datas, requisitos
- Matching com campos estruturados

### Phase 3: Notification System
- Alertas de prazos (3 dias, 1 dia antes)
- Email + in-app + SMS
- Preferências por utilizador

### Phase 4: Autofill Profiles
- Save templates de candidaturas
- Auto-fill rápido com dados salvos
- Versioning de CVs

### Phase 5: Integração de Tradução
- Auto-translate de cartas
- Suporte multilíngue
- Google Translate / DeepL

## 📝 Exemplo Completo

```tsx
import { ScholarshipApplicationPage } from "@/components/scholarships";
import { supabase } from "@/integrations/supabase/client";

export function BolsaDetailPage() {
  const { scholarshipId } = useParams();
  const { user } = useAuth();
  
  const [scholarship, setScholarship] = useState(null);
  const [cvData, setCvData] = useState(null);

  useEffect(() => {
    // Carregar bolsa e CV do utilizador
    loadData();
  }, [scholarshipId, user?.id]);

  return (
    <ScholarshipApplicationPage
      scholarship={scholarship}
      cvData={cvData}
      userId={user.id}
    />
  );
}
```

## 🤝 Contribuindo

Para adicionar melhorias:
1. Expandir matching dimensions
2. Adicionar mais tipos de documentos
3. Integrar com serviços de notificação
4. Melhorar parser de PDFs

---

**Status:** ✅ Phase 1 Completa - AI Matching + Application System
