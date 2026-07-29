-- 데이터 자동 취합 이력. 대시보드의 "마지막 갱신" 표시와, 자동화가 조용히
-- 멈춘 걸 알아채는 용도.
-- Supabase 대시보드의 SQL Editor에서 한 번 실행하면 됩니다.
--
-- 쓰기는 서버(서비스 롤 또는 관리자 세션)만 하고, 읽기는 로그인한 사용자
-- 전원에게 열어둡니다 -- 각 대시보드가 자기 테이블의 마지막 성공 시각을
-- 읽어야 하기 때문입니다.

create table if not exists public.sync_log (
  id         bigint generated always as identity primary key,
  target     text        not null,   -- 대상 테이블명 (coating_records 등)
  label      text        not null,   -- 사람이 읽는 이름
  status     text        not null,   -- 'ok' | 'error'
  row_count  integer,                -- 성공 시 반영된 행 수
  message    text,                   -- 실패 사유
  source     text        not null,   -- 'api' (자동) | 'admin' (수동 업로드)
  file_name  text,
  created_at timestamptz not null default now()
);

-- 대시보드가 매번 "이 테이블의 최근 성공 1건"을 찾으므로 그 순서로 걸어둔다.
create index if not exists sync_log_target_created_at_idx
  on public.sync_log (target, created_at desc);

alter table public.sync_log enable row level security;

drop policy if exists "authenticated can read sync log" on public.sync_log;
create policy "authenticated can read sync log"
  on public.sync_log for select to authenticated using (true);

drop policy if exists "authenticated can insert sync log" on public.sync_log;
create policy "authenticated can insert sync log"
  on public.sync_log for insert to authenticated with check (true);
