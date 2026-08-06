import Image from "next/image";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1">
      {/* 좁은 화면에서는 사진을 빼고 로그인 폼만 보여준다. 사진 원본 비율이
          화면보다 훨씬 넓어서(2348x1155), 꽉 채우지 않고 폼처럼 상하 여백을
          두고 전체가 다 보이게 넣는다. */}
      <div className="hidden w-1/2 items-center justify-center p-10 md:flex">
        <Image
          src="/naju-factory.png"
          alt="나주공장 전경"
          width={2348}
          height={1155}
          priority
          className="h-auto max-h-full w-full rounded-lg object-contain"
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 text-center text-lg font-semibold">
            KBM Naju Dashboard 로그인
          </h1>

          <form className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next ?? ""} />
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm text-foreground/60">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm text-foreground/60">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {message}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-2">
              <button
                formAction={login}
                className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
              >
                로그인
              </button>
              <button
                formAction={signup}
                className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/10"
              >
                회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
