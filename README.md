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

Sau khi push migration role mới, bootstrap `master_admin` bằng seed function ở mục 6.1.

### Cách 2: Chạy trực tiếp trên PostgreSQL (psql/SQL Editor)

- Lấy connection string của database production (Supabase Dashboard → Project Settings → Database).
- Run file migration: `supabase/migrations/20260316170000_init.sql`.

## 5) Role model

- `user`: chỉ xem orders và thống kê, không CRUD
- `admin`: toàn quyền CRUD orders
- `master_admin`: toàn quyền CRUD orders + tạo admin con

Các route chính:

- `/user/dashboard`
- `/user/orders`
- `/admin/dashboard`
- `/admin/orders`
- `/admin/accounts`

`/dashboard` sẽ tự redirect theo role hiện tại.

## 6) Edge Function tạo admin con

Function đã được scaffold tại:

- `supabase/functions/create-admin-account/index.ts`

Deploy function:

```bash
supabase functions deploy create-admin-account
```

Function này dùng `SUPABASE_SERVICE_ROLE_KEY` của project trong môi trường Supabase Functions và chỉ cho phép caller có role `master_admin` tạo `admin` con.

## 6.1) Seed master admin đầu tiên

Function seed nằm ở:

- `supabase/functions/seed-master-admin/index.ts`

Deploy function:

```bash
supabase functions deploy seed-master-admin
```

Set secrets cho function:

```bash
supabase secrets set MASTER_ADMIN_SETUP_TOKEN=<mot-token-bi-mat>
supabase secrets set MASTER_ADMIN_EMAIL=<email-admin-dau-tien>
supabase secrets set MASTER_ADMIN_PASSWORD=<password-admin-dau-tien>
supabase secrets set MASTER_ADMIN_FULL_NAME="Master Admin"
supabase secrets set MASTER_ADMIN_USERNAME=master-admin
```

Gọi function để seed hoặc nâng cấp account thành `master_admin`:

```bash
curl -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/seed-master-admin" \
  -H "x-setup-token: <mot-token-bi-mat>"
```

Behavior:

- nếu email chưa tồn tại: tạo account mới với role `master_admin`
- nếu email đã tồn tại: update account đó thành `master_admin`

Sau khi seed xong, đăng nhập bằng email/password đã set ở trên tại `/login`. App sẽ tự đưa bạn vào `/admin/dashboard`.
