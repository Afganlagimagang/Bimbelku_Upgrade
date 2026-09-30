# OTW Revisi BimbelKu — Status, Refund, Autentikasi, Mega Menu, dan WhatsApp

Dokumen ini menggantikan seluruh isi `otwrevisi.md` sebelumnya. Isinya merupakan acuan revisi terbaru berdasarkan audit terhadap perilaku aplikasi dan keputusan produk terakhir.

Dokumen ini **bukan catatan bahwa implementasi sudah selesai**. Semua bagian di bawah harus dianggap belum final sampai alur, tampilan, API, database, dan pengujiannya memenuhi kriteria selesai pada masing-masing bagian.

## 1. Tujuan Revisi

Revisi ini menyelesaikan empat masalah utama:

1. Badge atau tanda merah pada navigasi tetap muncul walaupun pengguna sudah membuka halaman atau kasusnya sudah tidak relevan.
2. Refund sudah diproses murid dan admin, tetapi berhenti pada pesan “Refund sedang diproses” tanpa status lanjutan yang jelas.
3. Form login dan register masih mengalami bug dan belum konsisten untuk murid, tutor, admin, login Google, serta sesi pengguna.
4. Halaman dari mega menu terlalu seragam. Banyak halaman hanya mengganti judul, tetapi tetap memakai susunan “siapa yang cocok”, “kapan perlu pilihan lain”, dan “langkah”, sehingga isinya terasa seperti salinan.

Revisi navigasi tambahan:

- Hapus **FAQ** dari mega menu Wawasan.
- Hapus tombol **Lihat semua** dari mega menu Wawasan.
- Hapus **Kontak** dari mega menu Tentang.
- Perbaiki tautan **Tentang BimbelKu** agar dapat dibuka.
- Sediakan akses WhatsApp di **topbar**.
- Sediakan tombol WhatsApp mengambang di **kanan bawah** halaman publik.

## 2. Prinsip Dasar

- Badge navigasi adalah penanda **perubahan yang belum dilihat**, bukan penanda permanen bahwa pengguna mempunyai kelas, pesanan, atau refund.
- Transaksi normal tidak bergantung pada admin jika sistem sudah dapat menentukan hasilnya secara objektif.
- Nama penyedia pembayaran tidak ditonjolkan pada antarmuka pengguna. Pengguna cukup melihat istilah “pembayaran”, “pengembalian dana”, dan status prosesnya.
- Setiap halaman publik harus mempunyai tujuan, struktur, bukti, dan CTA yang berbeda sesuai kebutuhan pengunjung.
- WhatsApp menjadi jalur kontak utama, tetapi tombolnya tidak boleh menutupi konten, navigasi mobile, atau tindakan penting.
- Semua klaim publik harus bersumber dari data, kebijakan, atau fungsi BimbelKu yang benar-benar tersedia.

---

# BAGIAN A — BADGE DAN NOTIFIKASI MERAH

## 3. Masalah yang Terjadi

Tanda merah masih menetap terutama pada:

- **Kelas Saya** milik tutor.
- **Permintaan Kelas** milik tutor.
- **Proses Pesanan** milik murid.

Masalah ini membingungkan karena pengguna tidak tahu:

- Perubahan apa yang menyebabkan badge muncul.
- Halaman atau tab mana yang harus dibuka.
- Apakah badge berarti ada tindakan, kesalahan, atau hanya data lama.
- Mengapa badge tetap muncul setelah halaman sudah dibaca.

## 4. Penyebab Konseptual

Sistem saat ini terlalu bergantung pada notifikasi yang dikelompokkan berdasarkan route besar. Akibatnya:

- Satu notifikasi lama dapat membuat seluruh menu tetap merah.
- Notifikasi yang targetnya masih satu kelompok route dapat menyalakan badge pada halaman yang tidak relevan.
- Keberadaan kelas atau pesanan dapat disalahartikan sebagai perhatian baru.
- Status dibaca dan status proses bisnis belum dipisahkan dengan jelas.

## 5. Arti Badge yang Baru

Badge merah hanya berarti:

> Ada perubahan baru pada bagian ini dan pengguna belum melihat perubahan tersebut.

Badge **bukan** berarti pengguna mempunyai kelas aktif, pesanan, refund berjalan, atau riwayat lama.

Setelah halaman atau tab target dibuka:

