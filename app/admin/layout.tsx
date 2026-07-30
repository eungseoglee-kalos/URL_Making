import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/dashboard/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";

export const runtime = "nodejs";

export default async function AdminLayout({
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

  const { isAdmin } = await getAccess(supabase, user);
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <AppShell email={user.email} isAdmin>
      {children}
    </AppShell>
  );
}
