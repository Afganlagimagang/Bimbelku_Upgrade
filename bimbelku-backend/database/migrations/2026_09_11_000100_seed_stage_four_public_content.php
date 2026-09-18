<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = DB::table('website_settings')->where('singleton_key', 1)->first();
        $navigation = json_decode((string) ($settings->navigation_items ?? '[]'), true);
        if (is_array($navigation)) {
            foreach ($navigation as &$item) {
                if (($item['key'] ?? null) === 'tutors' && in_array($item['url'] ?? null, ['/#kepercayaan', '/tutor'], true)) {
                    $item['url'] = '/#tutor';
                }
                if (($item['key'] ?? null) === 'help' && in_array($item['url'] ?? null, ['/#footer', '/bantuan'], true)) {
                    $item['url'] = '/#faq';
                }
            }
            unset($item);
            DB::table('website_settings')->where('singleton_key', 1)->update([
                'navigation_items' => json_encode($navigation, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => now(),
            ]);
        }

        $hero = DB::table('website_sections')->where('section_key', 'hero')->first();
        if ($hero && $hero->title === 'Temukan tutor yang sesuai dengan kebutuhan dan jadwal belajarmu.') {
            DB::table('website_sections')->where('id', $hero->id)->update([
                'title' => 'Belajar lebih pas, mulai dari tutor yang tepat.',
                'description' => 'Pilih mata pelajaran, materi, jadwal, dan mode belajar. Harga terlihat sejak awal, lalu matching dimulai setelah pembayaran terverifikasi.',
                'updated_at' => now(),
            ]);
        }

        $content = [
            'how_it_works' => ['eyebrow' => 'Dari kebutuhan sampai kelas pertama', 'title' => 'Empat langkah yang jelas, tanpa kejutan di tengah.', 'description' => 'Harga dan jadwal dipilih lebih dulu. Pencarian tutor dimulai setelah pembayaran terverifikasi.'],
            'proof' => ['eyebrow' => 'Bukti di dalam produk', 'title' => 'Yang dijanjikan di depan, terlihat lagi di dashboard.', 'description' => 'Lihat contoh bagaimana verifikasi, matching, jadwal, dan laporan bekerja di sistem BimbelKu.'],
            'tutors' => ['eyebrow' => 'Standar tutor BimbelKu', 'title' => 'Bukan sekadar banyak. Tutor harus siap mengajar.', 'description' => 'Identitas dan dokumen diperiksa admin. Profil hanya ditampilkan ke publik setelah tutor memberi persetujuan.'],
            'pricing' => ['eyebrow' => 'Paket belajar', 'title' => 'Pilih ritme belajar, lalu lihat harga finalnya.', 'description' => 'Jumlah sesi dan masa aktif berasal dari paket yang benar-benar tersedia di sistem.'],
            'progress' => ['eyebrow' => 'Progress yang mudah dibaca', 'title' => 'Orang tua tahu apa yang dipelajari, siswa tahu apa berikutnya.', 'description' => 'Perkembangan materi tersusun per paket dan per Bab, dengan laporan sesi saat tersedia.'],
            'reviews' => ['eyebrow' => 'Ulasan dari kelas nyata', 'title' => 'Rating terhubung ke aktivitas belajar, bukan angka tempelan.', 'description' => 'Ringkasan hanya muncul setelah sistem memiliki cukup rating untuk ditampilkan secara bertanggung jawab.'],
            'areas' => ['eyebrow' => 'Area layanan', 'title' => 'Belajar online dari mana saja, atau tatap muka di Yogyakarta.', 'description' => 'Ketersediaan tutor tatap muka tetap mengikuti alamat, jarak, mapel, dan jadwal yang dipilih.'],
            'faq' => ['eyebrow' => 'Sebelum kamu memesan', 'title' => 'Pertanyaan penting, dijawab tanpa disembunyikan.', 'description' => 'Termasuk urutan pembayaran, proses matching, serta pilihan ketika tutor belum ditemukan.'],
        ];

        foreach ($content as $key => $values) {
            $section = DB::table('website_sections')->where('section_key', $key)->first();
            if (! $section) {
                continue;
            }

            DB::table('website_sections')->where('id', $section->id)->update([
                'eyebrow' => $section->eyebrow ?: $values['eyebrow'],
                'title' => $section->title ?: $values['title'],
                'description' => $section->description ?: $values['description'],
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Konten CMS tidak dihapus agar perubahan admin tetap aman.
    }
};
