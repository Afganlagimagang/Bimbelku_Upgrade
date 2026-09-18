<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = DB::table('website_settings')->where('singleton_key', 1)->first();
        if (! $settings) {
            return;
        }

        $items = json_decode((string) $settings->navigation_items, true);
        if (! is_array($items)) {
            return;
        }

        $changed = false;
        foreach ($items as &$item) {
            if (($item['key'] ?? null) === 'programs' && in_array($item['url'] ?? null, ['/#program', '/program'], true)) {
                $item['url'] = '/program';
                $changed = true;
            }
        }
        unset($item);

        if ($changed) {
            DB::table('website_settings')->where('singleton_key', 1)->update([
                'navigation_items' => json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // URL yang mungkin sudah disesuaikan admin tidak diubah saat rollback.
    }
};
