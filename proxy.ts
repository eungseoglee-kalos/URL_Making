import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Must stay a default export. The docs say a named `proxy` export works too,
// but on Next 16.2.11 that makes Turbopack log "Proxy is missing expected
// function export name" on every dev request -- it still runs, it just warns.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
