import { CvData } from "@/components/cv-builder";
import { Scholarship } from "@/data/hub-bolsas";
import { parseJsonFromAi } from "@/lib/ai-json";
import { callGemini } from "./gemini";

export interface MatchingResult {
  overallScore: number; // 0-100
  educationMatch: number;
  experienceMatch: number;
  languageMatch: number;
  areaMatch: number;
  locationMatch: number;
  coverageMatch: number;
  matchReasons: string[]; // Why this is a good fit
  recommendations: string[]; // Actionable suggestions
  readinessLevel: "ready" | "needs_prep" | "good_fit" | "not_suitable";
}

/**
 * AI-powered scholarship matching algorithm
 * Analyzes CV profile against scholarship requirements
 */
export async function matchCvToScholarship(
  cvData: CvData,
  scholarship: Scholarship,
  signal?: AbortSignal
): Promise<MatchingResult> {
  try {
    const prompt = buildMatchingPrompt(cvData, scholarship);

    const response = await callGemini("scholarship_match", prompt, undefined, signal);

    const result = parseJsonFromAi<MatchingResult>(response);
    return normalizeMatchingResult(result);
  } catch (error) {
    console.error("Matching error:", error);
    // Return a default conservative match if AI fails
    return getDefaultMatching(cvData, scholarship);
  }
}

/**
 * Batch match CV against multiple scholarships
 */
export async function matchCvToMultipleScholarships(
  cvData: CvData,
  scholarships: Scholarship[],
  signal?: AbortSignal
): Promise<Map<string, MatchingResult>> {
  const results = new Map<string, MatchingResult>();

  // Process in parallel batches (max 3 concurrent)
  const batchSize = 3;
  for (let i = 0; i < scholarships.length; i += batchSize) {
    const batch = scholarships.slice(i, i + batchSize);
    const promises = batch.map(s =>
      matchCvToScholarship(cvData, s, signal)
        .then(result => results.set(s.id, result))
        .catch(err => {
          console.error(`Failed to match scholarship ${s.id}:`, err);
          results.set(s.id, getDefaultMatching(cvData, s));
        })
    );
    await Promise.all(promises);
  }

  return results;
}

/**
 * Build AI prompt for matching evaluation
 */
function buildMatchingPrompt(cvData: CvData, scholarship: Scholarship): string {
  const educationLevel = getHighestEducationLevel(cvData);
  const areas = extractAreas(cvData);
  const languages = cvData.idiomas.map(i => i.idioma);
  const yearsExperience = calculateExperience(cvData);

  return `You are a scholarship matching expert. Analyze this candidate profile against a scholarship and provide a matching score.

CANDIDATE PROFILE:
- Name: ${cvData.personal.nome}
- Education Level: ${educationLevel}
- Years of Experience: ${yearsExperience}
- Study Areas: ${areas.join(", ")}
- Languages: ${languages.join(", ")}
- Location: ${cvData.personal.localizacao}
- Skills: ${cvData.skills.map(s => s.nome).join(", ")}
- Recent Experience: ${cvData.experiencia[0]?.cargo || "Not specified"} at ${cvData.experiencia[0]?.empresa || "Not specified"}

SCHOLARSHIP DETAILS:
- Title: ${scholarship.title}
- Institution: ${scholarship.institution}
- Level: ${scholarship.level}
- Area: ${scholarship.area}
- Coverage: ${scholarship.coverage}
- Languages: ${scholarship.language}
- Country: ${scholarship.country}
- Requirements: ${scholarship.requirements.join("; ")}
- Benefits: ${scholarship.benefits.join("; ")}
- Deadline: ${scholarship.deadline}

Provide a detailed JSON response ONLY (no markdown, no explanation) with this structure:
{
  "overallScore": <0-100>,
  "educationMatch": <0-100>,
  "experienceMatch": <0-100>,
  "languageMatch": <0-100>,
  "areaMatch": <0-100>,
  "locationMatch": <0-100>,
  "coverageMatch": <0-100>,
  "matchReasons": ["reason1", "reason2", "reason3"],
  "recommendations": ["suggestion1", "suggestion2"],
  "readinessLevel": "ready|needs_prep|good_fit|not_suitable"
}

Be realistic and fair. Consider fit, not just qualifications.`;
}

/**
 * Rule-based fallback matching (when AI is unavailable)
 */
