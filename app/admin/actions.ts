"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestWorkbook, IngestError } from "@/lib/ingest";
import { getAccess, isRootAdmin } from "@/lib/access";
import {
  DASHBOARDS,
  orderDashboards,
  type DashboardOrderRow,
} from "@/lib/dashboards";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { isAdmin } = await getAccess(supabase, user);
  if (!isAdmin) redirect("/");

  return { supabase, user };
}

// profiles 쓰기는 전부 서비스 롤로 한다. 세션 클라이언트로 남의 행을 고치려면
// authenticated 에게 UPDATE 를 열어줘야 하는데, 그러면 아무 회원이나 REST 로
// 자기 is_admin 을 켤 수 있다.
export async function approveUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  if (error) {
    redirect("/admin?adminError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin");
}

export async function setMemberAdmin(formData: FormData) {
  const { user } = await requireAdmin();
  const userId = formData.get("user_id") as string;
  const grant = formData.get("grant") === "1";

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  const fail = (message: string) => {
    redirect("/admin?adminError=" + encodeURIComponent(message));
  };

  // ADMIN_EMAIL 계정은 코드가 항상 관리자로 치므로 플래그를 만져봐야 표시만
  // 어긋난다. 자기 자신은 실수로 내려서 화면을 잃는 일이 흔해 막아둔다.
  if (isRootAdmin(target?.email)) {
    fail("기본 관리자 계정의 권한은 변경할 수 없습니다.");
  }
  if (userId === user.id) {
    fail("자기 자신의 관리자 권한은 해제할 수 없습니다.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ is_admin: grant, ...(grant ? { is_approved: true } : {}) })
    .eq("id", userId);

  if (error) fail(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(
    "/admin?adminMessage=" +
      encodeURIComponent(
        `${target?.email ?? "계정"} 을(를) ${grant ? "관리자로 지정" : "일반 사용자로 변경"}했습니다.`,
      ),
  );
}

/**
 * 체크된 항목이 전체 대시보드와 같으면 제한 없음(null)으로 저장한다. 그래야
 * 나중에 대시보드가 추가돼도 "전체 허용"인 사용자는 자동으로 새 항목까지
 * 보게 된다 -- 매번 모든 사용자 행을 갱신할 필요가 없다.
 */
export async function setDashboardAccess(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const selected = formData.getAll("dashboards") as string[];
  const allowed = selected.length >= DASHBOARDS.length ? null : selected;

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ allowed_dashboards: allowed })
    .eq("id", userId);

  if (error) {
    redirect("/admin?adminError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(
    "/admin?adminMessage=" +
      encodeURIComponent("대시보드 열람 권한을 저장했습니다."),
  );
}

export async function moveDashboard(formData: FormData) {
  await requireAdmin();
  const href = formData.get("href") as string;
  const direction = formData.get("direction") === "up" ? -1 : 1;

  const admin = createAdminClient();
  const { data: saved } = await admin
    .from("dashboard_order")
    .select("href, sort_order")
    .order("sort_order", { ascending: true });

  const current = orderDashboards(saved as DashboardOrderRow[] | null);
  const from = current.findIndex((d) => d.href === href);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= current.length) {
    redirect("/admin");
  }

  const next = [...current];
  [next[from], next[to]] = [next[to], next[from]];

  // 전체를 다시 적어야 저장된 적 없는 항목까지 자리를 얻는다.
  const { error } = await admin.from("dashboard_order").upsert(
    next.map((d, i) => ({
      href: d.href,
      sort_order: i,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "href" },
  );

  if (error) {
    redirect("/admin?adminError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteMember(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    redirect("/admin?adminError=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin");
  redirect(
    "/admin?adminMessage=" + encodeURIComponent("계정을 삭제했습니다."),
  );
}

/**
 * 관리자 페이지의 수동 업로드. /api/ingest 와 같은 취합 경로를 타므로 시트
 * 이름으로 종류가 자동 판별되고, 행 수 급감 가드와 sync_log 기록도 똑같이
 * 적용된다. 업로드 칸을 종류별로 나눌 필요가 없어졌다.
 */
export async function uploadExcel(formData: FormData) {
  await requireAdmin();

  // /api/ingest 와 같은 서비스 롤로 넣는다. 호출자 세션으로 넣으면 표마다
  // authenticated 쓰기 정책이 있어야 하는데, coating_records 는 이 저장소가
  // 생기기 전에 만들어져 그 정책이 없다. 그래서 관리자 화면에서만 코팅현황
  // 업로드가 "row-level security policy" 오류로 막혔다. 관리자 확인은 바로
  // 위에서 끝났으므로 여기서 RLS 를 우회해도 통제는 유지된다.
  const supabase = createAdminClient();

  const file = formData.get("excel");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/admin?uploadError=" + encodeURIComponent("파일을 선택해주세요."),
    );
  }

  const buffer = await file.arrayBuffer();

  let outcomes;
  try {
    outcomes = await ingestWorkbook(supabase, buffer, {
      source: "admin",
      fileName: file.name,
    });
  } catch (e) {
    const message =
      e instanceof IngestError || e instanceof Error
        ? e.message
        : "취합 실패";
    redirect("/admin?uploadError=" + encodeURIComponent(message));
  }

  for (const o of outcomes) {
    if (o.status === "ok") revalidatePath(o.path);
  }

  const ok = outcomes.filter((o) => o.status === "ok");
  const failed = outcomes.filter((o) => o.status === "error");

  const parts: string[] = [];
  if (ok.length > 0) {
    parts.push(
      ok
        .map((o) => `${o.label} ${o.rows?.toLocaleString()}건`)
        .join(", ") + " 반영 완료",
    );
  }
  if (failed.length > 0) {
    redirect(
      "/admin?uploadError=" +
        encodeURIComponent(
          failed.map((o) => `${o.label}: ${o.message}`).join(" / "),
        ) +
        (parts.length > 0
          ? "&uploadMessage=" + encodeURIComponent(parts.join(" "))
          : ""),
    );
  }

  redirect("/admin?uploadMessage=" + encodeURIComponent(parts.join(" ")));
}
