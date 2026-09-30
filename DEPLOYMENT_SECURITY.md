# Checklist keamanan deployment BimbelKu

Kode aplikasi mengurangi risiko serangan, tetapi keamanan production tetap bergantung pada server. Ikuti seluruh poin ini sebelum domain dibuka.

## Document root

- Frontend hanya melayani folder `dist/` hasil `npm run build`.
- API hanya melayani folder `bimbelku-backend/public/`.
- Jangan pernah menjadikan root repository, `bimbelku-backend/`, `storage/`, `vendor/`, atau folder backup sebagai document root.
- Jangan mengunggah `.env`, dump `.sql`, log, source map, atau arsip backup ke folder publik.

## Instalasi production

1. Salin `bimbelku-backend/.env.production.example` menjadi `.env` di server dan isi secret di server, bukan di Git.
2. Jalankan `composer install --no-dev --prefer-dist --optimize-autoloader`.
3. Jalankan `npm ci`, `npm run check`, lalu `npm run build` di pipeline build.
4. Jalankan `php artisan migrate --force`, `php artisan optimize`, dan scheduler Laravel setiap menit.
5. Pastikan worker queue berjalan sebagai user non-root.
6. Beri izin tulis hanya pada `storage/` dan `bootstrap/cache/`. Source code lain harus read-only bagi user web server.

## Server dan akun

- Wajib HTTPS; redirect seluruh HTTP ke HTTPS.
- Aktifkan firewall. Buka hanya 80/443 dan batasi SSH ke IP pengelola.
- Matikan directory listing dan eksekusi PHP/script di folder upload. File `.htaccess` proyek sudah menyediakan pertahanan Apache; buat aturan ekuivalen bila memakai Nginx.
- Gunakan password database unik dengan hak hanya pada database BimbelKu. Jangan gunakan akun `root` database.
- Simpan panel hosting, SSH, email, Google Cloud, dan database dengan MFA.
- Rotasi `APP_KEY`, password database, SMTP key, Google client secret, dan akun admin jika pernah bocor. Perubahan `APP_KEY` membuat data terenkripsi lama tidak dapat dibaca, jadi lakukan dengan rencana migrasi/backup.

## Operasional

- Jalankan `npm audit --omit=dev` dan `composer audit --locked` pada setiap rilis.
- Backup database otomatis di lokasi privat dan uji pemulihannya. Jangan simpan dump di web root.
- Pantau perubahan file, login admin, lonjakan 404/POST, serta file PHP baru. Gunakan alert dari hosting/Cloudflare atau file-integrity monitor.
- Terapkan update OS, PHP, Composer, Node, web server, dan dependency secara berkala.
- Jika ada indikasi judol/defacement: putus akses publik, snapshot bukti, rotasi seluruh credential dari perangkat bersih, reinstall server dari image bersih, restore hanya data yang sudah diverifikasi, lalu audit log. Jangan hanya menghapus file judol karena backdoor mungkin masih tertinggal.

Tidak ada konfigurasi yang dapat menjamin situs 100% mustahil diretas. Targetnya adalah memperkecil permukaan serangan, mendeteksi insiden cepat, dan memastikan pemulihan aman.
