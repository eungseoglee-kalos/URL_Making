-- 사용자별로 열람 가능한 대시보드를 관리자 페이지에서 지정할 수 있게 합니다.
--
-- Supabase SQL Editor 에서 한 번 실행하면 됩니다. 다른 파일들과 마찬가지로
-- 멱등이라 여러 번 실행해도 안전합니다.

-- null = 제한 없음(전부 열람 가능, 기존 사용자 전부의 기본값이라 이번
-- 변경으로 아무도 갑자기 화면을 잃지 않습니다). 배열이면 그 href 목록만
-- 열람 가능합니다 (예: '{"/coating","/mesh"}').
alter table public.profiles
  add column if not exists allowed_dashboards text[];

-- 쓰기는 harden_rls.sql 에서 이미 authenticated 의 profiles UPDATE 를 전부
-- 회수해뒀으므로 별도 정책이 필요 없습니다 -- app/admin/actions.ts 의
-- setDashboardAccess() 가 서비스 롤 키로만 이 컬럼을 씁니다.
