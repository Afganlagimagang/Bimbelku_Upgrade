# Pencairan tutor melalui Xendit

Pencairan memakai Xendit Payout v3. Iluma dan API pemeriksaan nama rekening
tidak diperlukan. Tutor mengisi nama pemilik rekening sesuai data bank,
terpisah dari nama tampilan akun. Kepemilikan rekening tidak diperiksa otomatis.

## Konfigurasi

1. Aktifkan akses payout di akun Xendit, dengan izin Write MONEY-OUT pada secret
   key. Pertahankan izin Money-in jika key yang sama dipakai menerima pembayaran.
2. Isi konfigurasi backend `bimbelku-backend/.env` dengan key TEST lebih dahulu:

   ```dotenv
   XENDIT_ENABLED=true
   XENDIT_SECRET_KEY=KEY_XENDIT
   XENDIT_WEBHOOK_TOKEN=TOKEN_CALLBACK_XENDIT
   XENDIT_BASE_URL=https://api.xendit.co
   XENDIT_PAYOUT_API_VERSION=2025-09-01
   ```

3. Daftarkan webhook Payout v3 pada dashboard Xendit ke
   `https://DOMAIN_API/api/webhooks/xendit`. Pada localhost, gunakan tunnel HTTPS
   ke backend port 8000 dan pertahankan proses tunnel selama pengujian.
4. Jalankan `php artisan config:clear` dari direktori backend setelah mengubah
   konfigurasi; pada hosting, bangun ulang cache konfigurasi sesuai deployment.
5. Pastikan saldo operasional dan akses layanan akun Xendit siap. Konfigurasi
   terisi bukan bukti bahwa izin layanan atau saldo penyedia sudah mencukupi.
6. Pilih nominal minimal Rp10.000 yang tidak melebihi saldo tersedia, lalu isi
   bank, nomor rekening, nama pemilik, alamat lengkap dan kata sandi akun tutor.
   Alamat yang sudah tersimpan di profil dipakai otomatis, tanpa perlu dikirim
   ulang. Kolom alamat pada pencairan hanya muncul jika profil belum mempunyai
   alamat lengkap. Alamat berbeda dari kolom kota/wilayah dan tidak dipublikasikan.
7. Tekan satu tombol **Cairkan dana**, lalu konfirmasi tujuan. Aplikasi menyimpan
   rekening dan alamat sekaligus membuat permintaan transfer dalam satu request.
   Tidak perlu menekan Simpan terlebih dahulu dan tidak ada penundaan otomatis
   24 jam. Nilai hold dari alur lama dibersihkan saat rekening dikonfirmasi.
8. Pantau status di Dompet Tutor. Status awal processing/ACCEPTED berarti
   permintaan diterima; uang dianggap terkirim setelah status sukses diproses.

## Perilaku dan perlindungan saldo

- Formulir dan konfirmasi menampilkan bahwa kepemilikan rekening belum
  diverifikasi otomatis. Kesalahan tujuan dapat menyebabkan salah transfer.
- Hanya pendapatan sesi selesai tanpa sengketa aktif yang dapat dicairkan.
- Dana dicadangkan secara atomik sebelum dikirim. Permintaan berulang dengan
  kunci transaksi yang sama tidak membuat transfer kedua.
- Kata sandi tetap diperiksa sebelum data rekening/alamat diubah. Data yang
  kosong atau tidak valid dikembalikan sebagai kesalahan pada kolom terkait.
- Penolakan pasti dari Xendit atau webhook gagal melepaskan dana sesuai status.
  Timeout/status tidak pasti tetap mencadangkan dana sampai hasil dikonfirmasi,
  agar dana yang mungkin sudah terkirim tidak dibayarkan dua kali.
- Webhook harus memakai token yang benar; pengiriman ulang tidak menggandakan
  pengurangan saldo atau penyelesaian transfer.

## Validasi kode

Dari direktori backend:

```powershell
php artisan test --filter="StageSixBTeacherOperationsTest|StageThreeFinanceSecurityTest|XenditMoneyFlowTest|PaymentGatewaySafetyTest"
```

Tes memakai database pengujian dan simulasi Xendit. Tes tidak mengirim uang
asli. Uji penyedia TEST dan pemeriksaan webhook tetap perlu dilakukan sebelum
menggunakan kredensial LIVE.

Referensi: [izin API payout](https://docs.xendit.co/docs/payouts-creating-an-api-key),
[Create Payout v3](https://docs.xendit.co/apidocs/create-payout-v3),
[webhook payout](https://docs.xendit.co/apidocs/payout-v3-webhook).
