import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Must stay a default export. The docs say a named `proxy` export works too,
// but on Next 16.2.11 that makes Turbopack log "Proxy is missing expected
// function export name" on every dev request -- it still runs, it just warns.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// /api 는 제외한다. 세션 쿠키가 아니라 각자의 방식으로 인증하는 경로라
// (예: /api/ingest 는 INGEST_TOKEN), 여기서 가로채면 로그인 화면으로
// 리다이렉트돼 버린다. /api 아래에 라우트를 추가할 때는 인증을 직접 챙길 것.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
