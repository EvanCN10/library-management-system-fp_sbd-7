# Library Management System (LMS7)

Sistem Manajemen Perpustakaan dengan Frontend dan Backend yang terintegrasi menggunakan MySQL dan MongoDB.

## 🚀 Cara Menjalankan Sistem

### Prerequisites
Pastikan Anda telah menginstall:
- Node.js (v14 atau lebih baru)
- MySQL Server
- MongoDB Server
- Git

### 1. Setup Backend

#### Install Dependencies
```bash
cd backend
npm install
```

#### Konfigurasi Database
1. **MySQL Setup:**
   - Buat database baru bernama `lms7`
   - Update file `.env` dengan kredensial MySQL Anda:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=lms7
   ```

2. **MongoDB Setup:**
   - Pastikan MongoDB server berjalan
   - Update file `.env` jika perlu:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=lms7
   ```

#### Inisialisasi Database
```bash
npm run setup
```
Perintah ini akan:
- Membuat tabel-tabel MySQL yang diperlukan
- Membuat koleksi MongoDB
- Mengisi data sample

#### Menjalankan Backend Server
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3001`

### 2. Setup Frontend

#### Struktur File
Pastikan struktur file frontend seperti ini:
```
/
├── index.html
├── login.html
├── css/
│   └── styles.css
└── js/
    ├── api.js
    ├── app.js
    └── login.js
```

#### Menjalankan Frontend
1. **Menggunakan Live Server (Recommended):**
   - Install Live Server extension di VS Code
   - Klik kanan pada `index.html` → "Open with Live Server"

2. **Menggunakan Python HTTP Server:**
   ```bash
   python -m http.server 8000
   ```
   Akses di `http://localhost:8000`

3. **Menggunakan Node.js HTTP Server:**
   ```bash
   npx http-server -p 8000
   ```

### 3. Akses Sistem

1. **Login Page:** `http://localhost:8000/login.html`
2. **Dashboard:** `http://localhost:8000/index.html`

#### Kredensial Login
- **Pustakawan:** Nama bebas, pilih role "Librarian"
- **Pengguna:** Nama bebas, pilih role "User"

## 🔧 Konfigurasi API

File `js/api.js` berisi konfigurasi koneksi ke backend:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

Pastikan URL ini sesuai dengan port backend Anda.

## 📊 Fitur Sistem

### Dashboard
- Statistik real-time (total buku, anggota, peminjaman, keterlambatan)
- Aktivitas terbaru dari MongoDB

### Manajemen Buku
- CRUD operations (Create, Read, Update, Delete)
- Pencarian dan filter berdasarkan kategori/tahun
- Tracking stok dan ketersediaan

### Manajemen Anggota
- Registrasi dan manajemen anggota
- Status aktif/non-aktif
- Pencarian anggota

### Sirkulasi
- Peminjaman buku dengan validasi stok
- Pengembalian buku dengan perhitungan denda
- Tracking status peminjaman

### Reservasi
- Sistem reservasi buku
- Manajemen status reservasi

## 🗄️ Struktur Database

### MySQL Tables
- `books` - Data buku dan stok
- `members` - Data anggota perpustakaan
- `loans` - Transaksi peminjaman
- `reservations` - Data reservasi

### MongoDB Collections
- `activities` - Log aktivitas sistem
- `logs` - Audit trail

## 🔍 Troubleshooting

### Backend Issues
1. **Database Connection Error:**
   - Pastikan MySQL dan MongoDB server berjalan
   - Periksa kredensial di file `.env`

2. **Port Already in Use:**
   - Ubah PORT di `.env` file
   - Atau hentikan proses yang menggunakan port 3001

### Frontend Issues
1. **CORS Error:**
   - Pastikan backend berjalan dengan CORS enabled
   - Gunakan Live Server atau HTTP server, jangan buka file HTML langsung

2. **API Connection Failed:**
   - Periksa URL di `js/api.js`
   - Pastikan backend server berjalan

### Common Solutions
```bash
# Restart backend
cd backend
npm run dev

# Check backend health
curl http://localhost:3001/api/health

# Reset database
npm run setup
```

## 📝 Development Notes

### Adding New Features
1. **Backend:** Tambahkan route baru di folder `backend/routes/`
2. **Frontend:** Update `js/api.js` dan `js/app.js`

### Database Schema Changes
1. Update `backend/setup.js`
2. Run `npm run setup` untuk apply changes

### Environment Variables
Semua konfigurasi ada di `backend/.env`:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=lms7
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=lms7
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
```

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` di `.env`
2. Update database credentials
3. Deploy ke platform seperti Heroku, DigitalOcean, atau AWS

### Frontend
1. Update `API_BASE_URL` di `js/api.js` ke production URL
2. Deploy ke static hosting seperti Netlify, Vercel, atau GitHub Pages

## 📞 Support

Jika mengalami masalah:
1. Periksa console browser untuk error JavaScript
2. Periksa terminal backend untuk error server
3. Pastikan semua dependencies terinstall
4. Restart kedua server (frontend dan backend)