- Badge navigasi langsung hilang.
- Informasi atau tindakan yang belum selesai tetap dapat muncul sebagai kartu/status di dalam halaman.
- Badge baru boleh muncul kembali jika setelah itu terdapat peristiwa baru.

Kasus yang masih berjalan tidak membuat menu terus merah. Statusnya tetap terlihat di dalam halaman tanpa mengganggu navigasi.

## 6. Kunci Perhatian yang Spesifik

Setiap perubahan harus mempunyai kunci yang jelas, misalnya:

- `student_order_status_changed`
- `student_payment_required`
- `student_matching_result`
- `student_refund_status_changed`
- `teacher_new_offer`
- `teacher_schedule_changed`
- `teacher_class_cancelled`
- `teacher_payout_failed`
- `admin_refund_exception`

Setiap catatan perhatian minimal menyimpan pengguna tujuan, jenis perubahan, ID entitas terkait, route dan tab tujuan, waktu dibuat, waktu dibaca, serta status validitasnya.

## 7. Perilaku per Halaman

### 7.1 Proses Pesanan Murid

Badge hanya muncul apabila setelah kunjungan terakhir terjadi perubahan seperti:

- Pembayaran perlu dilanjutkan, berhasil, atau gagal.
- Proses matching dimulai.
- Tutor ditemukan atau tidak ditemukan.
- Jadwal perlu dikonfirmasi.
- Refund berubah status.

Pesanan yang tidak berubah tidak boleh membuat menu merah.

### 7.2 Permintaan Kelas Tutor

Badge hanya muncul untuk penawaran baru atau perubahan penting pada penawaran. Membuka daftar atau tab penawaran terkait harus menghapus badge.

Penawaran yang ditolak, kedaluwarsa, diterima, atau dibatalkan tidak boleh terus memicu badge.

### 7.3 Kelas Saya Tutor

Badge hanya muncul ketika ada perubahan baru seperti kelas resmi dibuat, jadwal diubah, sesi dibatalkan, atau perubahan penting lain.

Keberadaan kelas aktif atau riwayat kelas tidak boleh menyalakan badge dengan sendirinya.

### 7.4 Keuangan Admin

Tanda umum pada menu Keuangan diganti menjadi informasi spesifik, contohnya:

- “2 refund gagal dikirim”
- “1 pencairan perlu diperiksa”
- “3 transaksi belum sinkron”

Jika persoalan berada pada tab Refund, indikator mengarahkan langsung ke tab Refund, bukan sekadar halaman utama Keuangan.

## 8. Pembersihan Data Lama

Implementasi mencakup:

- Migrasi atau normalisasi notifikasi lama.
- Penonaktifan target route yang sudah tidak digunakan.
- Pembersihan notifikasi historis yang terbaca sebagai perhatian aktif.
- Pencegahan pembuatan ulang notifikasi yang sama setelah dibaca.
- Idempotensi agar satu peristiwa tidak menghasilkan badge ganda.

## 9. Kriteria Selesai Badge

- Membuka halaman atau tab target menghilangkan badge.
- Memuat ulang halaman tidak membuat badge lama muncul kembali.
- Riwayat kelas, pesanan, atau refund tidak menghasilkan badge.
- Peristiwa baru menghasilkan badge tepat pada menu yang benar.
- Satu notifikasi tidak menyalakan menu lain yang tidak relevan.
- Navigasi desktop dan mobile mempunyai perilaku yang sama.

---

# BAGIAN B — REFUND

## 10. Masalah yang Terjadi

Murid sudah menentukan pilihan refund. Admin juga sudah memprosesnya, tetapi tampilan berhenti pada:

> Refund sedang diproses. Status akhir akan diperbarui secara otomatis.

Pesan tersebut tidak menjelaskan apakah permintaan sudah dikirim, masih menunggu pembaruan, gagal, kapan terakhir diperiksa, atau tindakan apa yang perlu dilakukan.

## 11. Keputusan Produk untuk Refund

Refund karena sistem tidak menemukan tutor adalah kondisi objektif. Untuk alasan `no_teacher`:

- Tidak memerlukan persetujuan admin.
- Murid memilih refund.
- Sistem menghitung nominal.
- Sistem mengirim permintaan pengembalian dana.
- Status diperbarui otomatis.
- Admin hanya terlibat jika terjadi kegagalan teknis atau sengketa.

Persetujuan admin tetap dapat digunakan untuk kasus subjektif, misalnya perselisihan sesi, ketidakhadiran, keluhan mutu, nominal yang disengketakan, atau dugaan penyalahgunaan.

