import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scholarship } from "@/data/hub-bolsas";
import { CvData } from "@/components/cv-builder";
import { matchCvToScholarship } from "@/services/scholarshipMatching";
import { useScholarshipApplication } from "./useApplications";
import { MatchingScoreDisplay } from "./MatchingScoreDisplay";
import { ApplicationForm } from "./ApplicationForm";
import { Zap } from "lucide-react";

interface ScholarshipApplicationPageProps {
  scholarship: Scholarship;
  cvData: CvData;
  userId: string;
}

/**
 * Main page for applying to a scholarship
 * Combines AI matching + application form
 */
export const ScholarshipApplicationPage: React.FC<ScholarshipApplicationPageProps> = ({
  scholarship,
  cvData,
  userId,
}) => {
  const [tab, setTab] = useState("matching");
  const [matching, setMatching] = useState<any>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { createApplication } = useScholarshipApplication();

  // Load matching on mount
  useEffect(() => {
    loadMatching();
  }, []);

  const loadMatching = async () => {
    setMatchingLoading(true);
    try {
      const result = await matchCvToScholarship(cvData, scholarship);
      setMatching(result);
    } catch (error) {
      console.error("Failed to load matching:", error);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      const appId = await createApplication(scholarship.id);
      if (appId) {
        setApplicationId(appId);
        setTab("application");
      }
    } catch (error) {
      console.error("Failed to create application:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{scholarship.title}</h1>
        <p className="text-muted-foreground">{scholarship.institution}</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matching" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            IA Matching
          </TabsTrigger>
          <TabsTrigger value="application" disabled={!applicationId}>
            Candidatura
          </TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* Matching Tab */}
        <TabsContent value="matching">
          {matchingLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Analisando compatibilidade...</p>
            </Card>
          ) : matching ? (
            <MatchingScoreDisplay
              scholarship={scholarship}
              matching={matching}
              onApply={handleApply}
              loading={false}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-red-600">Não foi possível carregar o matching</p>
              <Button onClick={loadMatching} className="mt-4">
                Tentar novamente
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Application Tab */}
        <TabsContent value="application">
          {applicationId ? (
            <ApplicationForm scholarship={scholarship} applicationId={applicationId} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Clique em "Candidatar-me" na aba anterior para começar
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Informações</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">País</label>
                  <p className="font-medium">{scholarship.country}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Nível</label>
                  <p className="font-medium">{scholarship.level}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Área</label>
                  <p className="font-medium">{scholarship.area}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cobertura</label>
                  <p className="font-medium">{scholarship.coverage}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Idioma</label>
                  <p className="font-medium">{scholarship.language}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Prazo</label>
                  <p className="font-medium">{scholarship.deadline}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Benefícios</h3>
              <ul className="space-y-2">
                {scholarship.benefits.map((benefit, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 col-span-2">
              <h3 className="font-semibold mb-4">Requisitos</h3>
              <ul className="space-y-2">
                {scholarship.requirements.map((req, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScholarshipApplicationPage;
