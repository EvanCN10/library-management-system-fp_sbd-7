# library-management-system-fp_sbd-7

## Kelompok
Nama | NRP
--- | ---
Evan Christian Nainggolan | 5027241026
Oscaryavat Viryavan | 5027241053
Angga Firmansyah | 5027241062
Kaisar Hanif Pratama | 5027241029
Salomo | 5027221063 

## Daftar Isi
- [Kelompok](#kelompok)
- [Fitur-fitur](#fitur-fitur)

## Fitur-fitur
### 1. Manajemen Koleksi Buku
#### MySQL
* Tabel Book dengan kolom: book_id, title, isbn, publisher_id, publication_year, total_copies, available_copies
* Relasi many-to-many ke Author dan Category melalui tabel BookAuthor dan BookCategory.
* Gunakan JOIN untuk mengambil data lengkap buku + penulis + kategori.
#### MongoDB
* Koleksi books, dokumen contoh:
```js
{
  _id: ObjectId(),
  title: "Nama Buku",
  isbn: "123-456",
  publisher: { id: ObjectId(), name: "Penerbit X" },
  authors: [ { id: ObjectId(), name: "Penulis A" }, … ],
  categories: [ "Fiksi", "Sejarah" ],
  publication_year: 2020,
  total_copies: 5,
  available_copies: 3,
  description: "…"
}
```
* Embedding penulis & kategori mempermudah pembacaan tanpa JOIN.

### 2. Manajemen Pengguna
#### MySQL
* Tabel Member (member_id, name, email, phone, address, join_date, status).
* Tabel Librarian untuk admin/staff, terpisah dengan hak akses (role).
#### MongoDB
* Koleksi users dengan field:
```js
{
  _id, name, email, phone, address,
  join_date, status: "Active"/"Inactive",
  credentials: { username, password_hash },
  role: "Admin"/"Staff"/"Member"
}
```
* Satu koleksi untuk semua tipe user, cukup cari berdasarkan role.

### 3. Pencarian & Filter
#### MySQL
* FULLTEXT INDEX pada kolom title, description.
* Query:
```sql
SELECT * FROM Book
WHERE MATCH(title, description) AGAINST("kata kunci");
```
* Index tambahan pada publication_year, publisher_id.
#### MongoDB
* Buat Text Index:
```js
db.books.createIndex({ title: "text", description: "text" });
```
* Query pencarian:
```js
db.books.find({ $text: { $search: "kata kunci" } });
```
* Filter tambahan dengan $match di agregasi.

### 4. Sirkulasi (Peminjaman & Pengembalian)
#### MySQL
* Tabel Loan (loan_id, member_id, book_id, loan_date, due_date, return_date, status).
* Gunakan PROCEDURE:
```sql
-- 1) Kurangi stok (akan error kalau stok 0)
UPDATE Book
    SET available_copies = available_copies - 1
    WHERE book_id = p_book
      AND available_copies > 0;
  IF ROW_COUNT() = 0 THEN
    SIGNAL insufficient_stock
      SET MESSAGE_TEXT = 'Stok tidak mencukupi';
  END IF;

-- 2) Catat peminjaman
  INSERT INTO Loan(member_id, book_id, loan_date, due_date, status)
  VALUES(p_member, p_book, NOW(), p_due, 'Borrowed');
END;
```
#### MongoDB
* Koleksi loans, dokumen:
```js
{
  _id, member_id, book_id,
  loan_date, due_date,
  return_date: null,
  status: "Borrowed"
}
```
* Two-phase commit atau gunakan multi-document transaction (MongoDB 4.0+) untuk konsistensi update di books dan loans.

### 5. Reservasi / Hold
#### MySQL
* Tabel Reservation (reservation_id, member_id, book_id, reservation_date, status).
* Trigger atau procedure untuk notifikasi saat available_copies > 0.
#### MongoDB
* Koleksi reservations:
```js
{
  _id, member_id, book_id, reservation_date,
  status: "Pending"/"Fulfilled"/"Cancelled"
}
```
* Gunakan Change Streams untuk listen perubahan available_copies pada books dan kirim notifikasi real-time.

### 6. Manajemen Denda
#### MySQL
* Hitung di query atau stored procedure:
```sql
SELECT DATEDIFF(return_date, due_date) * tarif_per_hari AS denda
FROM Loan WHERE loan_id = …;
```
* Tabel tambahan Fines jika perlu riwayat pembayaran.
#### MongoDB
* Include field fine_per_day di loans, hitung denda saat baca dokumen:
```js
const daysLate = (returnDate - dueDate) / millisPerDay;
const fine = daysLate > 0 ? daysLate * loan.fine_per_day : 0;
```
* Simpan riwayat bayar di koleksi payments.

### 7. Laporan & Statistik
#### MySQL
* Views atau Stored Procedures:
```sql
CREATE VIEW popular_books AS
  SELECT b.title, COUNT(*) AS times_borrowed
  FROM Loan l JOIN Book b USING(book_id)
  GROUP BY b.book_id
  ORDER BY times_borrowed DESC;
```
#### MongoDB
* Aggregation Pipeline:
```js
db.loans.aggregate([
  { $group: { _id: "$book_id", timesBorrowed: { $sum: 1 } } },
  { $sort: { timesBorrowed: -1 } }
]);
```
### 8. Audit Trail & Logging
#### MySQL
* Tabel AuditLog untuk simpan operasi penting: user_id, action, timestamp, details.
* Bisa juga aktifkan binary logging untuk recovery.
#### MongoDB
* Koleksi audit_logs, setiap dokumen menyimpan:
```js
{ _id, user_id, action, timestamp, module, payload }
```
* Manfaatkan capped collections untuk performa insert log yang tinggi.
