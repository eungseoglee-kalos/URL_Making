-- 1) 관리자 권한을 여러 명에게 줄 수 있게 하고
-- 2) 대시보드 선택 화면의 순서를 관리자 페이지에서 바꿀 수 있게 합니다.
--
-- Supabase SQL Editor 에서 한 번 실행하면 됩니다. 다른 파일들과 마찬가지로
-- 멱등이라 여러 번 실행해도 안전합니다.

-- ── 1. 관리자 플래그 ────────────────────────────────────────────────
-- ADMIN_EMAIL 환경변수의 계정은 이 값과 무관하게 항상 관리자입니다. 관리자끼리
-- 서로 강등시켜 아무도 들어갈 수 없게 되는 상황을 막는 잠금장치입니다.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── 2. profiles 쓰기 잠그기 ─────────────────────────────────────────
--
-- ⚠ 이 부분이 이번 변경에서 가장 중요합니다.
--
-- 지금까지 승인 처리(approveUser)는 로그인한 사용자의 세션으로 "남의 행"을
-- 수정했습니다. 그게 동작한다는 것은 authenticated 에게 profiles UPDATE 가
-- 열려 있다는 뜻이고, 여기에 is_admin 을 얹으면 아무 회원이나 REST API 로
-- 자기 행을 직접 고쳐 관리자가 될 수 있습니다.
--
-- 그래서 authenticated 의 UPDATE 를 전부 회수합니다. 승인·관리자 지정은
-- 이제 서버가 서비스 롤 키로 수행하므로(app/admin/actions.ts) 화면 동작에는
-- 영향이 없습니다. 정책 이름을 알 수 없어 UPDATE 정책을 전부 훑어 지웁니다.

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd in ('UPDATE', 'ALL')
  loop
    execute format('drop policy %I on public.profiles', p.policyname);
  end loop;
end $$;

-- 읽기는 필요합니다. 각자 자기 승인/관리자 상태를 확인해야 하고, 관리자
-- 페이지가 회원 목록을 보여줘야 합니다.
drop policy if exists "authenticated can read profiles" on public.profiles;
create policy "authenticated can read profiles"
  on public.profiles for select to authenticated using (true);

alter table public.profiles enable row level security;

-- ── 3. 대시보드 순서 ────────────────────────────────────────────────
-- 제목·설명은 코드(lib/dashboards.ts)에 두고, 여기에는 순서만 담습니다.
-- 코드에 새 대시보드를 추가하면 행이 없으므로 목록 맨 뒤에 붙습니다.

create table if not exists public.dashboard_order (
  href       text        primary key,
  sort_order integer     not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_order enable row level security;

drop policy if exists "authenticated can read dashboard order"
  on public.dashboard_order;
create policy "authenticated can read dashboard order"
  on public.dashboard_order for select to authenticated using (true);

-- 쓰기 정책은 일부러 만들지 않습니다. 순서 변경은 서버가 서비스 롤 키로만
-- 수행하므로, 회원이 직접 REST 로 바꿀 수 없습니다.
