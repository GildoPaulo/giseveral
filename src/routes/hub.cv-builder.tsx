import { createFileRoute } from "@tanstack/react-router";
import { CvBuilderHome } from "@/components/cv/CvBuilderV2";

export const Route = createFileRoute("/hub/cv-builder")({
  component: CvBuilderHome,
});
