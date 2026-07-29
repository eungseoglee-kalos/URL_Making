import ShipmentDashboard from "@/components/dashboard/ShipmentDashboard";

export default function HeaterCoilPage() {
  return (
    <ShipmentDashboard
      title="히터코일 출하현황"
      table="heater_coil_shipments"
      vendorLabel="코팅업체"
      monthlyChartTitle="히터코일 월별 출하량"
      vendorChartTitle="월별 코팅현황"
    />
  );
}