## 12. Status Refund yang Wajib Terlihat

Refund mempunyai state machine yang jelas:

1. **Memenuhi syarat** — sistem memastikan refund dapat diajukan.
2. **Dipilih murid** — murid memilih pengembalian dana.
3. **Sedang disiapkan** — nominal dan metode sedang dihitung.
4. **Dikirim** — permintaan sudah diteruskan ke sistem pembayaran.
5. **Sedang diproses** — pengembalian masih diproses.
6. **Berhasil** — dana dinyatakan berhasil dikembalikan.
7. **Gagal** — proses gagal dan perlu percobaan ulang atau pemeriksaan.
8. **Perlu pemeriksaan** — hanya untuk kondisi tidak normal atau sengketa.

Status internal boleh lebih teknis, tetapi bahasa pada halaman murid harus tetap sederhana.

## 13. Informasi pada Halaman Refund Murid

Setiap refund menampilkan:

- Nomor pesanan.
- Alasan refund.
- Nominal yang dikembalikan.
- Metode pengembalian.
- Status saat ini.
- Waktu pengajuan.
- Waktu permintaan dikirim.
- Waktu pembaruan terakhir.
- Estimasi umum jika dapat dibuktikan.
- Penjelasan tindakan berikutnya.

Jika refund gagal, tampilkan tombol atau arahan nyata. Jangan terus menampilkan “sedang diproses”.

## 14. Alur Teknis yang Aman

- Permintaan refund mempunyai idempotency key.
- Menekan ulang tombol tidak membuat refund ganda.
- Webhook memperbarui status transaksi.
- Ada rekonsiliasi/pemeriksaan ulang jika webhook terlambat atau hilang.
- Refund yang terlalu lama dalam status proses masuk daftar pengecualian.
- Admin melihat referensi transaksi, status terakhir, waktu pemeriksaan, dan alasan kegagalan.
- Tombol admin hanya tersedia untuk retry/reconcile pada kegagalan, bukan menyetujui refund normal `no_teacher`.

## 15. Tampilan Admin

Admin melihat:

- Refund normal yang berjalan sebagai informasi.
- Refund gagal atau tidak sinkron sebagai pekerjaan.
- Refund sengketa sebagai keputusan manual.

Admin tidak perlu menekan tombol untuk menyelesaikan alur normal. Sistem pembayaran dan webhook menjadi sumber status, dengan rekonsiliasi sebagai cadangan.

## 16. Kriteria Selesai Refund

- Refund `no_teacher` berjalan tanpa persetujuan admin.
- Status murid bergerak sampai berhasil atau gagal secara jelas.
- Tidak ada refund yang berhenti tanpa waktu pembaruan dan alasan.
- Webhook yang sama tidak membuat pengembalian ganda.
- Jika webhook hilang, proses dapat dipulihkan melalui rekonsiliasi.
- Admin hanya menerima indikator merah untuk kegagalan atau sengketa.
- Nama penyedia pembayaran tidak digunakan sebagai materi promosi atau penjelasan utama.

---

# BAGIAN C — LOGIN DAN REGISTER

## 17. Masalah yang Harus Diaudit

Form login dan register dilaporkan mengalami bug. Pemeriksaan tidak boleh berhenti pada desain; kontrak form, API, session, role, dan redirect harus diuji.

Kemungkinan yang wajib diperiksa:

- Submit tidak terkirim atau terkirim dua kali.
- Validasi frontend tidak sama dengan backend.
- Pesan kesalahan tidak menunjukkan input bermasalah.
- Callback Google berhasil tetapi session tidak terbaca saat kembali.
- Redirect kembali ke login walaupun autentikasi berhasil.
- Role pengguna salah dikenali.
- Form keluar dari viewport mobile.
- Seluruh halaman ikut scroll, padahal pada desktop hanya panel form yang seharusnya scroll.
- Keyboard mobile menutup input atau tombol.

## 18. Arsitektur Login Final

### 18.1 Login Pengguna

Satu halaman login digunakan untuk murid dan tutor. Pengguna tidak perlu memilih jenis login. Setelah autentikasi, sistem membaca role dan mengarahkan ke dashboard yang sesuai.

Tulisan tombol Google cukup:

> Masuk dengan Google

Tidak perlu tambahan “murid”.

### 18.2 Login Admin

