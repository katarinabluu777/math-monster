-- =====================================================
-- 수학 몬스터 대모험: profiles 테이블 전체 설정
-- 새 사용자: 별 0개, 레벨 1
-- level 51 = 레벨 50까지 모두 완료
-- =====================================================


-- 1. profiles 테이블 생성
create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text,

  stars integer not null default 0,

  level integer not null default 1,

  created_at timestamp with time zone
    not null default now()
);


-- 2. 기존 테이블의 기본값도 실제 게임용으로 변경
alter table public.profiles
alter column stars set default 0;

alter table public.profiles
alter column level set default 1;

alter table public.profiles
alter column created_at set default now();


-- 3. 기존 데이터에 null이 있다면 정상 값으로 수정
update public.profiles
set stars = 0
where stars is null;

update public.profiles
set level = 1
where level is null;


-- 4. 잘못된 범위의 레벨 데이터 정리
-- level 1~50 = 현재 진행 레벨
-- level 51 = 모든 레벨 완료
update public.profiles
set level = 1
where level < 1;

update public.profiles
set level = 51
where level > 51;

update public.profiles
set stars = 0
where stars < 0;


-- 5. 컬럼을 필수 값으로 설정
alter table public.profiles
alter column stars set not null;

alter table public.profiles
alter column level set not null;

alter table public.profiles
alter column created_at set not null;


-- 6. 기존 체크 조건 삭제
alter table public.profiles
drop constraint if exists profiles_stars_check;

alter table public.profiles
drop constraint if exists profiles_level_check;


-- 7. 별과 레벨 범위 제한
alter table public.profiles
add constraint profiles_stars_check
check (stars >= 0);

alter table public.profiles
add constraint profiles_level_check
check (level >= 1 and level <= 51);


-- 8. Row Level Security 활성화
alter table public.profiles
enable row level security;


-- 9. 기존 보안 정책 삭제
drop policy if exists
  "Users can read own profile"
on public.profiles;

drop policy if exists
  "Users can insert own profile"
on public.profiles;

drop policy if exists
  "Users can update own profile"
on public.profiles;


-- 10. 자기 프로필만 읽을 수 있음
create policy
  "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);


-- 11. 자기 프로필만 생성할 수 있음
create policy
  "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
);


-- 12. 자기 프로필만 수정할 수 있음
create policy
  "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);


-- 13. 회원가입 시 프로필 자동 생성 함수
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    stars,
    level
  )
  values (
    new.id,
    new.email,
    0,
    1
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- 14. 기존 회원가입 트리거 삭제 후 다시 생성
drop trigger if exists
  on_auth_user_created
on auth.users;

create trigger
  on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();


-- 15. Authentication에는 있지만 profiles가 없는 기존 사용자 생성
-- 이미 프로필이 있는 사용자의 레벨과 별은 변경하지 않습니다.
insert into public.profiles (
  id,
  email,
  stars,
  level
)
select
  users.id,
  users.email,
  0,
  1
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;


-- 16. 기존 프로필의 이메일이 비어 있다면 Authentication 이메일로 채우기
update public.profiles as profiles
set email = users.email
from auth.users as users
where profiles.id = users.id
  and (
    profiles.email is null
    or profiles.email = ''
  );