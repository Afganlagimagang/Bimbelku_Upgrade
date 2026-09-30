<?php

namespace App\Observers;

use App\Models\Payout;
use App\Services\FinancialLedgerService;

class PayoutObserver
{
    public function created(Payout $payout): void
    {
        if ($payout->status === 'completed') {
            app(FinancialLedgerService::class)->recordPayout($payout);
        }
    }

    public function updated(Payout $payout): void
    {
        if ($payout->wasChanged('status') && $payout->status === 'completed') {
            app(FinancialLedgerService::class)->recordPayout($payout);
        }
        if ($payout->wasChanged('status') && $payout->status === 'reversed') {
            app(FinancialLedgerService::class)->recordPayoutReversed($payout);
        }
    }
}
