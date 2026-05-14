import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Scholarship } from "@/data/hub-bolsas";
import { ScholarshipApplication, APPLICATION_STEPS } from "./types";
import { useScholarshipApplication } from "./useApplications";
import { ChevronRight, ChevronLeft, Upload, Trash2, Check } from "lucide-react";

interface ApplicationFormProps {
  scholarship: Scholarship;
  applicationId: string;
}

/**
 * Multi-step scholarship application form
 */
export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  scholarship,
  applicationId,
}) => {
  const {
    application,
    documents,
    saving,
    moveToStep,
    updatePersonalStatement,
    updateMotivationLetter,
    uploadDocument,
    deleteDocument,
    submitApplication,
  } = useScholarshipApplication(applicationId);

  if (!application) return <div>Carregando...</div>;

  const currentStep = application.currentStep || "review";
  const currentIndex = APPLICATION_STEPS.indexOf(currentStep as any);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div>
        <div className="flex gap-2">
          {APPLICATION_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i < currentIndex
                    ? "bg-green-500 text-white"
                    : i === currentIndex
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="text-xs">
                <div className="font-medium capitalize">{step}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Passo {currentIndex + 1} de {APPLICATION_STEPS.length}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === "review" && (
          <ReviewStep scholarship={scholarship} application={application} />
        )}

        {currentStep === "personal" && (
          <PersonalStatementStep
            value={application.personalStatement || ""}
            onChange={updatePersonalStatement}
            saving={saving}
          />
        )}

        {currentStep === "motivation" && (
          <MotivationLetterStep
            value={application.motivationLetter || ""}
            onChange={updateMotivationLetter}
            saving={saving}
          />
        )}

        {currentStep === "documents" && (
          <DocumentsStep
            documents={documents}
            onUpload={uploadDocument}
            onDelete={deleteDocument}
            saving={saving}
          />
        )}

        {currentStep === "preview" && (
          <PreviewStep application={application} documents={documents} />
        )}

        {currentStep === "submit" && (
          <SubmitStep application={application} />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex gap-2 justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const newIndex = currentIndex - 1;
            if (newIndex >= 0) {
              moveToStep(APPLICATION_STEPS[newIndex] as any);
            }
          }}
          disabled={currentIndex === 0 || saving}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button
          onClick={() => {
            if (currentStep === "submit") {
              submitApplication();
            } else {
              const newIndex = currentIndex + 1;
              if (newIndex < APPLICATION_STEPS.length) {
                moveToStep(APPLICATION_STEPS[newIndex] as any);
              }
            }
          }}
          disabled={saving}
        >
          {currentStep === "submit" ? "Submeter candidatura" : "Próximo"}
          {currentStep !== "submit" && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};

// Step Components

interface ReviewStepProps {
  scholarship: Scholarship;
  application: ScholarshipApplication;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ scholarship }) => (
  <div className="space-y-4">
    <h3 className="font-semibold">Revisão da bolsa</h3>
    <div className="space-y-2">
      <div>
        <span className="text-sm text-muted-foreground">Instituição</span>
        <p className="font-medium">{scholarship.institution}</p>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">País</span>
        <p className="font-medium">{scholarship.country}</p>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Nível</span>
        <p className="font-medium">{scholarship.level}</p>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Prazo</span>
        <p className="font-medium">{scholarship.deadline}</p>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">Requisitos</span>
        <ul className="list-disc list-inside space-y-1 mt-1">
          {scholarship.requirements.map((req, i) => (
            <li key={i} className="text-sm">
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mt-4">
      Clique em "Próximo" para começar a preencher a candidatura.
    </p>
  </div>
);

interface PersonalStatementStepProps {
  value: string;
  onChange: (text: string) => void;
  saving: boolean;
}

const PersonalStatementStep: React.FC<PersonalStatementStepProps> = ({
  value,
  onChange,
  saving,
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold mb-2">Declaração Pessoal</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Conte-nos sobre si, suas conquistas e objetivos. (200-500 palavras)
      </p>
    </div>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escreva sua declaração pessoal aqui..."
      rows={10}
      disabled={saving}
    />
    <div className="text-xs text-muted-foreground">
      {value.length} caracteres
    </div>
  </div>
);

interface MotivationLetterStepProps {
  value: string;
  onChange: (text: string) => void;
  saving: boolean;
}

const MotivationLetterStep: React.FC<MotivationLetterStepProps> = ({
  value,
  onChange,
  saving,
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold mb-2">Carta de Motivação</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Explique por que deseja esta bolsa e como ela ajudará seus objetivos. (300-600 palavras)
      </p>
    </div>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escreva sua carta de motivação aqui..."
      rows={12}
      disabled={saving}
    />
    <div className="text-xs text-muted-foreground">
      {value.length} caracteres
    </div>
  </div>
);

interface DocumentsStepProps {
  documents: any[];
  onUpload: (file: File, type: string, label?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({
  documents,
  onUpload,
  onDelete,
  saving,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await onUpload(file, "custom", file.name);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Documentos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Faça upload dos documentos necessários (CV, certidões, etc.)
        </p>
      </div>

      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <label className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Clique para selecionar arquivos</p>
          <p className="text-xs text-muted-foreground">ou arraste-os aqui</p>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={uploading || saving}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium">{doc.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {(doc.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              disabled={saving}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PreviewStepProps {
  application: ScholarshipApplication;
  documents: any[];
}

const PreviewStep: React.FC<PreviewStepProps> = ({ application, documents }) => (
  <div className="space-y-4">
    <h3 className="font-semibold">Resumo da candidatura</h3>

    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Declaração Pessoal</label>
        <p className="text-sm text-muted-foreground mt-1">
          {application.personalStatement?.substring(0, 200)}...
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Carta de Motivação</label>
        <p className="text-sm text-muted-foreground mt-1">
          {application.motivationLetter?.substring(0, 200)}...
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Documentos ({documents.length})</label>
        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
          {documents.map((doc) => (
            <li key={doc.id}>• {doc.file_name}</li>
          ))}
        </ul>
      </div>
    </div>

    <p className="text-xs text-muted-foreground mt-4">
      Revise todas as informações antes de submeter.
    </p>
  </div>
);

interface SubmitStepProps {
  application: ScholarshipApplication;
}

const SubmitStep: React.FC<SubmitStepProps> = ({ application }) => (
  <div className="space-y-4 text-center">
    <h3 className="font-semibold">Pronto para submeter?</h3>
    <p className="text-sm text-muted-foreground">
      Sua candidatura está completa. Clique em "Submeter candidatura" para enviá-la.
    </p>
    <p className="text-xs text-muted-foreground mt-4">
      Status atual: <span className="font-medium">{application.status}</span>
    </p>
  </div>
);

export default ApplicationForm;
