-- 진공증착 생산실적 대시보드(/vm-coil)용 테이블.
-- Supabase 대시보드의 SQL Editor에서 한 번 실행하면 됩니다.
--
-- RLS 정책은 다른 데이터 테이블과 동일합니다: 로그인한 사용자(authenticated)만
-- 읽고 쓸 수 있고 anon 키로는 아무것도 보이지 않습니다.
--
-- vm_backlog 는 "당월 수주 잔량" 스냅샷입니다. 날짜 컬럼이 없고 업로드할
-- 때마다 통째로 갈립니다.

create table if not exists public.vm_shipments (
  id            bigint generated always as identity primary key,
  ship_date     date        not null,   -- 출고일자
  part_number   text        not null,   -- 품목
  category      text        not null,   -- 구분 ('증착코일' | '증착재')
  maker         text        not null,   -- 제조사 ('KBM' | '외주')
  spec          text,                   -- 규격
  quantity      numeric,                -- 출하수량
  unit_weight_g numeric,                -- 단중(g)
  weight_kg     numeric     not null,   -- 출하중량(Kg)
  created_at    timestamptz not null default now()
);

create index if not exists vm_shipments_ship_date_idx
  on public.vm_shipments (ship_date);

create table if not exists public.vm_backlog (
  id            bigint generated always as identity primary key,
  part_number   text        not null,   -- 품목
  category      text        not null,   -- 구분
  spec          text,                   -- 규격
  quantity      numeric,                -- 출하수량
  unit_weight_g numeric,                -- 단중
  weight_kg     numeric     not null,   -- 출하중량
  created_at    timestamptz not null default now()
);

alter table public.vm_shipments enable row level security;
alter table public.vm_backlog   enable row level security;

drop policy if exists "authenticated can read vm shipments"
  on public.vm_shipments;
create policy "authenticated can read vm shipments"
  on public.vm_shipments for select to authenticated using (true);

drop policy if exists "authenticated can insert vm shipments"
  on public.vm_shipments;
create policy "authenticated can insert vm shipments"
  on public.vm_shipments for insert to authenticated with check (true);

drop policy if exists "authenticated can delete vm shipments"
  on public.vm_shipments;
create policy "authenticated can delete vm shipments"
  on public.vm_shipments for delete to authenticated using (true);

drop policy if exists "authenticated can read vm backlog"
  on public.vm_backlog;
create policy "authenticated can read vm backlog"
  on public.vm_backlog for select to authenticated using (true);

drop policy if exists "authenticated can insert vm backlog"
  on public.vm_backlog;
create policy "authenticated can insert vm backlog"
  on public.vm_backlog for insert to authenticated with check (true);

drop policy if exists "authenticated can delete vm backlog"
  on public.vm_backlog;
create policy "authenticated can delete vm backlog"
  on public.vm_backlog for delete to authenticated using (true);
