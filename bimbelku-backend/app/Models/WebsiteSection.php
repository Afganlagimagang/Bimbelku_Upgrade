<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSection extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'content' => 'array',
        'is_visible' => 'boolean',
        'order_locked' => 'boolean',
        'sort_order' => 'integer',
    ];
}
