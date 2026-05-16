import { createFileRoute } from "@tanstack/react-router";
import { CvBuilderEditor } from "@/components/cv/CvBuilderV2";

export const Route = createFileRoute("/hub/cv-builder/$id")({
  component: EditorRoute,
});

function EditorRoute() {
  const { id } = Route.useParams();
  return <CvBuilderEditor id={id} />;
}
