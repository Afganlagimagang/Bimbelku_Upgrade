<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGatewayEvent extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function refund()
    {
        return $this->belongsTo(Refund::class);
    }

    public function payout()
    {
        return $this->belongsTo(Payout::class);
    }
}
