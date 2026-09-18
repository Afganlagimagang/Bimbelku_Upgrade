<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addDesktop = ! Schema::hasColumn('website_settings', 'hero_desktop_image_path');
        $addMobile = ! Schema::hasColumn('website_settings', 'hero_mobile_image_path');
        if ($addDesktop || $addMobile) {
            Schema::table('website_settings', function (Blueprint $table) use ($addDesktop, $addMobile) {
                if ($addDesktop) {
                    $table->string('hero_desktop_image_path')->nullable()->after('social_share_image_path');
                }
                if ($addMobile) {
                    $table->string('hero_mobile_image_path')->nullable()->after('hero_desktop_image_path');
                }
            });
        }

        DB::table('website_settings')
            ->whereNull('whatsapp_number')
            ->update(['whatsapp_enabled' => false]);
    }

    public function down(): void
    {
        foreach (['hero_mobile_image_path', 'hero_desktop_image_path'] as $column) {
            if (Schema::hasColumn('website_settings', $column)) {
                Schema::table('website_settings', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }
    }
};
