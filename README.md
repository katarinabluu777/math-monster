# 수학 몬스터 대모험 로그인 페이지

Vercel + GitHub + Supabase 배포용 프로젝트입니다.

## 1. 설치

```bash
npm install
```

## 2. 환경변수 만들기

`.env.example` 파일을 복사해서 `.env` 파일을 만드세요.

```bash
cp .env.example .env
```

`.env` 안에 Supabase 값을 넣으세요.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
```

## 3. 실행

```bash
npm run dev
```

## 4. Supabase SQL

Supabase SQL Editor에 `supabase.sql` 내용을 붙여넣고 실행하세요.

## 5. Vercel 환경변수

Vercel Project Settings → Environment Variables에 아래 2개를 추가하세요.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 6. Vercel 빌드 설정

Framework Preset: Vite  
Build Command: npm run build  
Output Directory: dist
