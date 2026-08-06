import DashboardGate from "@/components/dashboard/DashboardGate";

export const runtime = "nodejs";

export default function VmCoilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate href="/vm-coil">{children}</DashboardGate>;
}
