import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/dashboard/AppShell";
import PendingApproval from "@/components/dashboard/PendingApproval";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function CoatingLayout({
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
