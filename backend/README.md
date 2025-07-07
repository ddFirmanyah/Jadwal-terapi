# Backend Klinik Hanenda

Backend API untuk Aplikasi Klinik Hanenda dibangun dengan Node.js, Express, dan Prisma.

## Fitur
- RESTful API untuk manajemen pasien
- Autentikasi dan otorisasi
- Validasi input
- Dokumentasi API dengan Swagger

## Persyaratan

- Node.js 16+
- PostgreSQL 12+ atau MySQL 8.0+
- npm atau yarn

## Instalasi

1. Install dependensi:
   ```bash
   npm install
   ```

2. Buat file `.env` dari contoh:
   ```bash
   cp .env.example .env
   ```

3. Konfigurasi koneksi database di `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/klinik_hanenda?schema=public"
   JWT_SECRET=your_jwt_secret_here
   PORT=3001
   NODE_ENV=development
   ```

4. Jalankan migrasi database:
   ```bash
   npx prisma migrate dev
   ```

5. Jalankan server development:
   ```bash
   npm run dev
   ```

## Struktur Folder

- `src/`
  - `controllers/` - Controller untuk menangani request
  - `middlewares/` - Middleware Express
  - `models/` - Model database (Prisma)
  - `routes/` - Definisi route
  - `services/` - Logika bisnis
  - `utils/` - Fungsi utilitas
  - `app.ts` - Konfigurasi Express
  - `server.ts` - Entry point aplikasi
- `prisma/`
  - `migrations/` - File migrasi database
  - `schema.prisma` - Skema database

## API Documentation

Setelah menjalankan server, dokumentasi API tersedia di:
- Swagger UI: `http://localhost:3001/api-docs`
- JSON Spec: `http://localhost:3001/api-docs.json`

## Testing

```bash
# Jalankan test
npm test

# Jalankan test dengan coverage
npm run test:coverage
```

## Deployment

1. Build aplikasi:
   ```bash
   npm run build
   ```

2. Jalankan migrasi produksi:
   ```bash
   npx prisma migrate deploy
   ```

3. Jalankan dengan PM2:
   ```bash
   pm2 start dist/server.js --name "klinik-hanenda-api"
   ```

## Variabel Lingkungan

- `PORT` - Port untuk menjalankan server (default: 3001)
- `DATABASE_URL` - URL koneksi database
- `JWT_SECRET` - Secret key untuk JWT
- `NODE_ENV` - Environment (development/production)
