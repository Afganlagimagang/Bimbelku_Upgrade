<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectPageContent extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'facts' => 'array',
        'learning_map' => 'array',
        'learning_journey' => 'array',
        'benefits' => 'array',
        'suitable_for' => 'array',
        'reasons' => 'array',
        'articles' => 'array',
        'faqs' => 'array',
        'reviewed_at' => 'date:Y-m-d',
        'is_published' => 'boolean',
    ];
}
