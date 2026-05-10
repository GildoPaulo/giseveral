import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/bolsas")({
  component: () => <Outlet />,
});
