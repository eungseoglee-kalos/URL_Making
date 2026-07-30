import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/dashboard/AppShell";
import PendingApproval from "@/components/dashboard/PendingApproval";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import {
  orderDashboards,
  DASHBOARD_COLOR_CLASSES,
  type DashboardOrderRow,
} from "@/lib/dashboards";

export const runtime = "nodejs";

export default async function Home() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { isAdmin, isApproved } = await getAccess(supabase, user);

  const { data: savedOrder } = await supabase
    .from("dashboard_order")
    .select("href, sort_order")
    .order("sort_order", { ascending: true });

  const dashboards = orderDashboards(savedOrder as DashboardOrderRow[] | null);

  return (
    <AppShell email={user.email} isAdmin={isAdmin}>
      {!isApproved ? (
        <PendingApproval />
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-lg font-semibold">대시보드 선택</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((d, i) => (
              <Link
                key={d.href}
                href={d.href}
                className={`rounded-lg border p-5 transition-colors ${
                  DASHBOARD_COLOR_CLASSES[i % DASHBOARD_COLOR_CLASSES.length]
                }`}
              >
                <p className="text-base font-semibold">{d.title}</p>
                <p className="mt-1 text-sm text-foreground/60">
                  {d.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
