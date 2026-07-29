import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestWorkbook, IngestError } from "@/lib/ingest";
import { sendIngestFailureEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

// 사내 PC의 작업 스케줄러가 엑셀을 밀어넣는 입구. 로그인 세션이 아니라
// INGEST_TOKEN 으로 인증하고, 그래서 RLS를 우회하는 서비스 롤 클라이언트를
// 쓴다 -- 토큰 검사를 통과하기 전에는 어떤 DB 작업도 하지 않는다.
export async function POST(request: NextRequest) {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "INGEST_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "인증 실패" }, { status: 401 });
  }

  let file: File;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File) || value.size === 0) {
      return NextResponse.json(
        { ok: false, error: "file 필드에 파일이 없습니다." },
        { status: 400 },
      );
    }
    file = value;
  } catch {
    return NextResponse.json(
      { ok: false, error: "multipart/form-data 로 보내주세요." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const buffer = await file.arrayBuffer();

  let outcomes;
  try {
    outcomes = await ingestWorkbook(supabase, buffer, {
      source: "api",
      fileName: file.name,
    });
  } catch (e) {
    const message =
      e instanceof IngestError
        ? e.message
        : e instanceof Error
          ? e.message
          : "취합 실패";
    await sendIngestFailureEmail(file.name, [{ label: file.name, message }]);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  for (const o of outcomes) {
    if (o.status === "ok") revalidatePath(o.path);
  }

  const failures = outcomes.filter((o) => o.status === "error");
  if (failures.length > 0) {
    await sendIngestFailureEmail(
      file.name,
      failures.map((f) => ({ label: f.label, message: f.message ?? "" })),
    );
  }

  return NextResponse.json(
    { ok: failures.length === 0, file: file.name, results: outcomes },
    { status: failures.length === 0 ? 200 : 207 },
  );
}
