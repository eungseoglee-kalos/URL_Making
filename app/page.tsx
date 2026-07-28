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
  // add future dashboards here -- each one automatically gets the next
  // color in DASHBOARD_COLOR_CLASSES below.
];

// Cycles through this palette by list position, so new dashboards added
// above automatically get a different color without extra wiring.
const DASHBOARD_COLOR_CLASSES = [
  "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:hover:bg-blue-900",
  "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900",
  "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900",
  "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950 dark:hover:bg-purple-900",
  "border-teal-200 bg-teal-50 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950 dark:hover:bg-teal-900",
  "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900",
] as const;

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
            {DASHBOARDS.map((d, i) => (
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
