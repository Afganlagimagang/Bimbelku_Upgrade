# Pembersihan sebelum push dan pemindahan database

Pembersihan dilakukan pada 10 November 2026. Dokumen panduan konfigurasi,
penjelasan website, source aplikasi, migration, lockfile, dan tes otomatis
tetap dipertahankan.

## File lokal

316 file hasil pengujian/build preview/cache dan salinan controller lama
dipindahkan ke arsip di luar repository:

`C:\Users\ADVAN\Documents\Arsip-Bimbelku\persiapan-hosting-20261110-084409`

Arsip mempunyai manifest file serta backup database sebelum pembersihan.
Laporan PKL telah dipindahkan ke folder dokumen pribadi di luar proyek web.
Seluruh 430 file laporan beserta asetnya telah diverifikasi setelah dipindah.
Folder laporan tidak terdapat dalam proyek yang akan dikirim. `.env`, vendor, node_modules, dump SQL,
upload pengguna dan cache aplikasi juga tidak dimasukkan ke Git.

Tes otomatis tetap disimpan untuk pengembangan. `.gitattributes` mengecualikan
tes, factory, resource demo, dan command Demo dari paket `git archive`.
Aturan export-ignore tidak menghapus file tersebut dari clone Git biasa.
Instal dependency produksi dengan `composer install --no-dev` dan bangun
frontend dari source menggunakan lockfile yang disediakan.

## Kondisi database terbaru untuk hosting

Atas instruksi pemilik, pembersihan lanjutan dilakukan dengan mempertahankan
hanya admin utama `admin@bimbelku.com`. Password admin tidak diganti. Sebanyak
13 akun lain (termasuk akun yang sebelumnya dihapus lunak) dihapus fisik.

Seluruh riwayat operasional testing telah dikosongkan: sesi belajar, kelas,
pesanan, pembayaran, refund, saldo/dompet, pencairan, chat, notifikasi, absensi,
rating, catatan kemajuan, audit historis testing, token login, dan antrean job.
Ini adalah reset data lokal yang diizinkan pemilik, bukan perilaku penghapusan
normal pada aplikasi produksi. Semua sesi login lama dicabut.

23 tabel katalog dan konfigurasi tetap dipertahankan, termasuk kurikulum,
program, paket, harga, promo, tutorial, pengaturan pembayaran, dan konten CMS.
Konten CMS mandiri dipertahankan; testimoni/galeri yang terkait langsung dengan
riwayat atau profil yang dihapus ikut dibersihkan. Sebanyak 42 lampiran privat
operasional dipindahkan ke `operational-private-uploads` di folder arsip.
Aset publik website dan dokumen panduan tetap ada.

**File SQL terbaru yang dipakai untuk hosting: `database-ready-hosting.sql`**
di folder arsip yang disebut di atas. Backup sebelum reset mempunyai nama
`database-before-full-reset-*.sql`. Ekspor pembersihan parsial sebelumnya
sudah diberi nama `backup-partial-cleanup-before-full-reset.sql` dan bukan
salinan terbaru untuk hosting.

`DatabaseSeeder` tidak membuat akun murid/tutor demo lagi, termasuk jika
`.env` lama masih mempunyai `SEED_DEMO_USERS=true`. Admin hanya dibuat dari
kredensial yang dikonfigurasi eksplisit. Perintah demo menolak produksi.

Pemeriksaan ulang tanpa perubahan, dari folder backend:

```powershell
php artisan local:reset-operational-data
```

Perintah hanya menampilkan admin yang akan dipertahankan. Perubahan memerlukan
`--apply --backup=PATH_BACKUP.sql` dan hanya diizinkan pada local/testing.
Jangan menjalankan reset ulang setelah mulai memasukkan transaksi sungguhan.
