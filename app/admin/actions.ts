"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCoatingExcel, type CoatingRow } from "@/lib/coating-import";
import {
  parseProductionPlanExcel,
  type ProductionPlanRow,
} from "@/lib/production-plan-import";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/coating");
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

export async function uploadCoatingExcel(formData: FormData) {
  const supabase = await requireAdmin();

  const file = formData.get("excel");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/admin?coatingError=" + encodeURIComponent("파일을 선택해주세요."),
    );
  }

  const buffer = await file.arrayBuffer();

  let rows: CoatingRow[];
  try {
    rows = parseCoatingExcel(buffer);
  } catch (e) {
    redirect(
      "/admin?coatingError=" +
        encodeURIComponent(e instanceof Error ? e.message : "파싱 실패"),
    );
  }

  if (rows.length === 0) {
    redirect(
      "/admin?coatingError=" +
        encodeURIComponent("엑셀에서 데이터를 찾을 수 없습니다."),
    );
  }

  const { error: deleteError } = await supabase
    .from("coating_records")
    .delete()
    .gt("id", 0);

  if (deleteError) {
    redirect(
      "/admin?coatingError=" +
        encodeURIComponent("기존 데이터 삭제 실패: " + deleteError.message),
    );
  }

  const chunkSize = 1000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from("coating_records")
      .insert(chunk);
    if (insertError) {
      redirect(
        "/admin?coatingError=" +
          encodeURIComponent(
            `${i}건째 업로드 중 실패: ${insertError.message}`,
          ),
      );
    }
  }

  revalidatePath("/coating");
  redirect(
    "/admin?coatingMessage=" +
      encodeURIComponent(`${rows.length}건 업로드 완료`),
  );
}

export async function uploadProductionPlanExcel(formData: FormData) {
  const supabase = await requireAdmin();

  const file = formData.get("excel");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?planError=" + encodeURIComponent("파일을 선택해주세요."));
  }

  const buffer = await file.arrayBuffer();

  let rows: ProductionPlanRow[];
  try {
    rows = parseProductionPlanExcel(buffer);
  } catch (e) {
    redirect(
      "/admin?planError=" +
        encodeURIComponent(e instanceof Error ? e.message : "파싱 실패"),
    );
  }

  if (rows.length === 0) {
    redirect(
      "/admin?planError=" +
        encodeURIComponent("엑셀에서 데이터를 찾을 수 없습니다."),
    );
  }

  const { error: deleteError } = await supabase
    .from("production_plan_records")
    .delete()
    .gt("id", 0);

  if (deleteError) {
    redirect(
      "/admin?planError=" +
        encodeURIComponent("기존 데이터 삭제 실패: " + deleteError.message),
    );
  }

  // ~34k rows would take too long one chunk at a time for the 60s budget,
  // so chunks go up a few at a time.
  const chunkSize = 1000;
  const concurrency = 4;
  const chunks: ProductionPlanRow[][] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i += concurrency) {
    const group = chunks.slice(i, i + concurrency);
    const results = await Promise.all(
      group.map((chunk) =>
        supabase.from("production_plan_records").insert(chunk),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      redirect(
        "/admin?planError=" +
          encodeURIComponent(
            `${i * chunkSize}건째 부근 업로드 실패: ${failed.error.message}`,
          ),
      );
    }
  }

  revalidatePath("/production-plan");
  redirect(
    "/admin?planMessage=" +
      encodeURIComponent(`${rows.length.toLocaleString()}건 업로드 완료`),
  );
}
