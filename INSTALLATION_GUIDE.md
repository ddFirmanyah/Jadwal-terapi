# Panduan Instalasi Database MySQL untuk Klinik Hanenda

## 📋 Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Node.js (versi 16 atau lebih baru)
- MySQL Server (versi 8.0 atau lebih baru)
- Git (opsional)

## 🔧 Langkah 1: Instalasi MySQL

### Windows:
1. Download MySQL Installer dari [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Jalankan installer dan pilih "Developer Default"
3. Ikuti wizard instalasi
4. Catat username dan password yang Anda buat (biasanya username: `root`)

### macOS:
```bash
# Menggunakan Homebrew
brew install mysql
brew services start mysql

# Set password untuk root
mysql_secure_installation
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

## 🗄️ Langkah 2: Setup Database

### 2.1 Login ke MySQL
```bash
mysql -u root -p
```
Masukkan password yang Anda buat saat instalasi.

### 2.2 Buat Database dan User
```sql
-- Buat database
CREATE DATABASE klinik_hanenda;

-- Buat user khusus untuk aplikasi (opsional, untuk keamanan)
CREATE USER 'klinik_user'@'localhost' IDENTIFIED BY 'klinik_password123';
GRANT ALL PRIVILEGES ON klinik_hanenda.* TO 'klinik_user'@'localhost';
FLUSH PRIVILEGES;

-- Keluar dari MySQL
EXIT;
```

### 2.3 Import Schema Database
```bash
# Dari direktori root project
mysql -u root -p klinik_hanenda < server/database/schema.sql
```

## ⚙️ Langkah 3: Konfigurasi Environment

### 3.1 Setup File .env
File `.env` sudah dibuat dengan konfigurasi default:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=klinik_hanenda
PORT=3001
NODE_ENV=development
```

### 3.2 Update Konfigurasi Database
Edit file `.env` sesuai dengan setup MySQL Anda:
```env
DB_HOST=localhost
DB_USER=root                    # atau 'klinik_user' jika Anda membuat user khusus
DB_PASSWORD=your_mysql_password # password MySQL Anda
DB_NAME=klinik_hanenda
PORT=3001
NODE_ENV=development
```

## 🚀 Langkah 4: Instalasi Dependencies

```bash
# Install semua dependencies
npm install
```

## ▶️ Langkah 5: Menjalankan Aplikasi

### 5.1 Jalankan Development Server
```bash
# Menjalankan frontend dan backend secara bersamaan
npm run dev
```

Atau jalankan secara terpisah:
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

### 5.2 Akses Aplikasi
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔍 Langkah 6: Verifikasi Instalasi

### 6.1 Cek Koneksi Database
Buka browser dan akses: http://localhost:3001/api/health

Anda harus melihat response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 6.2 Cek Data Sample
- **Therapists**: http://localhost:3001/api/therapists
- **Patients**: http://localhost:3001/api/patients  
- **Appointments**: http://localhost:3001/api/appointments

### 6.3 Test Frontend
1. Buka http://localhost:5173
2. Pastikan data terapis, pasien, dan jadwal muncul
3. Coba buat appointment baru
4. Coba tambah pasien baru

## 🛠️ Troubleshooting

### Error: "Access denied for user"
```bash
# Reset password MySQL
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

### Error: "Database connection failed"
1. Pastikan MySQL service berjalan:
   ```bash
   # Windows
   net start mysql
   
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. Cek konfigurasi di file `.env`
3. Pastikan database `klinik_hanenda` sudah dibuat

### Error: "Port 3001 already in use"
```bash
# Cari process yang menggunakan port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Error: "Cannot connect to frontend"
1. Pastikan port 5173 tidak digunakan aplikasi lain
2. Restart development server
3. Clear browser cache

## 📊 Struktur Database

### Tables:
1. **therapists** - Data terapis dan jadwal ketersediaan
2. **patients** - Data pasien dan informasi rujukan BPJS
3. **appointments** - Data jadwal terapi

### Sample Data:
- 12 Terapis (4 per spesialisasi)
- 5 Pasien sample (regular dan BPJS)
- Beberapa appointment sample

## 🔐 Keamanan

### Untuk Production:
1. Ganti password default
2. Buat user database khusus dengan privileges terbatas
3. Gunakan environment variables yang aman
4. Enable SSL untuk koneksi database
5. Backup database secara berkala

## 📝 API Endpoints

### Therapists:
- `GET /api/therapists` - Get all therapists
- `POST /api/therapists` - Create therapist
- `PUT /api/therapists/:id` - Update therapist
- `DELETE /api/therapists/:id` - Delete therapist

### Patients:
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:mrn` - Update patient
- `DELETE /api/patients/:mrn` - Delete patient

### Appointments:
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

## 🎯 Fitur yang Sudah Terintegrasi

✅ **CRUD Operations**:
- Create, Read, Update, Delete untuk semua entitas
- Real-time data synchronization
- Error handling dan loading states

✅ **Database Features**:
- Foreign key constraints
- JSON data types untuk availability dan referral data
- Indexes untuk performa optimal
- Sample data untuk testing

✅ **Frontend Integration**:
- Custom hooks untuk API calls
- Loading spinners
- Error messages
- Automatic data refresh

## 📞 Support

Jika mengalami masalah:
1. Cek console browser untuk error frontend
2. Cek terminal server untuk error backend  
3. Cek MySQL error logs
4. Pastikan semua dependencies terinstall dengan benar

Selamat! Aplikasi Klinik Hanenda dengan database MySQL sudah siap digunakan! 🎉