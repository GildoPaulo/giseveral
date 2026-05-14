import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scholarship } from "@/data/hub-bolsas";
import { MatchingResult } from "@/services/scholarshipMatching";
import { getMatchInterpretation } from "./types";
import { Zap, CheckCircle, AlertCircle, Info } from "lucide-react";

interface MatchingScoreDisplayProps {
  scholarship: Scholarship;
  matching: MatchingResult;
  onApply: () => void;
  loading?: boolean;
}

/**
 * Display AI matching score and reasons
 */
export const MatchingScoreDisplay: React.FC<MatchingScoreDisplayProps> = ({
  scholarship,
  matching,
  onApply,
  loading = false,
}) => {
  const interpretation = getMatchInterpretation(matching.overallScore);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-semibold mb-2">Compatibilidade com sua candidatura</h3>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-24 h-24 rounded-full ${interpretation.color} flex items-center justify-center text-white`}
              >
                <span className="text-4xl font-bold">{matching.overallScore}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-2">Compatibilidade</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-lg">{interpretation.label}</p>
              <p className="text-sm text-muted-foreground mt-2">{interpretation.advice}</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <ScoreBar
            label="Educação"
            score={matching.educationMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <ScoreBar
            label="Experiência"
            score={matching.experienceMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <ScoreBar
            label="Idiomas"
            score={matching.languageMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <ScoreBar
            label="Área de estudo"
            score={matching.areaMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <ScoreBar
            label="Localização"
            score={matching.locationMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <ScoreBar
            label="Cobertura financeira"
            score={matching.coverageMatch}
            icon={<CheckCircle className="w-4 h-4" />}
          />
        </div>

        {/* Match Reasons */}
        {matching.matchReasons.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Por que você é um bom candidato
            </h4>
            <ul className="space-y-1">
              {matching.matchReasons.map((reason, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {matching.recommendations.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Recomendações
            </h4>
            <ul className="space-y-1">
              {matching.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-blue-900">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Readiness level warning */}
        {matching.readinessLevel === "needs_prep" && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Você atende aos requisitos básicos, mas pode se preparar melhor.
            </p>
          </div>
        )}

        {matching.readinessLevel === "not_suitable" && (
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Este bolsa pode não ser a melhor opção. Procure bolsas melhor alinhadas.
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={onApply}
          disabled={loading || matching.readinessLevel === "not_suitable"}
          className="w-full"
        >
          {loading ? "Carregando..." : "Candidatar-me"}
        </Button>
      </div>
    </Card>
  );
};

interface ScoreBarProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
}

/**
 * Individual score bar component
 */
const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, icon }) => {
  const color =
    score >= 75
      ? "bg-green-500"
      : score >= 50
      ? "bg-yellow-500"
      : score >= 25
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs font-semibold">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

export default MatchingScoreDisplay;
