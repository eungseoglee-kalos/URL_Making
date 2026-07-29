-- 생산계획 대비 실적 대시보드(/production-plan)용 테이블.
-- Supabase 대시보드의 SQL Editor에서 한 번 실행하면 됩니다.
--
-- RLS 정책은 coating_records 와 동일한 방식입니다: 로그인한 사용자
-- (authenticated)만 읽고 쓸 수 있고, anon 키로는 아무것도 보이지 않습니다.
-- 관리자만 업로드할 수 있게 막는 것은 app/admin/actions.ts 의
-- requireAdmin() 이 담당합니다.

create table if not exists public.production_plan_records (
  id               bigint generated always as identity primary key,
  record_date      date        not null,   -- 실적일
  division         text,                   -- 사업부
  department       text,                   -- 부 서
  process          text,                   -- 공정
  part_number      text,                   -- 품번
  spec             text,                   -- 규격
  plan_qty         numeric,                -- 계획수량
  actual_qty       numeric,                -- 실적수량
  achievement_rate numeric,                -- 달성률 (1 = 100%)
  achieved         boolean     not null,   -- 판정 = '달성'
  fail_type        text,                   -- 미달유형
  fail_reason      text,                   -- 미달사유
  improvement      text,                   -- 개선방법
  verdict          text        not null,   -- 판정 ('달성' | '미달')
  created_at       timestamptz not null default now()
);

create index if not exists production_plan_records_record_date_idx
  on public.production_plan_records (record_date);

alter table public.production_plan_records enable row level security;

drop policy if exists "authenticated can read plan records"
  on public.production_plan_records;
create policy "authenticated can read plan records"
  on public.production_plan_records
  for select to authenticated using (true);

drop policy if exists "authenticated can insert plan records"
  on public.production_plan_records;
create policy "authenticated can insert plan records"
  on public.production_plan_records
  for insert to authenticated with check (true);

drop policy if exists "authenticated can delete plan records"
  on public.production_plan_records;
create policy "authenticated can delete plan records"
  on public.production_plan_records
  for delete to authenticated using (true);