Login admin mempunyai route terpisah. Akun admin tidak menggunakan halaman login pengguna biasa.

### 18.3 Register Murid

Murid dapat mendaftar manual atau dengan Google. Data minimum dibuat saat autentikasi; profil yang belum lengkap dapat dilengkapi setelah masuk.

### 18.4 Register Tutor

Register tutor tetap mempunyai halaman khusus karena membutuhkan data lengkap.

Alurnya:

1. Tutor mengisi seluruh data pendaftaran.
2. Sistem menyimpan data.
3. Sistem membuat ringkasan data yang aman.
4. Tutor diarahkan ke WhatsApp.
5. Pesan WhatsApp terisi berdasarkan data pendaftaran.
6. Data sensitif tidak dimasukkan ke pesan WhatsApp.

Login tutor tidak mempunyai halaman khusus; tutor masuk dari login pengguna yang sama dengan murid.

## 19. Session dan Login Google

- Session bertahan secara wajar agar pengguna tidak perlu login setiap membuka web.
- Token/cookie mempunyai masa berlaku, refresh, logout, dan pencabutan yang jelas.
- Callback Google kembali ke origin frontend yang benar.
- Origin `localhost` dan `127.0.0.1` tidak tercampur tanpa penanganan.
- Redirect setelah login mempertahankan halaman tujuan awal jika aman.
- Akun Google yang sudah terdaftar masuk ke akun yang sama, bukan membuat akun ganda.
- Jika email pesanan tamu sama dengan akun yang login/register, pesanan dapat dihubungkan sesuai aturan.

## 20. UX Form

- Desktop memakai panel identitas BimbelKu dan panel form.
- Hanya panel form yang scroll jika isinya panjang.
- Mobile memakai tinggi viewport dinamis dan tidak keluar layar ketika keyboard dibuka.
- Tombol submit selalu dapat dijangkau.
- Loading state mencegah submit ganda.
- Kesalahan tampil dekat input dan dalam ringkasan jika diperlukan.
- Password mempunyai tombol tampil/sembunyi.
- Fokus keyboard, label, autocomplete, dan urutan tab benar.
- Animasi dekoratif tidak menghambat form dan menghormati `prefers-reduced-motion`.

## 21. Kriteria Selesai Autentikasi

- Login manual murid menuju dashboard murid.
- Login manual tutor menuju dashboard tutor.
- Login admin hanya melalui halaman admin.
- Login Google bekerja dari origin pengembangan dan domain produksi yang diizinkan.
- Register Google tidak membuat akun duplikat.
- Refresh tidak mengeluarkan pengguna yang session-nya masih valid.
- Logout benar-benar mengakhiri session.
- Semua form dapat digunakan pada desktop dan mobile tanpa overflow.
- Pesan validasi menjelaskan masalah sebenarnya.

---

# BAGIAN D — MEGA MENU DAN HALAMAN PUBLIK

## 22. Temuan Audit

Terdapat tujuh halaman yang menggunakan kerangka informasi hampir sama:

1. `/cara-belajar/panduan-memilih-program`
2. `/cara-belajar/cara-pemesanan`
3. `/cara-belajar/sistem-matching-tutor`
4. `/cara-belajar/pembayaran-dan-refund`
5. `/cara-belajar/privat-tatap-muka`
6. `/cara-belajar/privat-online`
7. `/cara-belajar/pemesanan-dan-matching`

Pola yang terlalu sering diulang:

- Judul dan ringkasan.
- Siapa yang cocok.
- Kapan perlu pilihan lain.
- Langkah-langkah.
- CTA.

Kesamaan ini terjadi karena semua halaman memakai satu template generik. Template tersebut membuat route cepat dibangun dan konsisten, tetapi hasilnya:

- Terasa seperti salinan.
- Tidak menjawab maksud pencarian yang berbeda.
- Tidak membangun kepercayaan secara mendalam.
- Tidak memberi alasan kuat untuk membuka halaman lain.
- Berisiko menghasilkan konten SEO tipis dan mirip.

## 23. Keputusan Struktur Mega Menu

### 23.1 Mega Menu Wawasan

Item yang dipertahankan:

- Panduan Memilih Program.
- Cara Pemesanan.
- Sistem Matching Tutor.
- Pembayaran dan Refund.

Item yang dihapus:

- FAQ.
- Tombol “Lihat semua”.

FAQ boleh tetap ada pada halaman yang relevan atau landing page, tetapi bukan sebagai tombol mega menu Wawasan.

