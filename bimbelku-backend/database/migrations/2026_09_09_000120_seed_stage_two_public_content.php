<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $navigation = [
            ['key' => 'programs', 'label' => 'Program', 'url' => '/program', 'is_visible' => true],
            ['key' => 'how-it-works', 'label' => 'Cara Kerja', 'url' => '/#cara-kerja', 'is_visible' => true],
            ['key' => 'tutors', 'label' => 'Tutor', 'url' => '/#kepercayaan', 'is_visible' => true],
            ['key' => 'pricing', 'label' => 'Harga', 'url' => '/#paket', 'is_visible' => true],
            ['key' => 'help', 'label' => 'Bantuan', 'url' => '/#footer', 'is_visible' => true],
        ];
        DB::table('website_settings')->where('singleton_key', 1)->update([
            'navigation_items' => json_encode($navigation, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'updated_at' => now(),
        ]);

        $sections = [
            'hero' => [
                'eyebrow' => 'Bimbingan belajar SD–SMA di Yogyakarta',
                'title' => 'Temukan tutor yang sesuai dengan kebutuhan dan jadwal belajarmu.',
                'description' => 'Atur mata pelajaran, materi, jadwal, dan mode belajar. BimbelKu membantu mencarikan tutor yang sesuai.',
                'content' => [
                    'secondary_cta_label' => 'Konsultasi WhatsApp',
                    'trust_points' => ['Harga terlihat sebelum membayar', 'Tutor diperiksa admin', 'Progress tercatat'],
                    'status_pending' => 'Memeriksa jadwal',
                    'status_found' => 'Tutor ditemukan',
                ],
            ],
            'trust' => [
                'eyebrow' => 'Dapat diperiksa, bukan sekadar dipercaya',
                'title' => 'Kepercayaan dibangun dari sistem yang jelas.',
                'description' => 'Setiap angka berasal dari sistem atau dilengkapi catatan sumber dan tanggal pembaruan.',
            ],
            'programs' => [
                'eyebrow' => 'Program unggulan',
                'title' => 'Program yang paling dibutuhkan siswa.',
                'description' => 'Cari mata pelajaran berdasarkan jenjang, lalu lanjutkan kebutuhanmu ke penyusunan paket.',
                'content' => ['search_placeholder' => 'Cari Matematika, Bahasa Inggris, Fisika...'],
            ],
            'final_cta' => [
                'eyebrow' => 'Mulai dari kebutuhanmu',
                'title' => 'Belajar lebih terarah dimulai dari kebutuhan yang jelas.',
                'description' => 'Pilih program sendiri atau konsultasikan kebutuhan belajar terlebih dahulu bersama BimbelKu.',
                'content' => ['secondary_cta_label' => 'Konsultasi WhatsApp'],
            ],
        ];

        foreach ($sections as $key => $content) {
            DB::table('website_sections')->where('section_key', $key)->update([
                'eyebrow' => $content['eyebrow'],
                'title' => $content['title'],
                'description' => $content['description'],
                'content' => isset($content['content'])
                    ? json_encode($content['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                    : null,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Konten yang mungkin sudah diedit admin tidak dihapus saat rollback kode.
    }
};
