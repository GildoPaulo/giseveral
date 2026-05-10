import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/noticias")({
  component: () => <Outlet />,
});
