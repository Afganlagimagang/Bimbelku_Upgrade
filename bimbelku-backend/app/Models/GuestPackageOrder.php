<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestPackageOrder extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['payload', 'result_snapshot'];

    protected $casts = [
        'payload' => 'array',
        'result_snapshot' => 'array',
        'quoted_total_amount' => 'decimal:2',
        'claimed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
