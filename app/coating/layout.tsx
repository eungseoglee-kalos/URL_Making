import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/dashboard/Topbar";
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
    <div className="flex min-h-full flex-1 flex-col">
      <Topbar email={user.email} />
      <div className="flex items-center gap-4 border-b border-black/10 px-4 py-2 dark:border-white/10 md:px-6">
        <Link
          href="/"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← 대시보드 목록
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            관리자
          </Link>
        )}
      </div>
      <main className="flex-1 p-4 md:p-6">
        {isApproved ? children : <PendingApproval />}
      </main>
    </div>
  );
}
