/**
 * Integration example: How to use the Scholarship Application System
 * This file demonstrates the complete workflow
 */

import { ScholarshipApplicationPage } from "@/components/scholarships";
import { useScholarshipApplication, useUserApplications } from "@/components/scholarships";
import { matchCvToScholarship } from "@/services/scholarshipMatching";
import { CvData } from "@/components/cv-builder";
import { Scholarship } from "@/data/hub-bolsas";

/**
 * Example 1: Full application page (recommended)
 */
export function BolsaDetailPageExample() {
  const scholarship: Scholarship = {
    id: "erasmus-mundus",
    title: "Erasmus Mundus Masters",
    institution: "European Commission",
    country: "Europe",
    flag: "🇪🇺",
    level: "Mestrado",
    area: "Computer Science",
    coverage: "Total",
    language: "English",
    deadline: "2026-12-31",
    benefits: [
      "Tuition fees covered",
      "Monthly stipend €1,400",
      "Health insurance",
    ],
    requirements: [
      "Bachelor's degree",
      "English B2 or higher",
      "CV and motivation letter",
      "2 recommendation letters",
    ],
    applyUrl: "https://example.com",
  };

  const cvData: CvData = {
    personal: {
      nome: "João Silva",
      titulo: "Software Engineer",
      email: "joao@example.com",
      telefone: "+351 912345678",
      localizacao: "Porto, Portugal",
      linkedin: "linkedin.com/in/joao",
      website: "joao.dev",
      foto: "",
    },
    educacao: [
      {
        id: "1",
        grau: "Licenciatura",
        instituicao: "FEUP",
        curso: "Computer Science",
        anoInicio: "2018",
        anoFim: "2022",
        nota: "18/20",
        descricao: "",
      },
    ],
    experiencia: [
      {
        id: "1",
        empresa: "Tech Company",
        cargo: "Software Engineer",
        inicio: "2022",
        fim: "",
        atual: true,
        descricao: "Building scalable systems",
        localizacao: "Porto",
      },
    ],
    skills: [
      { id: "1", nome: "TypeScript", nivel: "Expert" },
      { id: "2", nome: "React", nivel: "Avançado" },
      { id: "3", nome: "Python", nivel: "Avançado" },
    ],
    idiomas: [
      { id: "1", idioma: "Portuguese", nivel: "Native" },
      { id: "2", idioma: "English", nivel: "B2" },
    ],
    projetos: [],
    certificacoes: [],
    objetivo: "",
    design: {
      primaryColor: "#3B82F6",
      textColor: "#000000",
      backgroundColor: "#FFFFFF",
      fontFamily: "Inter",
      fontSize: 14,
    },
  };

  const userId = "user-123";

  // Render the full application page
  return (
    <ScholarshipApplicationPage
      scholarship={scholarship}
      cvData={cvData}
      userId={userId}
    />
  );
}

/**
 * Example 2: Manual workflow control
 */
export function ManualWorkflowExample() {
  const {
    application,
    documents,
    saving,
    createApplication,
    updatePersonalStatement,
    updateMotivationLetter,
    uploadDocument,
    submitApplication,
  } = useScholarshipApplication();

  async function handleApply() {
    // Create application
    const appId = await createApplication("erasmus-mundus");
    if (!appId) return;

    // Update personal statement
    await updatePersonalStatement(
      "I am a passionate software engineer with 3+ years of experience..."
    );

    // Update motivation letter
    await updateMotivationLetter(
      "This Erasmus Mundus program aligns perfectly with my goals..."
    );

    // Upload document
    const file = new File(["CV content"], "cv.pdf", { type: "application/pdf" });
    await uploadDocument(file, "cv", "My CV");

    // Submit
    await submitApplication();
  }

  return (
    <div className="space-y-4">
      <button onClick={handleApply} disabled={saving}>
        Apply Now
      </button>
      {application && <p>Application ID: {application.id}</p>}
      {documents.length > 0 && (
        <div>
          <h4>Uploaded Documents:</h4>
          {documents.map((doc) => (
            <p key={doc.id}>{doc.file_name}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Check matching scores
 */
export async function CheckMatchingExample(
  cvData: CvData,
  scholarship: Scholarship
) {
  try {
    const matching = await matchCvToScholarship(cvData, scholarship);

    console.log(`📊 Overall Score: ${matching.overallScore}/100`);
    console.log(`🎓 Education: ${matching.educationMatch}%`);
    console.log(`💼 Experience: ${matching.experienceMatch}%`);
    console.log(`🌍 Languages: ${matching.languageMatch}%`);
    console.log(`📚 Area: ${matching.areaMatch}%`);

    console.log("\n✅ Match Reasons:");
    matching.matchReasons.forEach((reason) => console.log(`  - ${reason}`));

    console.log("\n💡 Recommendations:");
    matching.recommendations.forEach((rec) => console.log(`  - ${rec}`));

    console.log(`\n🎯 Readiness: ${matching.readinessLevel}`);

    return matching;
  } catch (error) {
    console.error("Failed to check matching:", error);
  }
}

/**
 * Example 4: List all user applications
 */
export function UserApplicationsListExample() {
  const { applications, loading } = useUserApplications();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2>My Scholarship Applications</h2>
      {applications.map((app) => (
        <div key={app.id} className="border rounded p-4">
          <p className="font-medium">Scholarship: {app.scholarshipId}</p>
          <p className="text-sm text-muted-foreground">
            Status: {app.status} ({app.progressPercent}% complete)
          </p>
          <p className="text-sm">
            Match Score: {app.matchScore ? `${app.matchScore}/100` : "Not calculated"}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 5: Route integration
 * How to add to your TanStack Router
 */
export const EXAMPLE_ROUTE_CONFIG = {
  path: "/hub/bolsas/$scholarshipId/apply",
  component: BolsaDetailPageExample,
  beforeLoad: async ({ params }) => {
    // Fetch scholarship details
    // Fetch user's CV data
    // Verify user is authenticated
  },
};

/**
 * Example 6: Database queries (Supabase)
 */
export async function DatabaseExamples(supabase: any, userId: string) {
  // Get all user's applications
  const { data: applications } = await supabase
    .from("scholarship_applications")
    .select("*")
    .eq("user_id", userId);

  // Get applications submitted in the last 30 days
  const { data: recent } = await supabase
    .from("scholarship_applications")
    .select("*")
    .eq("user_id", userId)
    .gt("submitted_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Get average match score
  const { data: scores } = await supabase
    .from("matching_scores")
    .select("overall_score")
    .eq("user_id", userId);

  const avgScore =
    scores?.reduce((acc, s) => acc + s.overall_score, 0) / scores.length || 0;

  return {
    totalApplications: applications?.length || 0,
    recentApplications: recent?.length || 0,
    averageMatchScore: Math.round(avgScore),
  };
}

/**
 * Example 7: UI Component usage
 */
export function ComponentExamples() {
  return (
    <div className="space-y-8">
      {/* Example: Matching Score Display */}
      {/* <MatchingScoreDisplay
        scholarship={scholarship}
        matching={matchingResult}
        onApply={handleApply}
        loading={false}
      /> */}

      {/* Example: Application Form */}
      {/* <ApplicationForm
        scholarship={scholarship}
        applicationId="app-123"
      /> */}

      {/* Example: Full Application Page */}
      {/* <ScholarshipApplicationPage
        scholarship={scholarship}
        cvData={cvData}
        userId={userId}
      /> */}
    </div>
  );
}
