# AsiaCommerce SSO — Identity Provider

Aplikasi login terpusat & sumber identitas tunggal untuk semua aplikasi AsiaCommerce
(`aset`, `hris`, dst) di bawah `*.asiacommerce.net`.

## Mekanisme

**Shared-cookie SSO.** SSO app (Auth.js v5, JWT strategy) menaruh cookie sesi di
`domain=.asiacommerce.net` dengan `AUTH_SECRET` bersama. Aplikasi lain **membaca & memverifikasi
cookie JWT yang sama** (secret + nama cookie + versi Auth.js identik) → login sekali, berlaku di
semua subdomain. Tidak perlu server OIDC.

## Data

- **User** — inti auth (email, password, isSuperAdmin, companyId).
- **UserProfile** — profil personal + kepegawaian (1‑1).
- **Application** — aplikasi terhubung (`ASET`, `HRIS`, ...).
- **UserAppRole** — akses & role user **per aplikasi** (mis. `ASET → ASSET_MANAGER`).

JWT membawa klaim: `id`, `email`, `name`, `image`, `apps` (map appKey→role),
`isSuperAdmin`, `companyId`.

## Provisioning (sekali)

1. **Neon**: buat project Identity baru → `DATABASE_URL`.
2. **Vercel**: buat project baru dari repo ini → domain `sso.asiacommerce.net`.
3. **Env** (Vercel, Production):
   ```
   DATABASE_URL=postgresql://...neon.../neondb?sslmode=require
   AUTH_SECRET=<generate: openssl rand -base64 32>   # SAMAKAN di semua app
   AUTH_URL=https://sso.asiacommerce.net
   AUTH_TRUST_HOST=true
   COOKIE_DOMAIN=.asiacommerce.net
   ALLOWED_CALLBACK_HOSTS=asiacommerce.net
   ```
4. Deploy — build menjalankan `prisma db push` otomatis (buat tabel di Neon).
5. Seed admin awal: dari jaringan yang bisa menjangkau Neon → `npm run db:seed`
   (atau daftar via `/register`). Default: `admin@asiacommerce.net` / `password123`.

## Integrasi Aplikasi (ASET / HRIS)

Untuk tiap app yang ingin memakai SSO:

1. **Env app** (samakan dengan SSO):
   ```
   AUTH_SECRET=<sama persis dengan SSO>
   COOKIE_DOMAIN=.asiacommerce.net
   SSO_URL=https://sso.asiacommerce.net
   SSO_ENABLED=true
   ```
2. **Auth.js app**: set cookie `sessionToken` dengan `name` default Auth.js + `domain=COOKIE_DOMAIN`,
   `trustHost:true`. Ini membuat `auth()` app membaca cookie SSO.
3. **Middleware app**: jika belum login → redirect ke
   `${SSO_URL}/login?callbackUrl=${encodeURIComponent(currentUrl)}`.
4. **Logout**: arahkan ke `${SSO_URL}/logout` (menghapus cookie `.asiacommerce.net` → logout global).
5. **Role**: baca role app dari klaim `session.user.apps["ASET"]` (bukan tabel lokal).
6. **Data user lokal**: app menyimpan referensi `userId` (mirror ringkas id/email/name) agar relasi
   domainnya valid; profil lengkap dikelola di SSO.
7. **Daftarkan app** di Identity DB: tambahkan baris `Application` (key unik, mis. `HRIS`) dan
   definisikan opsi role-nya di `src/lib/constants.ts → APP_ROLE_OPTIONS`.

## Menjalankan Lokal

```bash
npm install
# isi .env (DATABASE_URL Identity, AUTH_SECRET, COOKIE_DOMAIN kosong utk lokal)
npm run db:push
npm run db:seed
npm run dev   # default port 3000; jalankan di port berbeda dari app lain
```

## Script

| Script | Fungsi |
| ------ | ------ |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate && prisma db push && next build` |
| `npm run db:push` | Sinkron schema Identity DB |
| `npm run db:seed` | Seed admin + Application (ASET, HRIS) |

## Catatan Kompatibilitas

Shared-cookie mensyaratkan **versi next-auth yang sama**, **AUTH_SECRET sama**, dan **nama cookie
sama** di semua app. Repo ini & ASET sama-sama `next-auth@5.0.0-beta.32` + Next 16.
