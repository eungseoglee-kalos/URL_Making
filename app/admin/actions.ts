"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestWorkbook, IngestError } from "@/lib/ingest";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return supabase;
}

export async function approveUser(formData: FormData) {
  const supabase = await requireAdmin();
  const userId = formData.get("user_id") as string;

  await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  revalidatePath("/admin");
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
  const supabase = await requireAdmin();

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
