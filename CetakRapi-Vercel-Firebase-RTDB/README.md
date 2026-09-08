# CetakRapi — Vercel + Firebase

Website pemesanan percetakan berbahasa Indonesia dengan formulir pelanggan, penyimpanan data pesanan dan seluruh lampiran di Firebase Realtime Database, serta panel admin yang dilindungi Firebase Authentication. Lampiran PNG/JPG/JPEG/PDF/DOCX/XLSX disimpan sebagai Base64; Firebase Storage tidak digunakan.

## Teknologi

- Next.js App Router + React + TypeScript
- Vercel untuk hosting aplikasi
- Firebase Authentication untuk login admin
- Firebase Realtime Database untuk pesanan dan pengaturan
- Firebase Admin SDK pada route server Next.js

File pelanggan tidak melewati Vercel Functions saat diunggah. Browser memperoleh izin Firebase sementara dan menulis Base64 ke lokasi Realtime Database yang sudah ditentukan. Server lalu memeriksa metadata, ukuran, tipe MIME, Base64, dan signature awal file sebelum membuat pesanan. Isi file dipisahkan pada jalur `orderFiles/` agar daftar `orders/` tetap ringan.

## 1. Persiapan Firebase

Gunakan project Firebase `print-nando` yang sudah tercantum di `.firebaserc`.

1. Buka Firebase Console dan pilih project tersebut.
2. Di **Authentication > Sign-in method**, aktifkan provider **Email/Password**.
3. Di **Authentication > Users**, buat satu akun admin. Email akun ini harus sama persis dengan nilai `ADMIN_EMAIL` nanti.
4. Aktifkan **Realtime Database** di region yang sesuai dengan URL database.
5. Di **Project settings > Service accounts**, buat private key baru lalu unduh JSON service account.

Jangan masukkan file JSON service account ke repository atau ZIP. Hanya salin nilai `client_email` dan `private_key` ke environment variables.

## 2. Pasang Firebase Rules

Rules bawaan paket ini menolak akses umum ke Realtime Database. Hanya token upload sementara yang dapat membuat satu file Base64 pada lokasi khusus. Pelanggan tidak dapat membaca, mengubah, atau menghapus file tersebut secara langsung.

```bash
npm install -g firebase-tools
firebase login
firebase use print-nando
firebase deploy --only database
```

Jika project Firebase berbeda, ubah project di `.firebaserc` dan semua variabel Firebase pada `.env.example`.

## 3. Environment variables

Salin `.env.example` menjadi `.env.local` untuk pengembangan lokal. Isi bagian rahasia berikut:

- `FIREBASE_CLIENT_EMAIL`: nilai `client_email` dari service-account JSON.
- `FIREBASE_PRIVATE_KEY`: nilai lengkap `private_key`, termasuk `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`. Di Vercel, tempel sebagai satu nilai; format baris baru asli atau karakter `\n` sama-sama didukung kode.
- `ADMIN_EMAIL`: email akun admin yang dibuat di Firebase Authentication.
- `UPLOAD_SIGNING_SECRET`: string acak minimal 32 karakter.

Buat rahasia upload dengan Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Semua variabel `NEXT_PUBLIC_FIREBASE_*` merupakan konfigurasi aplikasi web Firebase dan memang dikirim ke browser. Variabel service account dan `UPLOAD_SIGNING_SECRET` adalah rahasia dan tidak boleh memakai awalan `NEXT_PUBLIC_`.

## 4. Jalankan secara lokal

Gunakan Node.js 22 atau yang lebih baru.

```bash
pnpm install
pnpm dev
```

Buka:

- Website pelanggan: `http://localhost:3000`
- Login admin: `http://localhost:3000/admin`

Login admin menggunakan email dan password akun yang dibuat di Firebase Authentication. Tidak ada kode aktivasi dan tidak ada akun admin lokal bawaan.

## 5. Upload ke Vercel

### Pilihan A — GitHub

1. Ekstrak ZIP dan upload seluruh folder ke repository GitHub baru.
2. Di Vercel pilih **Add New > Project**, lalu import repository tersebut.
3. Framework akan terdeteksi sebagai Next.js; biarkan build command `next build`.
4. Buka **Project Settings > Environment Variables** dan tambahkan semua variabel dari `.env.example` untuk Production, Preview, dan Development sesuai kebutuhan.
5. Deploy. Jika environment variables baru ditambahkan setelah deploy, lakukan redeploy.

### Pilihan B — Vercel CLI

```bash
pnpm install
pnpm dlx vercel login
pnpm dlx vercel
```

Tambahkan environment variables melalui dashboard Vercel atau perintah `vercel env add`, lalu deploy produksi:

```bash
pnpm dlx vercel --prod
```

## Pengaturan admin

Setelah login, admin dapat:

- melihat daftar dan detail pesanan;
- mengunduh lampiran yang direkonstruksi dari data Base64;
- mengubah status pesanan;
- mengaktifkan atau menonaktifkan kertas A4 dan F4;
- mengatur harga kertas, harga hitam-putih/berwarna, ukuran maksimum, format file, nama bisnis, dan WhatsApp.

Pengaturan awal dipakai sampai admin menyimpan pengaturan pertama kali. Harga perkiraan dihitung dari `(harga kertas + harga jenis cetak) × jumlah halaman × jumlah salinan`.

## Keamanan dan operasional

- Session admin memakai Firebase session cookie `HttpOnly`, `Secure` di produksi, dan `SameSite=Strict`.
- Hanya email pada `ADMIN_EMAIL` yang diterima sebagai admin meskipun ada user Firebase lain.
- Route perubahan data memeriksa same-origin request.
- Aplikasi mengirim header keamanan dasar untuk mencegah MIME sniffing, framing, dan akses browser yang tidak diperlukan.
- Upload dibatasi berdasarkan ekstensi, MIME, ukuran, metadata, dan signature awal file.
- Semua format file dibatasi maksimal 7 MB karena batas string Base64 Realtime Database; Base64 berukuran sekitar sepertiga lebih besar daripada file biner.
- Download file memerlukan session admin yang masih valid.
- `database.rules.json` harus dipasang sebelum website dibuka untuk umum.
- Aktifkan HTTPS; Vercel menyediakan HTTPS otomatis pada domain Vercel dan custom domain.
- Atur backup Realtime Database dan retensi file sesuai kebutuhan bisnis.
- Untuk trafik publik yang besar, tambahkan Firebase App Check dan rate limiting pada endpoint persiapan upload.

Jangan commit `.env.local`, service-account JSON, private key, atau hasil ekspor data pelanggan. Paket distribusi ini hanya berisi source code, konfigurasi web Firebase yang bersifat publik, contoh environment variables tanpa rahasia, dan database kosong. Nama, WhatsApp, detail cetak, catatan, status, metadata file, pengaturan, serta Base64 semua lampiran berada di Realtime Database. Firebase Storage tidak digunakan oleh aplikasi.

## Struktur penting

- `app/` — halaman dan API routes Next.js.
- `components/` — formulir pelanggan dan antarmuka admin.
- `lib/firebase/` — konfigurasi Firebase client dan Admin SDK.
- `database.rules.json` — rules Realtime Database.
- `.env.example` — daftar environment variables yang diperlukan.

## Pemeriksaan sebelum produksi

```bash
pnpm lint
pnpm build
```

Setelah deploy, uji satu pesanan dari awal sampai file dapat diunduh oleh admin, lalu hapus data uji dari Firebase Console.
