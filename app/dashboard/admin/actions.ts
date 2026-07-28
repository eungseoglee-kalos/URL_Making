"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCoatingExcel, type CoatingRow } from "@/lib/coating-import";

export async function approveUser(formData: FormData) {
  const supabase = await createClient();
  const userId = formData.get("user_id") as string;

  await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  revalidatePath("/dashboard/admin");
}

export async function uploadCoatingExcel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const file = formData.get("excel");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/dashboard/admin?coatingError=" +
        encodeURIComponent("파일을 선택해주세요."),
    );
  }

  const buffer = await file.arrayBuffer();

  let rows: CoatingRow[];
  try {
    rows = parseCoatingExcel(buffer);
  } catch (e) {
    redirect(
      "/dashboard/admin?coatingError=" +
        encodeURIComponent(e instanceof Error ? e.message : "파싱 실패"),
    );
  }

  if (rows.length === 0) {
    redirect(
      "/dashboard/admin?coatingError=" +
        encodeURIComponent("엑셀에서 데이터를 찾을 수 없습니다."),
    );
  }

  const { error: deleteError } = await supabase
    .from("coating_records")
    .delete()
    .gt("id", 0);

  if (deleteError) {
    redirect(
      "/dashboard/admin?coatingError=" +
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
        "/dashboard/admin?coatingError=" +
          encodeURIComponent(
            `${i}건째 업로드 중 실패: ${insertError.message}`,
          ),
      );
    }
  }

  revalidatePath("/coating");
  redirect(
    "/dashboard/admin?coatingMessage=" +
      encodeURIComponent(`${rows.length}건 업로드 완료`),
  );
}
