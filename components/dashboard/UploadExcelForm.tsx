"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * 업로드는 파일 크기에 따라 10~40초쯤 걸린다. 그동안 화면이 그대로라 눌렸는지
 * 알 수 없어 같은 파일을 여러 번 올리게 되므로, 전송 중임을 눈에 보이게 한다.
 *
 * useFormStatus 는 감싸는 form 의 자식에서만 값을 읽을 수 있어서 필드 부분을
 * 별도 컴포넌트로 뺐다.
 */
function Fields() {
  const { pending } = useFormStatus();
  const [fileName, setFileName] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // 경과 시간은 interval 콜백에서만 갱신한다. effect 본문에서 곧바로
  // setState 하면 렌더가 연쇄로 돈다.
  useEffect(() => {
    if (!pending) return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [pending]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          name="excel"
          accept=".xlsx,.xls"
          required
          disabled={pending}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="text-sm disabled:opacity-50"
        />
        <button
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending && (
            <span
              aria-hidden
              className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background"
            />
          )}
          {pending ? "업로드 중..." : "업로드"}
        </button>
      </div>

      {pending && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-foreground/70"
        >
          {fileName ? `${fileName} 처리 중` : "처리 중"}
          {elapsed > 0 && ` · ${elapsed}초 경과`} · 파일 크기에 따라 40초까지
          걸릴 수 있습니다. 창을 닫지 마세요.
        </p>
      )}
    </div>
  );
}

export default function UploadExcelForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <Fields />
    </form>
  );
}
