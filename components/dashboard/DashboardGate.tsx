import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";
import PendingApproval from "./PendingApproval";
import DashboardDenied from "./DashboardDenied";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import { canAccessDashboard } from "@/lib/dashboards";

/**
 * 대시보드 라우트의 공통 진입 관문: 로그인 확인 -> 승인 확인 -> 이 대시보드
 * 열람 권한 확인 -> AppShell. 각 대시보드의 layout.tsx 가 자기 href 를 넘겨
 * 감싸기만 하면 된다. href 를 안 넘기면(예: 관리자 화면 자체) 열람 제한은
 * 건너뛴다.
 */
export default async function DashboardGate({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { isAdmin, isApproved, allowedDashboards } = await getAccess(
    supabase,
    user,
  );
  const allowed = href ? canAccessDashboard(href, allowedDashboards) : true;

  return (
    <AppShell email={user.email} isAdmin={isAdmin}>
      {!isApproved ? (
        <PendingApproval />
      ) : allowed ? (
        children
      ) : (
        <DashboardDenied />
      )}
    </AppShell>
  );
}
