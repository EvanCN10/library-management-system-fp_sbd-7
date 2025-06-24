# Library Management System

Sistem manajemen perpustakaan yang dibangun dengan Node.js, Express, MySQL, dan MongoDB.

## Fitur Utama

### Backend Features
- **Autentikasi & Autorisasi**: Login, register, JWT tokens, role-based access
- **Manajemen Buku**: CRUD buku, kategori, pencarian advanced
- **Sistem Peminjaman**: Pinjam buku, kembalikan buku, tracking overdue
- **Manajemen User**: Profile management, user roles (admin, librarian, member)
- **Sistem Denda**: Otomatis hitung denda untuk keterlambatan
- **Laporan**: Dashboard, statistik, laporan peminjaman
- **Activity Logging**: Log semua aktivitas user di MongoDB
- **Search Analytics**: Tracking pencarian populer

### Database Architecture
**MySQL (Relational Data):**
- Users (data user terstruktur)
- Books (data buku)
- Categories (kategori buku)
- Borrowing Records (record peminjaman)
- Fines (data denda)

**MongoDB (Document-based):**
- Book Reviews (review dan rating buku)
- Activity Logs (log aktivitas user)
- Search Logs (log pencarian)
- Notifications (notifikasi)

## Instalasi dan Setup

### Prerequisites
- Node.js (v14 atau lebih baru)
- MySQL Server
- MongoDB Server
- npm atau yarn

### Langkah Instalasi

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Setup Environment Variables**
   \`\`\`env
   PORT=3000
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=library_management
   MONGODB_URI=mongodb://localhost:27017/library_management
   JWT_SECRET=your_jwt_secret_key_here
   \`\`\`

3. **Jalankan Aplikasi**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Akses Aplikasi**
   - Frontend: http://localhost:3000
   - API Base: http://localhost:3000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user

### Books
- `GET /api/books` - Get semua buku
- `POST /api/books` - Tambah buku baru (Admin/Librarian)
- `PUT /api/books/:id` - Update buku (Admin/Librarian)
- `DELETE /api/books/:id` - Hapus buku (Admin)

### Borrowing
- `POST /api/borrow/borrow` - Pinjam buku
- `POST /api/borrow/return` - Kembalikan buku
- `GET /api/borrow/history` - History peminjaman user

### Users
- `GET /api/users/profile` - Get profile user
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Ganti password

### Reports (Admin/Librarian)
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/borrowings` - Laporan peminjaman
- `GET /api/reports/overdue` - Laporan buku overdue

## License

MIT License - silakan gunakan untuk keperluan pembelajaran dan development.
