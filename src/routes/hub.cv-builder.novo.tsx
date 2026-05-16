import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { CvBuilderHome } from "@/components/cv/CvBuilderV2";

export const Route = createFileRoute("/hub/cv-builder/novo")({
  component: NewCvRoute,
});

function NewCvRoute() {
  useEffect(() => {
    const button = document.querySelector("button");
    if (button instanceof HTMLButtonElement) button.click();
  }, []);

  return <CvBuilderHome />;
}