function getDefaultMatching(cvData: CvData, scholarship: Scholarship): MatchingResult {
  const educationLevel = getHighestEducationLevel(cvData);
  const educationMatch = evaluateEducationMatch(educationLevel, scholarship.level);
  const languageMatch = evaluateLanguageMatch(cvData, scholarship.language);
  const areaMatch = evaluateAreaMatch(cvData, scholarship.area);
  const experienceMatch = evaluateExperienceMatch(cvData);
  const locationMatch = 50; // Neutral default
  const coverageMatch = 60; // Assume neutral need

  const overallScore = Math.round(
    (educationMatch * 0.25 + 
     experienceMatch * 0.20 + 
     languageMatch * 0.20 + 
     areaMatch * 0.20 + 
     locationMatch * 0.10 +
     coverageMatch * 0.05) / 1
  );

  return {
    overallScore,
    educationMatch,
    experienceMatch,
    languageMatch,
    areaMatch,
    locationMatch,
    coverageMatch,
    matchReasons: ["Profile analysis available", "Manual evaluation recommended"],
    recommendations: ["Review scholarship requirements", "Consider applying"],
    readinessLevel: overallScore >= 70 ? "good_fit" : overallScore >= 50 ? "needs_prep" : "not_suitable",
  };
}

// Helper functions

function getHighestEducationLevel(cvData: CvData): string {
  if (cvData.educacao.length === 0) return "Unknown";
  // Assume latest education is highest level
  return cvData.educacao[0]?.grau || "Unknown";
}

function extractAreas(cvData: CvData): string[] {
  const areas = new Set<string>();
  cvData.educacao.forEach(e => areas.add(e.curso));
  return Array.from(areas);
}

function calculateExperience(cvData: CvData): number {
  if (cvData.experiencia.length === 0) return 0;
  
  let totalYears = 0;
  cvData.experiencia.forEach(exp => {
    const start = parseInt(exp.inicio) || new Date().getFullYear();
    const end = exp.atual ? new Date().getFullYear() : (parseInt(exp.fim) || new Date().getFullYear());
    totalYears += Math.max(0, end - start);
  });
  
  return Math.round(totalYears / cvData.experiencia.length);
}

function evaluateEducationMatch(candidateLevel: string, scholarshipLevel: string): number {
  const levelMap: Record<string, number> = {
    "Licenciatura": 1,
    "Mestrado": 2,
    "Doutoramento": 3,
  };

  const candidateScore = levelMap[candidateLevel] || 0;
  const scholarshipScore = levelMap[scholarshipLevel] || 0;

  if (candidateScore === scholarshipScore) return 100;
  if (candidateScore === scholarshipScore + 1) return 80; // Over-qualified
  if (candidateScore === scholarshipScore - 1) return 60; // Under-qualified but close
  if (candidateScore > scholarshipScore + 1) return 40; // Too much education
  if (candidateScore < scholarshipScore - 1) return 30; // Not enough education

  return 50;
}

function evaluateLanguageMatch(cvData: CvData, requiredLanguages: string): number {
  const userLanguages = cvData.idiomas.map(i => i.idioma.toLowerCase());
  const required = requiredLanguages.toLowerCase().split(/[,;]/);

  const matches = required.filter(lang => 
    userLanguages.some(ul => ul.includes(lang.trim()))
  );

  return Math.round((matches.length / required.length) * 100);
}

function evaluateAreaMatch(cvData: CvData, scholarshipArea: string): number {
  const areas = extractAreas(cvData);
  const skills = cvData.skills.map(s => s.nome.toLowerCase());
  
  const areaLower = scholarshipArea.toLowerCase();
  
  const areaMatch = areas.some(a => a.toLowerCase().includes(areaLower));
  const skillMatch = skills.some(s => s.includes(areaLower));

  if (areaMatch) return 100;
  if (skillMatch) return 70;
  return 40;
}

function evaluateExperienceMatch(cvData: CvData): number {
  const yearsExp = calculateExperience(cvData);
  
  if (yearsExp >= 5) return 100;
  if (yearsExp >= 3) return 80;
  if (yearsExp >= 1) return 60;
  if (yearsExp > 0) return 40;
  return 20;
}

function normalizeMatchingResult(result: any): MatchingResult {
  return {
    overallScore: Math.max(0, Math.min(100, result.overallScore || 0)),
    educationMatch: Math.max(0, Math.min(100, result.educationMatch || 0)),
    experienceMatch: Math.max(0, Math.min(100, result.experienceMatch || 0)),
    languageMatch: Math.max(0, Math.min(100, result.languageMatch || 0)),
    areaMatch: Math.max(0, Math.min(100, result.areaMatch || 0)),
    locationMatch: Math.max(0, Math.min(100, result.locationMatch || 0)),
    coverageMatch: Math.max(0, Math.min(100, result.coverageMatch || 0)),
    matchReasons: Array.isArray(result.matchReasons) ? result.matchReasons : [],
    recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
    readinessLevel: (result.readinessLevel || "needs_prep") as any,
  };
}
