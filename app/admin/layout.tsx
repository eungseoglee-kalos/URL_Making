import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/dashboard/AppShell";
import { createClient } from "@/lib/supabase/server";

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

  if (user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return (
    <AppShell email={user.email} isAdmin>
      {children}
    </AppShell>
  );
}
