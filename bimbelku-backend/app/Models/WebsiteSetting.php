<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'information_bar_enabled' => 'boolean',
        'navigation_items' => 'array',
        'whatsapp_enabled' => 'boolean',
        'animations_enabled' => 'boolean',
    ];
}
