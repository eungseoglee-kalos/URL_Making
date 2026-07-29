import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";
import PendingApproval from "./PendingApproval";
import { createClient } from "@/lib/supabase/server";

/**
 * 대시보드 라우트의 공통 진입 관문: 로그인 확인 -> 승인 확인 -> AppShell.
 * 각 대시보드의 layout.tsx 가 이걸 감싸기만 하면 된다.
 */
export default async function DashboardGate({
  children,
}: {
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

  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  const isApproved = isAdmin || profile?.is_approved === true;

  return (
    <AppShell email={user.email} isAdmin={isAdmin}>
      {isApproved ? children : <PendingApproval />}
    </AppShell>
  );
}
