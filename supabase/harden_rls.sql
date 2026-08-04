-- 지금까지는 "로그인만 하면(authenticated) 전부 읽기/쓰기 가능"이었습니다.
-- 관리자 승인 여부는 화면(app/admin, DashboardGate)에서만 확인했을 뿐, DB
-- 자체는 승인 대기 중인 회원이 REST API로 직접 모든 표를 읽거나 지울 수
-- 있게 열려 있었습니다. anon 키는 브라우저에서 누구나 볼 수 있는 값이라,
-- 이 상태로는 "승인 대기" 화면이 실제 보안 잠금이 아니었습니다.
--
-- 이 파일은 그 구멍을 막습니다:
--   1. 업무 데이터 표(coating_records 등)는 이제 is_approved 인 회원만 읽을
--      수 있고, insert/delete 정책은 전부 없앱니다 -- 실제 쓰기는 이미
--      전부 서비스 롤 키로만 하고 있어(app/admin/actions.ts, /api/ingest),
--      authenticated 에게 쓰기를 열어둘 이유가 없었습니다.
--   2. profiles 는 본인 행만 보이고, 관리자만 전체 회원 목록을 봅니다
--      (관리자 페이지가 전체 목록이 필요합니다).
--
-- Supabase SQL 편집기에서 한 번 실행하면 됩니다. 다른 파일들과 마찬가지로
-- 멱등이라 여러 번 실행해도 안전합니다.

-- ── 0. 관리자 판정 헬퍼 ─────────────────────────────────────────────
-- profiles 정책 안에서 profiles 를 다시 조회하면 재귀 문제가 생길 수 있어
-- SECURITY DEFINER 함수로 감싸서 RLS 를 우회해 안전하게 조회합니다.

create or replace function public.is_admin_user(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create or replace function public.is_approved_user(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin or is_approved from public.profiles where id = uid),
    false
  );
$$;

-- ADMIN_EMAIL 계정은 코드에서 항상 관리자로 취급하지만(lib/access.ts의
-- isRootAdmin), DB의 is_admin 플래그는 그동안 false로 남아 있었습니다.
-- 위 헬퍼가 DB 플래그만 보므로, 두 판정이 어긋나지 않게 맞춰둡니다.
update public.profiles set is_admin = true
where email = 'eungseog.lee@gmail.com' and is_admin is distinct from true;

-- ── 1. profiles: 본인 행만, 관리자는 전체 ───────────────────────────
drop policy if exists "authenticated can read profiles" on public.profiles;
create policy "read own profile or admin reads all"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin_user(auth.uid()));

-- ── 2. 업무 데이터 표: 승인된 회원만 읽기, 쓰기 정책은 제거 ──────────

drop policy if exists "authenticated can insert coating records" on public.coating_records;
drop policy if exists "authenticated can delete coating records" on public.coating_records;
drop policy if exists "authenticated can read coating records" on public.coating_records;
create policy "approved users can read coating records"
  on public.coating_records for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can insert plan records" on public.production_plan_records;
drop policy if exists "authenticated can delete plan records" on public.production_plan_records;
drop policy if exists "authenticated can read plan records" on public.production_plan_records;
create policy "approved users can read plan records"
  on public.production_plan_records for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can insert heater coil" on public.heater_coil_shipments;
drop policy if exists "authenticated can delete heater coil" on public.heater_coil_shipments;
drop policy if exists "authenticated can read heater coil" on public.heater_coil_shipments;
create policy "approved users can read heater coil"
  on public.heater_coil_shipments for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can insert mesh" on public.mesh_shipments;
drop policy if exists "authenticated can delete mesh" on public.mesh_shipments;
drop policy if exists "authenticated can read mesh" on public.mesh_shipments;
create policy "approved users can read mesh"
  on public.mesh_shipments for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can insert vm shipments" on public.vm_shipments;
drop policy if exists "authenticated can delete vm shipments" on public.vm_shipments;
drop policy if exists "authenticated can read vm shipments" on public.vm_shipments;
create policy "approved users can read vm shipments"
  on public.vm_shipments for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can insert vm backlog" on public.vm_backlog;
drop policy if exists "authenticated can delete vm backlog" on public.vm_backlog;
drop policy if exists "authenticated can read vm backlog" on public.vm_backlog;
create policy "approved users can read vm backlog"
  on public.vm_backlog for select to authenticated
  using (public.is_approved_user(auth.uid()));

-- sync_log 도 서버가 서비스 롤 키로만 기록합니다 (lib/ingest.ts recordSync).
drop policy if exists "authenticated can insert sync log" on public.sync_log;
drop policy if exists "authenticated can read sync log" on public.sync_log;
create policy "approved users can read sync log"
  on public.sync_log for select to authenticated
  using (public.is_approved_user(auth.uid()));

drop policy if exists "authenticated can read dashboard order" on public.dashboard_order;
create policy "approved users can read dashboard order"
  on public.dashboard_order for select to authenticated
  using (public.is_approved_user(auth.uid()));
