<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('website_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('website_settings', 'trust_image_4_path')) {
                $table->string('trust_image_4_path')->nullable()->after('trust_image_3_path');
            }
            if (! Schema::hasColumn('website_settings', 'trust_image_5_path')) {
                $table->string('trust_image_5_path')->nullable()->after('trust_image_4_path');
            }
            if (! Schema::hasColumn('website_settings', 'trust_image_6_path')) {
                $table->string('trust_image_6_path')->nullable()->after('trust_image_5_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('website_settings', function (Blueprint $table) {
            foreach (['trust_image_6_path', 'trust_image_5_path', 'trust_image_4_path'] as $column) {
                if (Schema::hasColumn('website_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
