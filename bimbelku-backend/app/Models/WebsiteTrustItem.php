<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteTrustItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'source_updated_at' => 'date',
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];
}
