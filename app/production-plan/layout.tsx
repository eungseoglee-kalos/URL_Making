import DashboardGate from "@/components/dashboard/DashboardGate";

export const runtime = "nodejs";

export default function ProductionPlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate href="/production-plan">{children}</DashboardGate>;
}
