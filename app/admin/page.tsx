import { createClient } from "@/lib/supabase/server";
import ConfirmSubmitButton from "@/components/dashboard/ConfirmSubmitButton";
import UploadExcelForm from "@/components/dashboard/UploadExcelForm";
import { INGEST_TARGETS } from "@/lib/ingest";
import { isRootAdmin } from "@/lib/access";
import {
  DASHBOARDS,
  orderDashboards,
  type DashboardOrderRow,
} from "@/lib/dashboards";
import {
  approveUser,
  deleteMember,
  uploadExcel,
  setMemberAdmin,
  moveDashboard,
  setDashboardAccess,
} from "./actions";

export const maxDuration = 60;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    uploadError?: string;
    uploadMessage?: string;
    adminError?: string;
    adminMessage?: string;
  }>;
}) {
  const { uploadError, uploadMessage, adminError, adminMessage } =
    await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const viewerIsRootAdmin = isRootAdmin(user?.email);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: savedOrder } = await supabase
    .from("dashboard_order")
    .select("href, sort_order")
    .order("sort_order", { ascending: true });

  const dashboards = orderDashboards(savedOrder as DashboardOrderRow[] | null);

  const pending = profiles?.filter((p) => !p.is_approved) ?? [];
  const approved = profiles?.filter((p) => p.is_approved) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-1 text-sm font-semibold">데이터 업로드</h2>
        <p className="mb-1 text-xs text-foreground/60">
          엑셀 파일을 올리면 시트 이름으로 종류를 판별해 해당 대시보드의 기존
          데이터를 교체합니다. 한 파일에 여러 시트가 있으면 함께 반영됩니다.
        </p>
        <p className="mb-3 text-xs text-foreground/50">
          인식하는 시트: {INGEST_TARGETS.map((t) => t.sheet).join(", ")}
        </p>
        <UploadExcelForm action={uploadExcel} />
        {uploadError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </p>
        )}
        {uploadMessage && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            {uploadMessage}
          </p>
        )}
      </div>

      {(adminError || adminMessage) && (
        <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
          {adminError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {adminError}
            </p>
          )}
          {adminMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {adminMessage}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">
            승인 대기 중 ({pending.length})
          </h2>
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
          <h2 className="text-sm font-semibold">대시보드 순서</h2>
          <p className="mt-1 text-xs text-foreground/60">
            대시보드 선택 화면에 나타나는 순서입니다. 카드 색은 위치에 따라
            정해지므로 순서를 바꾸면 색도 함께 바뀝니다.
          </p>
        </div>
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {dashboards.map((d, i) => (
            <li
              key={d.href}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <span className="mr-2 text-foreground/40">{i + 1}</span>
                <span className="font-medium">{d.title}</span>
                <span className="ml-2 text-xs text-foreground/50">
                  {d.href}
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <form action={moveDashboard}>
                  <input type="hidden" name="href" value={d.href} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    disabled={i === 0}
                    aria-label={`${d.title} 위로`}
                    className="rounded-md border border-black/10 px-2.5 py-1 text-xs disabled:opacity-30 dark:border-white/10"
                  >
                    ▲
                  </button>
                </form>
                <form action={moveDashboard}>
                  <input type="hidden" name="href" value={d.href} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    disabled={i === dashboards.length - 1}
                    aria-label={`${d.title} 아래로`}
                    className="rounded-md border border-black/10 px-2.5 py-1 text-xs disabled:opacity-30 dark:border-white/10"
                  >
                    ▼
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10">
        <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">승인됨 ({approved.length})</h2>
          <p className="mt-1 text-xs text-foreground/60">
            비밀번호를 잊은 사용자는 계정을 삭제한 뒤 다시 가입하도록
            안내해주세요.
          </p>
        </div>
        {approved.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/60">
            승인된 사용자가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {approved.map((p) => {
              const isAdminAccount = isRootAdmin(p.email) || p.is_admin;
              const allowed = p.allowed_dashboards as string[] | null;
              return (
                <li key={p.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-foreground/60">{p.email}</span>
                      {isRootAdmin(p.email) ? (
                        <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                          기본 관리자
                        </span>
                      ) : (
                        p.is_admin && (
                          <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-[11px] font-medium">
                            관리자
                          </span>
                        )
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {viewerIsRootAdmin &&
                        !isRootAdmin(p.email) &&
                        p.id !== currentUserId && (
                        <form action={setMemberAdmin}>
                          <input type="hidden" name="user_id" value={p.id} />
                          <input
                            type="hidden"
                            name="grant"
                            value={p.is_admin ? "0" : "1"}
                          />
                          <button className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium dark:border-white/10">
                            {p.is_admin ? "관리자 해제" : "관리자 지정"}
                          </button>
                        </form>
                      )}
                      {!isRootAdmin(p.email) && (
                        <form action={deleteMember}>
                          <input type="hidden" name="user_id" value={p.id} />
                          <ConfirmSubmitButton
                            confirmText={`${p.email} 계정을 완전히 삭제하시겠습니까? 되돌릴 수 없습니다.`}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-900 dark:text-red-400"
                          >
                            삭제
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* 관리자는 항상 전체 대시보드를 보므로 설정할 게 없다. */}
                  {!isAdminAccount && (
                    <form
                      action={setDashboardAccess}
                      className="flex flex-wrap items-center gap-3 rounded-md border border-black/10 px-3 py-2 text-xs dark:border-white/10"
                    >
                      <input type="hidden" name="user_id" value={p.id} />
                      <span className="text-foreground/50">열람 가능:</span>
                      {DASHBOARDS.map((d) => (
                        <label
                          key={d.href}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="checkbox"
                            name="dashboards"
                            value={d.href}
                            defaultChecked={
                              allowed === null || allowed.includes(d.href)
                            }
                          />
                          {d.title}
                        </label>
                      ))}
                      <button className="ml-auto rounded-md border border-black/10 px-2.5 py-1 font-medium dark:border-white/10">
                        저장
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
