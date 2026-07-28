"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCoatingExcel, type CoatingRow } from "@/lib/coating-import";

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

export async function resetPassword(formData: FormData) {
  const supabase = await requireAdmin();
  const email = formData.get("email") as string;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://naju.kbmtt.com";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/login`,
  });

  if (error) {
    redirect("/admin?adminError=" + encodeURIComponent(error.message));
  }

  redirect(
    "/admin?adminMessage=" +
      encodeURIComponent(`${email}로 비밀번호 재설정 메일을 보냈습니다.`),
  );
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