### 23.2 Mega Menu Tentang

Item utama:

- Tentang BimbelKu.
- Area Layanan.

Perubahan:

- Hapus Kontak dari mega menu.
- Perbaiki route Tentang BimbelKu agar dapat dibuka langsung dan tidak menghasilkan halaman kosong, route salah, atau kembali ke landing page.

Kontak tidak hilang dari website. Akses kontak dipindahkan menjadi WhatsApp di topbar dan tombol mengambang kanan bawah.

### 23.3 Halaman yang Bertumpuk

`/cara-belajar/pemesanan-dan-matching` tidak perlu menjadi halaman independen karena materinya bertabrakan dengan Cara Pemesanan dan Sistem Matching Tutor.

Route lama harus:

- Di-redirect permanen ke halaman paling relevan; atau
- Mengarah ke anchor matching pada Cara Pemesanan/Sistem Matching Tutor.

Tidak boleh ada tiga halaman yang menjelaskan alur sama dengan kata-kata berbeda.

## 24. Struktur Unik Setiap Halaman

### 24.1 Panduan Memilih Program

**Tujuan:** membantu orang tua atau siswa menentukan layanan yang sesuai.

Isi:

- Pertanyaan diagnostik.
- Tujuan belajar: pemahaman materi, ujian, perbaikan nilai, atau keterampilan.
- Preferensi tatap muka/online.
- Kebutuhan privat atau bersama.
- Tabel perbandingan program.
- Contoh kasus kebutuhan siswa.
- Rekomendasi berdasarkan jawaban.
- Batas setiap pilihan.
- CTA menuju program yang sesuai.

Halaman ini bukan halaman proses pemesanan.

### 24.2 Cara Pemesanan

**Tujuan:** menjelaskan apa yang terjadi sejak pengguna memilih program hingga pesanan aktif.

Isi:

- Urutan form dan data yang diperlukan.
- Pemesanan sebelum login.
- Hubungan pesanan tamu dengan email akun.
- Ringkasan biaya.
- Pembayaran.
- Status pesanan.
- Matching tutor.
- Skenario jika tutor belum ditemukan.
- Contoh tampilan status dari produk.
- Estimasi yang dapat dibuktikan.
- CTA untuk mulai menyusun pesanan.

Halaman ini berorientasi pada timeline transaksi, bukan daftar keunggulan umum.

### 24.3 Sistem Matching Tutor

**Tujuan:** membangun kepercayaan terhadap cara sistem memilih dan menawarkan kelas kepada tutor.

Isi:

- Syarat tutor dapat menerima penawaran.
- Kecocokan mapel, jenjang, lokasi, jadwal, dan metode.
- Sistem penawaran berurutan.
- Alasan rating tertinggi tidak otomatis selalu didahulukan.
- Prinsip pemerataan yang tetap menjaga kecocokan.
- Batas waktu penawaran.
- Kondisi tutor menolak atau tidak merespons.
- Proses cari ulang.
- Kondisi tidak ditemukan.
- Perlindungan data murid dan tutor.
- Bukti dari fitur/status di dalam aplikasi.

Halaman ini tidak mengulang seluruh cara pemesanan.

### 24.4 Pembayaran dan Refund

**Tujuan:** menjelaskan aturan transaksi secara transparan.

Isi:

- Kapan pembayaran dilakukan.
- Status pembayaran.
- Batas waktu tagihan.
- Pencegahan pembayaran ganda.
- Kapan refund otomatis.
- Kapan kasus memerlukan pemeriksaan.
- Metode pengembalian.
- Tahapan status refund.
- Estimasi yang dapat dibuktikan.
- Contoh skenario.
- Keamanan transaksi.

Antarmuka publik tidak menonjolkan nama payment gateway.

### 24.5 Privat Tatap Muka

**Tujuan:** menjelaskan pengalaman, keamanan, dan batas layanan belajar langsung.

Isi:

- Cara tutor datang ke lokasi.
- Area layanan.
- Penentuan radius.
- Penjadwalan.
- Persiapan tempat belajar.
- Verifikasi dan seleksi tutor.
- Keamanan serta persetujuan orang tua.
- Kondisi perubahan lokasi.
- Faktor biaya.
- Foto kegiatan nyata apabila memiliki izin.
- Perbandingan jujur dengan online.
- FAQ khusus tatap muka.
- CTA cek area atau susun paket.

