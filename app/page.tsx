import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/dashboard/AppShell";
import PendingApproval from "@/components/dashboard/PendingApproval";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DASHBOARDS = [
  {
    href: "/coating",
    title: "코팅현황",
    description: "나주공장 코팅 생산 및 검사 실적",
  },
];

export default async function Home() {
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
      {!isApproved ? (
        <PendingApproval />
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-lg font-semibold">대시보드 선택</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARDS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
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
