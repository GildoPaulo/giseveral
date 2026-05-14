/**
 * TypeScript types for scholarship applications system
 */

export type ApplicationStatus = 
  | "draft" 
  | "submitted" 
  | "in_review" 
  | "accepted" 
  | "rejected" 
  | "completed";

export type DocumentType = 
  | "cv" 
  | "motivation_letter" 
  | "recommendation" 
  | "transcript" 
  | "certificate" 
  | "custom";

export type DocumentStatus = "uploaded" | "verified" | "rejected";

export type ReadinessLevel = "ready" | "needs_prep" | "good_fit" | "not_suitable";

export interface ScholarshipApplication {
  id: string;
  userId: string;
  scholarshipId: string;
  
  // Status
  status: ApplicationStatus;
  submittedAt?: string;
  
  // AI Matching
  matchScore?: number;
  matchReasons?: string[];
  
  // Application content
  personalStatement?: string;
  motivationLetter?: string;
  
  // Progress
  completedSteps?: string[];
  currentStep?: string;
  progressPercent?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  
  // Metadata
  documentType: DocumentType;
  label?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileMimeType?: string;
  
  // Status
  status: DocumentStatus;
  verificationNotes?: string;
  
  // Audit
  createdAt: string;
  uploadedBy?: string;
}

export interface AutofillProfile {
  id: string;
  userId: string;
  
  // Profile info
  profileName: string;
  
  // Pre-filled content
  personalStatement?: string;
  motivationTemplate?: string;
  
  // Linked CV
  cvData?: any;
  
  // Documents
  preferredDocuments?: DocumentType[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationTimeline {
  id: string;
  applicationId: string;
  
  // Event info
  eventType: string;
  title: string;
  description?: string;
  
  // Action tracking
  requiresAction?: boolean;
  actionRequiredBy?: string;
  
  createdAt: string;
}

export interface MatchingScore {
  id: string;
  userId: string;
  scholarshipId: string;
  
  // Scores (0-100)
  educationMatch: number;
  experienceMatch: number;
  languageMatch: number;
  areaMatch: number;
  locationMatch: number;
  coverageMatch: number;
  overallScore: number;
  
  // Notes
  matchNotes?: string;
  
  // Feedback
  userFeedback?: -1 | 0 | 1;
  userFeedbackReason?: string;
  
  calculatedAt: string;
}

/**
 * Application workflow steps
 */
export const APPLICATION_STEPS = [
  "review",      // Review matching score and requirements
  "personal",    // Personal statement
  "motivation",  // Motivation letter
  "documents",   // Upload documents
  "preview",     // Review and confirm
  "submit",      // Final submission
] as const;

export type ApplicationStep = typeof APPLICATION_STEPS[number];

/**
 * Document requirements template
 */
export const DOCUMENT_REQUIREMENTS: Record<string, DocumentType[]> = {
  default: ["cv", "motivation_letter"],
  masters: ["cv", "motivation_letter", "transcript", "recommendation"],
  phd: ["cv", "motivation_letter", "transcript", "recommendation", "research_proposal"],
  exchange: ["cv", "motivation_letter", "transcript"],
};

/**
 * Match score interpretation
 */
export function getMatchInterpretation(score: number): {
  label: string;
  color: string;
  advice: string;
} {
  if (score >= 80) {
    return {
      label: "Excelente compatibilidade",
      color: "bg-green-500",
      advice: "Você tem um ótimo perfil para esta bolsa. Recomendamos aplicar!",
    };
  }
  if (score >= 60) {
    return {
      label: "Boa compatibilidade",
      color: "bg-blue-500",
      advice: "Seu perfil se alinha bem com os requisitos. Considere aplicar.",
    };
  }
  if (score >= 40) {
    return {
      label: "Compatibilidade moderada",
      color: "bg-yellow-500",
      advice: "Você atende aos requisitos básicos, mas pode precisar de preparação adicional.",
    };
  }
  return {
    label: "Baixa compatibilidade",
    color: "bg-red-500",
    advice: "Recomendamos buscar bolsas que se alinhem melhor ao seu perfil.",
  };
}

/**
 * Status translations
 */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Rascunho",
  submitted: "Submetida",
  in_review: "Em análise",
  accepted: "Aceita",
  rejected: "Rejeitada",
  completed: "Concluída",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-gray-200",
  submitted: "bg-blue-200",
  in_review: "bg-yellow-200",
  accepted: "bg-green-200",
  rejected: "bg-red-200",
  completed: "bg-green-300",
};
