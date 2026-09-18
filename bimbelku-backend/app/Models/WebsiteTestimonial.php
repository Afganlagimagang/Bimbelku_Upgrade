<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteTestimonial extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'achievement_year' => 'integer',
        'consent_at' => 'datetime',
        'verified_at' => 'datetime',
        'is_featured' => 'boolean',
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function rating()
    {
        return $this->belongsTo(Rating::class);
    }
}