### 24.6 Privat Online

**Tujuan:** menjelaskan bagaimana kelas online benar-benar berjalan.

Isi:

- Perangkat dan koneksi minimum.
- Media kelas yang digunakan.
- Cara berbagi materi.
- Interaksi tutor dan siswa.
- Pengaturan jadwal.
- Dokumentasi/progres.
- Penanganan gangguan koneksi.
- Privasi tautan kelas.
- Kelebihan dan batas dibanding tatap muka.
- Contoh alur satu sesi.
- FAQ khusus online.
- CTA susun paket online.

Halaman online tidak boleh membawa validasi radius tatap muka.

## 25. Standar Halaman Publik

Setiap halaman wajib mempunyai:

- Satu tujuan utama.
- Informasi yang tidak sekadar mengulang landing page.
- Bukti dari fitur atau kebijakan BimbelKu.
- Contoh konkret.
- Batas layanan dan kemungkinan gagal.
- CTA yang sesuai konteks.
- FAQ spesifik, bukan FAQ generik yang disalin.
- Title SEO, description, canonical, dan structured data yang unik.
- Tanggal pembaruan jika kontennya berupa panduan.

Halaman tidak wajib memakai susunan yang sama. Konsistensi visual dipertahankan melalui warna, tipografi, tombol, dan komponen dasar—bukan dengan memaksakan blok konten yang sama.

---

# BAGIAN E — AKSES WHATSAPP

## 26. WhatsApp di Topbar

WhatsApp tersedia langsung di topbar agar pengunjung tidak perlu mencari halaman Kontak.

Perilaku:

- Desktop menampilkan ikon dan label “WhatsApp” atau “Konsultasi WhatsApp”.
- Mobile menampilkan tombol ringkas tanpa menghabiskan ruang navigasi.
- Nomor berasal dari satu pengaturan website yang dikelola admin.
- Jika nomor belum diatur, tombol tidak mengarah ke nomor palsu.
- Pesan awal disesuaikan dengan konteks halaman.

Contoh pesan kontekstual:

- Landing page: konsultasi kebutuhan belajar.
- Halaman program: menanyakan program yang sedang dibuka.
- Halaman tatap muka: menanyakan area layanan.
- Halaman tutor: menanyakan proses pendaftaran tutor.

## 27. Tombol WhatsApp Kanan Bawah

Tambahkan tombol mengambang di kanan bawah halaman publik.

Ketentuan:

- Posisi `fixed`.
- Tidak menutupi bottom navigation mobile.
- Tidak menutupi tombol pembayaran, cookie notice, atau tindakan penting.
- Memiliki jarak aman dari tepi layar.
- Memiliki label aksesibilitas.
- Fokus keyboard terlihat.
- Tidak memakai animasi berlebihan.
- Dapat diberi tooltip singkat.
- Menggunakan nomor dan generator pesan yang sama dengan topbar.

Topbar dan tombol mengambang bukan dua sistem berbeda. Keduanya membaca sumber konfigurasi WhatsApp yang sama.

## 28. Keamanan Tautan WhatsApp

- Nomor dinormalisasi ke format internasional.
- Pesan di-encode dengan benar.
- Jangan memasukkan password, nomor identitas, alamat lengkap, data pembayaran, atau dokumen sensitif.
- Data register tutor yang dikirim melalui pesan hanya berupa ringkasan aman.
- Link eksternal memakai atribut keamanan yang sesuai.

## 29. Kriteria Selesai WhatsApp

- Tombol topbar berfungsi di desktop dan mobile.
- Tombol kanan bawah tersedia pada halaman publik.
- Keduanya menggunakan nomor admin yang sama.
- Pesan awal sesuai konteks halaman.
- Tidak ada lagi kebutuhan item Kontak di mega menu.
- Tombol tidak menutupi elemen lain pada berbagai ukuran layar.

---

# BAGIAN F — URUTAN PENGERJAAN

## 30. Prioritas 1: Refund dan Status Transaksi

1. Kunci state machine refund.
2. Hilangkan persetujuan admin untuk `no_teacher`.
3. Pastikan webhook idempotent.
4. Tambahkan rekonsiliasi.
5. Tampilkan timeline status pada murid dan admin.
6. Uji kondisi berhasil, gagal, webhook terlambat, dan retry.

## 31. Prioritas 2: Login dan Register

