<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('singleton_key')->default(1)->unique();
            $table->string('brand_name', 80)->default('BimbelKu');
            $table->string('brand_description', 300)->nullable();
            $table->string('logo_path')->nullable();
            $table->string('logo_light_path')->nullable();
            $table->string('logo_dark_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('social_share_image_path')->nullable();
            $table->string('hero_desktop_image_path')->nullable();
            $table->string('hero_mobile_image_path')->nullable();
            $table->boolean('information_bar_enabled')->default(true);
            $table->string('information_bar_text', 180)->nullable();
            $table->json('navigation_items')->nullable();
            $table->string('primary_cta_label', 60)->default('Cari Bimbingan');
            $table->string('primary_cta_url', 500)->default('/student/packages/new');
            $table->boolean('whatsapp_enabled')->default(false);
            $table->string('whatsapp_number', 20)->nullable();
            $table->string('whatsapp_label', 60)->default('Konsultasi WhatsApp');
            $table->string('whatsapp_hours', 120)->nullable();
            $table->string('whatsapp_default_message', 500)->nullable();
            $table->string('contact_email')->nullable();
            $table->text('office_address')->nullable();
            $table->string('google_maps_url', 1000)->nullable();
            $table->boolean('animations_enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('website_sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_key', 80)->unique();
            $table->string('label', 100);
            $table->string('eyebrow', 100)->nullable();
            $table->string('title', 180)->nullable();
            $table->text('description')->nullable();
            $table->json('content')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->boolean('order_locked')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['is_visible', 'sort_order']);
        });

        Schema::create('website_trust_items', function (Blueprint $table) {
            $table->id();
            $table->string('title', 100);
            $table->string('display_value', 80)->nullable();
            $table->string('description', 180)->nullable();
            $table->string('icon_key', 60)->nullable();
            $table->string('source_type', 20)->default('system');
            $table->string('source_key', 60)->nullable();
            $table->text('source_note')->nullable();
            $table->date('source_updated_at')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['is_visible', 'sort_order']);
        });

        $now = now();
        DB::table('website_settings')->insert([
            'singleton_key' => 1,
            'brand_name' => 'BimbelKu',
            'brand_description' => 'Bimbingan belajar SD–SMA di Yogyakarta dengan pilihan belajar online dan offline.',
            'information_bar_enabled' => true,
            'information_bar_text' => 'Melayani Yogyakarta · Online & Offline',
            'navigation_items' => json_encode([
                ['key' => 'programs', 'label' => 'Program', 'url' => '/program'],
                ['key' => 'how-it-works', 'label' => 'Cara Kerja', 'url' => '/cara-kerja'],
                ['key' => 'tutors', 'label' => 'Tutor', 'url' => '/tutor'],
                ['key' => 'pricing', 'label' => 'Harga', 'url' => '/harga'],
                ['key' => 'help', 'label' => 'Bantuan', 'url' => '/bantuan'],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'primary_cta_label' => 'Cari Bimbingan',
            'primary_cta_url' => '/student/packages/new',
            'whatsapp_enabled' => false,
            'whatsapp_label' => 'Konsultasi WhatsApp',
            'whatsapp_hours' => 'Senin–Sabtu, 08.00–20.00 WIB',
            'whatsapp_default_message' => 'Halo BimbelKu, saya ingin berkonsultasi mengenai program belajar.',
            'contact_email' => 'info@bimbelku.com',
            'office_address' => 'Yogyakarta, Indonesia',
            'animations_enabled' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $sections = [
            ['hero', 'Hero', true],
            ['trust', 'Bukti kepercayaan', true],
            ['programs', 'Program', false],
            ['how_it_works', 'Cara kerja', true],
            ['proof', 'Bukti sistem', false],
            ['tutors', 'Tutor pilihan', false],
            ['pricing', 'Paket dan harga', false],
            ['progress', 'Dashboard dan progress', false],
            ['reviews', 'Ulasan', false],
            ['areas', 'Area layanan', false],
            ['faq', 'FAQ', false],
            ['final_cta', 'CTA akhir', false],
        ];
        foreach ($sections as $index => [$key, $label, $locked]) {
            DB::table('website_sections')->insert([
                'section_key' => $key,
                'label' => $label,
                'is_visible' => true,
                'order_locked' => $locked,
                'sort_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $trustItems = [
            ['Tutor diperiksa admin', 'verified_tutors', 'shield-check'],
            ['Harga terlihat sebelum membayar', null, 'receipt'],
            ['Jadwal dipilih sejak awal', null, 'calendar-check'],
            ['Progress tercatat setiap sesi', 'completed_sessions', 'chart-no-axes-column-increasing'],
        ];
        foreach ($trustItems as $index => [$title, $sourceKey, $icon]) {
            DB::table('website_trust_items')->insert([
                'title' => $title,
                'icon_key' => $icon,
                'source_type' => $sourceKey ? 'system' : 'commitment',
                'source_key' => $sourceKey,
                'is_visible' => true,
                'sort_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('website_trust_items');
        Schema::dropIfExists('website_sections');
        Schema::dropIfExists('website_settings');
    }
};
