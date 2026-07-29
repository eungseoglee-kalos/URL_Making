import ShipmentDashboard from "@/components/dashboard/ShipmentDashboard";

export default function MeshPage() {
  return (
    <ShipmentDashboard
      title="메시 출하현황"
      table="mesh_shipments"
      vendorLabel="메시가공처"
      monthlyChartTitle="메시 월별 출하량"
      vendorChartTitle="월별 메시가공처"
    />
  );
}
