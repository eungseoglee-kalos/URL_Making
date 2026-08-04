-- 히터코일 출하현황(/heater-coil), 메시 출하현황(/mesh) 대시보드용 테이블.
-- Supabase 대시보드의 SQL Editor에서 한 번 실행하면 됩니다.
--
-- RLS 정책은 coating_records / production_plan_records 와 동일합니다:
-- 로그인한 사용자(authenticated)만 읽고 쓸 수 있고 anon 키로는 아무것도
-- 보이지 않습니다. 관리자만 업로드하도록 막는 것은 app/admin/actions.ts 의
-- requireAdmin() 이 담당합니다.
--
-- vendor 컬럼에는 실제 업체명 외에 '예상'(미출하 수주분)이 들어옵니다.
-- 대시보드는 '예상'만 수주잔량으로, 나머지(ICT/KBM/PSNT/세정출하 등 실제
-- 출하 경로)는 전부 출하량으로 집계합니다.

create table if not exists public.heater_coil_shipments (
  id          bigint generated always as identity primary key,
  ship_date   date        not null,   -- 출하일
  part_number text        not null,   -- 품번
  spec        text,                   -- 규격
  serial_no   numeric,                -- NO
  item_id     text,                   -- ID
  quantity    numeric     not null,   -- 수량
  category    text        not null,   -- 구분 ('개발' | '양산')
  vendor      text        not null,   -- 코팅업체 (ICT/KBM/PSNT/세정출하/예상/-)
  created_at  timestamptz not null default now()
);

create index if not exists heater_coil_shipments_ship_date_idx
  on public.heater_coil_shipments (ship_date);

create table if not exists public.mesh_shipments (
  id          bigint generated always as identity primary key,
  ship_date   date        not null,   -- 출하일
  part_number text        not null,   -- 품번
  spec        text,                   -- 규격
  quantity    numeric     not null,   -- 수량
  category    text        not null,   -- 구분 ('개발' | '양산')
  vendor      text        not null,   -- 메시가공처 (동방금속/엠텍/신한/.../예상)
  created_at  timestamptz not null default now()
);

create index if not exists mesh_shipments_ship_date_idx
  on public.mesh_shipments (ship_date);

alter table public.heater_coil_shipments enable row level security;
alter table public.mesh_shipments        enable row level security;

drop policy if exists "authenticated can read heater coil"
  on public.heater_coil_shipments;
create policy "authenticated can read heater coil"
  on public.heater_coil_shipments for select to authenticated using (true);

drop policy if exists "authenticated can insert heater coil"
  on public.heater_coil_shipments;
create policy "authenticated can insert heater coil"
  on public.heater_coil_shipments for insert to authenticated with check (true);

drop policy if exists "authenticated can delete heater coil"
  on public.heater_coil_shipments;
create policy "authenticated can delete heater coil"
  on public.heater_coil_shipments for delete to authenticated using (true);

drop policy if exists "authenticated can read mesh"
  on public.mesh_shipments;
create policy "authenticated can read mesh"
  on public.mesh_shipments for select to authenticated using (true);

drop policy if exists "authenticated can insert mesh"
  on public.mesh_shipments;
create policy "authenticated can insert mesh"
  on public.mesh_shipments for insert to authenticated with check (true);

drop policy if exists "authenticated can delete mesh"
  on public.mesh_shipments;
create policy "authenticated can delete mesh"
  on public.mesh_shipments for delete to authenticated using (true);
