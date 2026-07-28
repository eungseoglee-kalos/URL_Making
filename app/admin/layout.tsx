import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/dashboard/Topbar";
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
    redirect("/coating");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Topbar email={user.email} />
      <div className="border-b border-black/10 px-4 py-2 dark:border-white/10 md:px-6">
        <Link
          href="/coating"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← 코팅현황으로
        </Link>
      </div>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
