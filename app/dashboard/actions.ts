"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function generateShortCode() {
  return Math.random().toString(36).slice(2, 8);
}

export async function createUrl(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const originalUrl = formData.get("original_url") as string;

  const { error } = await supabase.from("urls").insert({
    user_id: user.id,
    original_url: originalUrl,
    short_code: generateShortCode(),
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}
