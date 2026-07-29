const RESEND_API_URL = "https://api.resend.com/emails";

async function send(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.error(
      "RESEND_API_KEY or ADMIN_EMAIL is not set; skipping email:",
      subject,
    );
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "KBM Naju Dashboard <onboarding@resend.dev>",
      to: adminEmail,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send email", subject, await response.text());
  }
}

/**
 * 자동 취합이 실패했을 때만 부른다. 성공은 대시보드의 "마지막 갱신"으로 알 수
 * 있으니 매번 메일을 보내면 금방 무시하게 된다.
 */
export async function sendIngestFailureEmail(
  fileName: string,
  failures: { label: string; message: string }[],
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://naju.kbmtt.com";
  const rows = failures
    .map(
      (f) =>
        `<li><strong>${f.label}</strong><br>${f.message}</li>`,
    )
    .join("");

  await send(
    `[나주 대시보드] 데이터 자동 갱신 실패 - ${fileName}`,
    `<p><code>${fileName}</code> 취합에 실패했습니다. 기존 데이터는 그대로 유지됩니다.</p>` +
      `<ul>${rows}</ul>` +
      `<p><a href="${appUrl}/admin">관리자 페이지에서 직접 올리기</a></p>`,
  );
}

export async function sendAdminSignupEmail(newUserEmail: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://naju.kbmtt.com";

  await send(
    "새 가입 승인 요청",
    `<p>${newUserEmail} 님이 가입 신청했습니다.</p><p><a href="${appUrl}/admin">여기서 승인하기</a></p>`,
  );
}
