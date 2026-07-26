import { connection } from "next/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import PendingApproval from "@/components/dashboard/PendingApproval";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
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
    <div className="flex min-h-full">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-h-full flex-1 flex-col">
        <Topbar email={user.email} />
        <div className="bg-red-600 px-4 py-1 text-xs text-white">
          DEBUG user=[{user.email}] admin_env=[{process.env.ADMIN_EMAIL}]
          isAdmin={String(isAdmin)} profile_error={profile ? "none" : "yes"}
        </div>
        <main className="flex-1 p-4 md:p-6">
          {isApproved ? children : <PendingApproval />}
        </main>
      </div>
    </div>
  );
}
