# Frontend Klinik Hanenda

Aplikasi frontend untuk Klinik Hanenda dibangun dengan React + Vite + TypeScript.

## Fitur
- Daftar pasien dengan pencarian dan filter
- Manajemen data pasien
- Tampilan responsif untuk desktop dan mobile
- Integrasi dengan backend API

## Instalasi

1. Install dependensi:
   ```bash
   npm install
   ```

2. Buat file `.env` dari contoh:
   ```bash
   cp .env.example .env
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```

## Build untuk Produksi

```bash
npm run build
```

File hasil build akan tersedia di folder `dist/`.

## Variabel Lingkungan

- `VITE_API_URL`: URL ke backend API (contoh: `http://localhost:3001`)
- `VITE_APP_NAME`: Nama aplikasi (default: Klinik Hanenda)

## Struktur Folder

- `src/`
  - `components/` - Komponen UI yang dapat digunakan ulang
  - `pages/` - Halaman aplikasi
  - `services/` - Layanan untuk berkomunikasi dengan API
  - `types/` - Tipe TypeScript
  - `utils/` - Fungsi utilitas
  - `App.tsx` - Komponen utama
  - `main.tsx` - Entry point aplikasi

## Testing

```bash
# Jalankan test
npm test

# Jalankan test dengan coverage
npm run test:coverage
```
