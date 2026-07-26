"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendAdminSignupEmail } from "@/lib/email";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  await sendAdminSignupEmail(email);

  redirect(
    "/login?message=" +
      encodeURIComponent(
        "가입 신청이 접수되었습니다. 이메일 인증 후 관리자 승인이 완료되면 이용하실 수 있습니다.",
      ),
  );
}
