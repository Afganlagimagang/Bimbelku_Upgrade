<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('website_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('website_settings', 'trust_image_1_path')) {
                $table->string('trust_image_1_path')->nullable()->after('hero_mobile_image_path');
            }
            if (! Schema::hasColumn('website_settings', 'trust_image_2_path')) {
                $table->string('trust_image_2_path')->nullable()->after('trust_image_1_path');
            }
            if (! Schema::hasColumn('website_settings', 'trust_image_3_path')) {
                $table->string('trust_image_3_path')->nullable()->after('trust_image_2_path');
            }
        });

        if (! DB::table('website_trust_items')->where('source_key', 'active_programs')->exists()) {
            DB::table('website_trust_items')->increment('sort_order');
            DB::table('website_trust_items')->insert([
                'title' => 'Program belajar aktif',
                'description' => 'Pilihan mata pelajaran aktif yang tersedia di katalog BimbelKu.',
                'icon_key' => 'book-open-check',
                'source_type' => 'system',
                'source_key' => 'active_programs',
                'is_visible' => true,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $trust = DB::table('website_sections')->where('section_key', 'trust')->first();
        if ($trust) {
            $content = json_decode((string) ($trust->content ?? '{}'), true);
            $content = is_array($content) ? $content : [];
            $content += [
                'trust_media_titles' => ['Tutor pendamping', 'Sesi belajar', 'Bukti aktivitas'],
                'trust_media_notes' => [
                    'Foto tutor yang sudah memberi persetujuan publik.',
                    'Dokumentasi belajar yang aman untuk ditampilkan.',
                    'Cuplikan kegiatan atau fasilitas BimbelKu.',
                ],
            ];

            DB::table('website_sections')->where('id', $trust->id)->update([
                'content' => json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('website_trust_items')
            ->where('source_key', 'active_programs')
            ->where('title', 'Program belajar aktif')
            ->delete();

        foreach (['trust_image_3_path', 'trust_image_2_path', 'trust_image_1_path'] as $column) {
            if (Schema::hasColumn('website_settings', $column)) {
                Schema::table('website_settings', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }
    }
};
