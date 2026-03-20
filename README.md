# Vue 3 + TypeScript + Supabase + Vercel (Template)

Template skeleton cho project Vue 3 (Vite) + TypeScript + Supabase Auth + deploy Vercel.

## 1) Setup env

- Copy `.env.example` -> `.env`
- Điền:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 2) Run local

```bash
npm install
npm run dev
```

## 2.1) Supabase Auth lưu ý

- Nếu Supabase bật email confirmation, flow `Sign up` có thể không có session ngay; UI sẽ hiện nhắc “check email”.

## 3) Deploy Vercel

- Import repo lên Vercel
- Set Build Command: `npm run build`
- Set Output Directory: `dist`
- Add Environment Variables (Production):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADSENSE_CLIENT`
  - `VITE_ADSENSE_SLOT_FOOTER`
  - `VITE_ADSENSE_ENABLED`
  - `VITE_ADSENSE_AUTO_ADS`

`vercel.json` đã cấu hình rewrite để Vue Router (SPA) hoạt động trên mọi route.

## 3.1) Google AdSense

- App đã có sẵn fixed bottom ad bar qua component `src/components/GoogleAdBar.vue`.
- Điền env:
  - `VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx`
  - `VITE_ADSENSE_SLOT_FOOTER=1234567890`
  - `VITE_ADSENSE_ENABLED=true`
  - `VITE_ADSENSE_AUTO_ADS=true`
- Nếu muốn fixed ad do Google quản lý chính thức, vào AdSense:
  - `Ads` -> site của bạn -> `Overlay formats`
  - bật `Anchor ads`
  - chọn vị trí `Bottom only`


## 4) Migrations (Supabase)

Migrations SQL nằm ở `supabase/migrations`.

### Cách 1: Supabase CLI (khuyến nghị)

```bash
npm run db:login
supabase link --project-ref <PROJECT_REF>
npm run db:push
```

### Cách 2: Chạy trực tiếp trên PostgreSQL (psql/SQL Editor)

- Lấy connection string của database production (Supabase Dashboard → Project Settings → Database).
- Run file migration: `supabase/migrations/20260316170000_init.sql`.
