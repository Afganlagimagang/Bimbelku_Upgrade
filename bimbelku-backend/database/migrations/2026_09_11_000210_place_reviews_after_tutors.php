<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $order = [
            'tutors' => 5,
            'reviews' => 6,
            'pricing' => 7,
            'progress' => 8,
            'areas' => 9,
            'faq' => 10,
            'final_cta' => 11,
        ];

        foreach ($order as $sectionKey => $sortOrder) {
            DB::table('website_sections')->where('section_key', $sectionKey)->update([
                'sort_order' => $sortOrder,
                'updated_at' => now(),
            ]);
        }

        $copy = [
            'tutors' => [
                'eyebrow' => 'Kenali tutor BimbelKu',
                'title' => 'Tutor yang siap mendampingi proses belajarmu.',
                'description' => 'Galeri hanya memuat tutor yang telah diverifikasi dan memberikan izin untuk ditampilkan.',
                'previous_title' => 'Bukan sekadar banyak. Tutor harus siap mengajar.',
            ],
            'reviews' => [
                'eyebrow' => 'Cerita dari proses belajar',
                'title' => 'Testimoni punya ruang sendiri, agar mudah dibaca.',
                'description' => 'Ulasan nyata akan ditampilkan setelah terhubung ke rating kelas dan memperoleh persetujuan publik.',
                'previous_title' => 'Rating terhubung ke aktivitas belajar, bukan angka tempelan.',
            ],
        ];

        foreach ($copy as $sectionKey => $values) {
            DB::table('website_sections')
                ->where('section_key', $sectionKey)
                ->where('title', $values['previous_title'])
                ->update([
                    'eyebrow' => $values['eyebrow'],
                    'title' => $values['title'],
                    'description' => $values['description'],
                    'updated_at' => now(),
                ]);
        }

        $trust = DB::table('website_sections')->where('section_key', 'trust')->first();
        if ($trust) {
            $content = json_decode((string) ($trust->content ?? '{}'), true);
            if (is_array($content) && ($content['trust_media_titles'] ?? null) === ['Tutor pendamping', 'Sesi belajar', 'Bukti aktivitas']) {
                $content['trust_media_titles'] = ['Tutor pendamping', 'Tutor mata pelajaran', 'Tutor sesuai jenjang'];
                $content['trust_media_notes'] = [
                    'Foto tutor yang sudah memberi persetujuan publik.',
                    'Dokumentasi profil yang aman untuk ditampilkan.',
                    'Identitas sensitif tetap tidak dipublikasikan.',
                ];
                DB::table('website_sections')->where('id', $trust->id)->update([
                    'content' => json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $order = [
            'tutors' => 5,
            'pricing' => 6,
            'progress' => 7,
            'reviews' => 8,
            'areas' => 9,
            'faq' => 10,
            'final_cta' => 11,
        ];

        foreach ($order as $sectionKey => $sortOrder) {
            DB::table('website_sections')->where('section_key', $sectionKey)->update([
                'sort_order' => $sortOrder,
                'updated_at' => now(),
            ]);
        }
    }
};
