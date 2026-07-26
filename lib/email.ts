const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendAdminSignupEmail(newUserEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.error(
      "RESEND_API_KEY or ADMIN_EMAIL is not set; skipping signup notification email",
    );
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://naju.kbmtt.com";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "URL Making <onboarding@resend.dev>",
      to: adminEmail,
      subject: "새 가입 승인 요청",
      html: `<p>${newUserEmail} 님이 가입 신청했습니다.</p><p><a href="${appUrl}/dashboard/admin">여기서 승인하기</a></p>`,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send admin signup email", await response.text());
  }
}
