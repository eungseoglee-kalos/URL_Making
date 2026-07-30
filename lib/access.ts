import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ADMIN_EMAIL 계정은 profiles.is_admin 과 무관하게 항상 관리자다. 관리자들이
 * 서로를 강등시켜 아무도 관리자 페이지에 들어갈 수 없게 되는 상황을 막는
 * 잠금장치라, 화면에서도 이 계정의 권한은 해제할 수 없게 해두었다.
 */
export function isRootAdmin(email: string | null | undefined) {
  return !!email && email === process.env.ADMIN_EMAIL;
}

export type Access = { isAdmin: boolean; isApproved: boolean };

/**
 * 로그인한 사용자의 권한을 한 번의 조회로 판정한다. 관리자는 승인 여부와
 * 무관하게 승인된 것으로 본다.
 */
export async function getAccess(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<Access> {
  // is_admin 을 지목해서 고르지 않는다. 마이그레이션 전에 배포되면 없는 컬럼
  // 때문에 조회 전체가 실패해서, 승인된 일반 사용자까지 승인 대기 화면으로
  // 떨어진다. * 로 받으면 컬럼이 생기기 전에는 undefined 로 읽혀 false 가 된다.
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = isRootAdmin(user.email) || data?.is_admin === true;
  return { isAdmin, isApproved: isAdmin || data?.is_approved === true };
}
