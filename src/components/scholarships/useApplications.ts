import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ScholarshipApplication,
  ApplicationDocument,
  ApplicationStatus,
  ApplicationStep,
} from "./types";
import { toast } from "sonner";

/**
 * Hook to manage scholarship applications
 */
export function useScholarshipApplication(applicationId?: string) {
  const [application, setApplication] = useState<ScholarshipApplication | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load application
  useEffect(() => {
    if (!applicationId) return;
    loadApplication();
  }, [applicationId]);

  const loadApplication = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const [appRes, docsRes] = await Promise.all([
        supabase
          .from("scholarship_applications")
          .select("*")
          .eq("id", applicationId)
          .single(),
        supabase
          .from("application_documents")
          .select("*")
          .eq("application_id", applicationId),
      ]);

      if (appRes.error) throw appRes.error;
      if (docsRes.error) throw docsRes.error;

      setApplication(appRes.data);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error("Failed to load application:", error);
      toast.error("Não foi possível carregar a candidatura");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Create new application
  const createApplication = useCallback(
    async (scholarshipId: string) => {
      setSaving(true);
      try {
        const { data, error } = await supabase
          .from("scholarship_applications")
          .insert({
            scholarship_id: scholarshipId,
            status: "draft",
            progress_percent: 0,
            completed_steps: [],
            current_step: "review",
          })
          .select()
          .single();

        if (error) throw error;
        setApplication(data);
        toast.success("Candidatura criada");
        return data.id;
      } catch (error) {
        console.error("Failed to create application:", error);
        toast.error("Não foi possível criar candidatura");
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Update application field
  const updateApplication = useCallback(
    async (updates: Partial<ScholarshipApplication>) => {
      if (!application) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from("scholarship_applications")
          .update(updates)
          .eq("id", application.id);

        if (error) throw error;
        setApplication({ ...application, ...updates });
        toast.success("Candidatura atualizada");
      } catch (error) {
        console.error("Failed to update application:", error);
        toast.error("Não foi possível atualizar candidatura");
      } finally {
        setSaving(false);
      }
    },
    [application]
  );

  // Move to next step
  const moveToStep = useCallback(
    async (step: ApplicationStep) => {
      if (!application) return;
      const completed = application.completedSteps || [];
      if (!completed.includes(application.currentStep || "review")) {
        completed.push(application.currentStep || "review");
      }
      await updateApplication({
        currentStep: step,
        completedSteps: completed,
        progressPercent: Math.round(((completed.length + 1) / 6) * 100),
      });
    },
    [application, updateApplication]
  );

  // Update personal statement
  const updatePersonalStatement = useCallback(
    async (text: string) => {
      await updateApplication({ personalStatement: text });
    },
    [updateApplication]
  );

  // Update motivation letter
  const updateMotivationLetter = useCallback(
    async (text: string) => {
      await updateApplication({ motivationLetter: text });
    },
    [updateApplication]
  );

  // Upload document
  const uploadDocument = useCallback(
    async (
      file: File,
      documentType: string,
      label?: string
    ) => {
      if (!application) return;
      setSaving(true);
      try {
        const fileName = `${application.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("application-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: doc, error: insertError } = await supabase
          .from("application_documents")
          .insert({
            application_id: application.id,
            document_type: documentType,
            label,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_mime_type: file.type,
            status: "uploaded",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setDocuments([...documents, doc]);
        toast.success("Documento enviado");
      } catch (error) {
        console.error("Failed to upload document:", error);
        toast.error("Não foi possível enviar documento");
      } finally {
        setSaving(false);
      }
    },
    [application, documents]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      setSaving(true);
      try {
        const doc = documents.find(d => d.id === documentId);
        if (!doc) return;

        // Delete from storage
        await supabase.storage
          .from("application-documents")
          .remove([doc.filePath]);

        // Delete from database
        const { error } = await supabase
          .from("application_documents")
          .delete()
          .eq("id", documentId);

        if (error) throw error;
        setDocuments(documents.filter(d => d.id !== documentId));
        toast.success("Documento removido");
      } catch (error) {
        console.error("Failed to delete document:", error);
        toast.error("Não foi possível remover documento");
      } finally {
        setSaving(false);
      }
    },
    [documents]
  );

  // Submit application
  const submitApplication = useCallback(async () => {
    if (!application) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("scholarship_applications")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) throw error;
      setApplication({ ...application, status: "submitted" });
      toast.success("Candidatura submetida com sucesso!");
    } catch (error) {
      console.error("Failed to submit application:", error);
      toast.error("Não foi possível submeter candidatura");
    } finally {
      setSaving(false);
    }
  }, [application]);

  return {
    application,
    documents,
    loading,
    saving,
    loadApplication,
    createApplication,
    updateApplication,
    moveToStep,
    updatePersonalStatement,
    updateMotivationLetter,
    uploadDocument,
    deleteDocument,
    submitApplication,
  };
}

/**
 * Hook to list user's applications
 */
export function useUserApplications() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scholarship_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Failed to load applications:", error);
      toast.error("Não foi possível carregar candidaturas");
    } finally {
      setLoading(false);
    }
  }, []);

  return { applications, loading, loadApplications };
}

/**
 * Hook to match CV with scholarships
 */
export function useScholarshipMatching() {
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<
    Map<string, { score: number; reasons: string[] }>
  >(new Map());

  const matchWithScholarships = useCallback(
    async (scholarshipIds: string[]) => {
      setMatching(true);
      try {
        // Import here to avoid circular dependencies
        const { matchCvToScholarship } = await import("@/services/scholarshipMatching");
        const { DEFAULT_CV_DATA } = await import("@/components/cv-builder");

        // In a real app, fetch actual CV data from storage
        const cvData = DEFAULT_CV_DATA;
        const newResults = new Map();

        for (const id of scholarshipIds) {
          try {
            const result = await matchCvToScholarship(cvData, {} as any);
            newResults.set(id, {
              score: result.overallScore,
              reasons: result.matchReasons,
            });
          } catch (error) {
            console.error(`Failed to match ${id}:`, error);
          }
        }

        setResults(newResults);
      } catch (error) {
        console.error("Failed to match scholarships:", error);
        toast.error("Não foi possível fazer matching das bolsas");
      } finally {
        setMatching(false);
      }
    },
    []
  );

  return { matching, results, matchWithScholarships };
}
