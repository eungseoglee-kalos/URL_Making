import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveUser } from "./actions";

export default async function AdminPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = profiles?.filter((p) => !p.is_approved) ?? [];
  const approved = profiles?.filter((p) => p.is_approved) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">승인 대기 중 ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/60">
            대기 중인 요청이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{p.email}</span>
                <form action={approveUser}>
                  <input type="hidden" name="user_id" value={p.id} />
                  <button className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                    승인
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">승인됨 ({approved.length})</h2>
        </div>
        {approved.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/60">
            승인된 사용자가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {approved.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm text-foreground/60">
                {p.email}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
