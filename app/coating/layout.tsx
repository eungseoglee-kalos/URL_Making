import DashboardGate from "@/components/dashboard/DashboardGate";

export const runtime = "nodejs";

export default function CoatingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate>{children}</DashboardGate>;
}