1. Audit kontrak API dan form.
2. Perbaiki session serta callback Google.
3. Satukan login murid dan tutor.
4. Pertahankan login admin terpisah.
5. Perbaiki register murid dan tutor.
6. Uji origin lokal dan domain produksi.
7. Uji seluruh breakpoint mobile.

## 32. Prioritas 3: Badge

1. Pisahkan status “belum dilihat” dari status proses bisnis.
2. Buat kunci perhatian spesifik.
3. Arahkan setiap badge ke route/tab tepat.
4. Tandai dibaca saat target dibuka.
5. Bersihkan data lama.
6. Uji peran murid, tutor, dan admin.

## 33. Prioritas 4: Mega Menu dan Konten

1. Hapus FAQ dan Lihat semua dari Wawasan.
2. Hapus Kontak dari Tentang.
3. Perbaiki route Tentang BimbelKu.
4. Hilangkan halaman Pemesanan dan Matching yang duplikatif.
5. Bangun struktur unik untuk enam halaman utama.
6. Periksa seluruh link pada desktop dan mobile.
7. Audit SEO dan kedalaman konten.

## 34. Prioritas 5: WhatsApp

1. Pastikan nomor dapat dikelola admin.
2. Tambahkan tombol topbar.
3. Tambahkan tombol mengambang.
4. Buat pesan kontekstual.
5. Uji agar tidak menutupi UI.

---

# BAGIAN G — PENGUJIAN WAJIB

## 35. Pengujian Fungsional

- Login manual murid, tutor, dan admin.
- Login dan register Google.
- Session setelah refresh dan membuka ulang browser.
- Refund otomatis ketika tutor tidak ditemukan.
- Refund ketika webhook terlambat.
- Badge baru, badge dibaca, dan badge tidak muncul kembali.
- Seluruh tautan mega menu.
- Redirect route lama.
- Tombol WhatsApp topbar dan kanan bawah.

## 36. Pengujian Responsif

Ukuran minimum yang diuji:

- Mobile kecil.
- Mobile umum.
- Tablet.
- Laptop.
- Desktop lebar.

Yang diperiksa:

- Tidak ada overflow horizontal.
- Form tetap dapat discroll dan disubmit.
- Mega menu dapat dibuka dan ditutup.
- Tombol WhatsApp tidak menutupi navigasi.
- Konten halaman tidak hanya berubah menjadi tumpukan kartu identik.

## 37. Pengujian Aksesibilitas

- Semua tombol dapat digunakan dengan keyboard.
- Fokus terlihat.
- Label form terhubung dengan input.
- Error dapat dibaca screen reader.
- Warna badge bukan satu-satunya penanda.
- Tombol WhatsApp mempunyai nama yang jelas.
- Animasi menghormati `prefers-reduced-motion`.

## 38. Pengujian SEO

- Setiap halaman mempunyai title dan description berbeda.
- Tidak ada dua halaman transaksi/matching yang hampir sama.
- Route lama memakai redirect yang benar.
- Canonical sesuai domain final.
- Structured data sesuai jenis halaman.
- Konten utama dapat dirayapi.
- Sitemap hanya memuat route publik yang valid.

---

# BAGIAN H — HASIL AKHIR YANG DIHARAPKAN

Revisi dianggap berhasil apabila:

- Tanda merah hanya muncul untuk perubahan baru dan hilang setelah target dibuka.
- Kelas, pesanan, dan refund lama tidak membuat navigasi terus merah.
- Refund karena tutor tidak ditemukan berjalan tanpa persetujuan admin.
- Murid selalu dapat melihat posisi refund dan langkah berikutnya.
- Login/register manual maupun Google stabil pada lokal dan produksi.
- Login murid dan tutor berada pada satu halaman, sedangkan admin tetap terpisah.
- Setiap halaman mega menu mempunyai fungsi dan struktur berbeda.
- Tidak ada halaman Pemesanan dan Matching yang menduplikasi dua halaman lain.
- FAQ dan Lihat semua hilang dari Wawasan.
- Kontak hilang dari Tentang.
- Tentang BimbelKu dapat dibuka.
- WhatsApp mudah ditemukan di topbar dan kanan bawah.
- Seluruh perubahan bekerja konsisten pada desktop dan mobile.

Dokumen ini menjadi sumber acuan revisi terbaru. Jika implementasi berbeda dari dokumen ini, perbedaannya harus dicatat dan diputuskan terlebih dahulu, bukan diterapkan diam-diam.
