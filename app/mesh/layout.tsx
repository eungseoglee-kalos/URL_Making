import DashboardGate from "@/components/dashboard/DashboardGate";

export const runtime = "nodejs";

export default function MeshLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate href="/mesh">{children}</DashboardGate>;
}
