<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\PaymentGatewayEvent;
use App\Models\Payout;
use App\Models\Refund;
use App\Models\TeacherPayoutRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class XenditWebhookService
{
    public function __construct(
        private readonly RefundSettlementService $refunds,
        private readonly TeacherPayoutService $payouts,
    ) {}

    public function handle(string $eventType, string $eventId, array $payload, array $data): void
    {
        if (str_starts_with($eventType, 'refund.')) {
            $this->handleRefund($eventType, $eventId, $payload, $data);
            return;
        }
        if (str_starts_with($eventType, 'v3_payout.')) {
            DB::transaction(fn () => $this->handlePayout($eventType, $eventId, $payload, $data), 3);
            return;
        }
        abort(422, 'Jenis notifikasi pembayaran tidak didukung oleh handler arus dana.');
    }

    private function handleRefund(string $eventType, string $eventId, array $payload, array $data): void
    {
        $refund = Refund::query()
            ->when(Arr::get($data, 'id'), fn ($q, $id) => $q->where('gateway_refund_id', $id))
            ->when(! Arr::get($data, 'id') && Arr::get($data, 'reference_id'), fn ($q) => $q->where('gateway_reference_id', Arr::get($data, 'reference_id')))
            ->first();
        $event = $this->event($eventId, $eventType, $payload, ['refund_id' => $refund?->id]);
        if (! $event->wasRecentlyCreated && $event->status === 'processed') return;
        if (! $refund) {
            $event->update(['status' => 'ignored', 'error' => 'Refund tidak ditemukan', 'processed_at' => now()]);
            return;
        }

        try {
            $status = strtoupper((string) (Arr::get($data, 'status') ?: Str::afterLast($eventType, '.')));
            $refund->forceFill([
                'payment_provider' => 'xendit',
                'gateway_refund_id' => Arr::get($data, 'id') ?: $refund->gateway_refund_id,
                'gateway_status' => $status,
                'gateway_failure_code' => Arr::get($data, 'failure_code'),
                'gateway_processed_at' => now(),
            ])->save();
            if ($eventType === 'refund.succeeded' || $status === 'SUCCEEDED') {
                $this->refunds->settle($refund->fresh(), 'xendit_original');
            } elseif (in_array($status, ['FAILED', 'REJECTED'], true)) {
                $this->refunds->notifyManualReview($refund->fresh());
            }
            $event->update(['status' => 'processed', 'error' => null, 'processed_at' => now()]);
        } catch (Throwable $exception) {
            $event->update(['status' => 'failed', 'error' => Str::limit($exception->getMessage(), 1500)]);
            throw $exception;
        }
    }

    private function handlePayout(string $eventType, string $eventId, array $payload, array $data): void
    {
        $payoutId = Arr::get($data, 'payout_id');
        $reference = Arr::get($data, 'reference_id');
        $payout = Payout::query()
            ->where(function ($query) use ($payoutId, $reference) {
                $query->whereRaw('1 = 0');
                if ($payoutId) $query->orWhere('gateway_payout_id', $payoutId);
                if ($reference) $query->orWhere('gateway_reference_id', $reference);
            })->lockForUpdate()->first();
        $event = $this->event($eventId, $eventType, $payload, ['payout_id' => $payout?->id]);
        if (! $event->wasRecentlyCreated && $event->status === 'processed') return;
        if (! $payout) {
            $event->update(['status' => 'ignored', 'error' => 'Payout tidak ditemukan', 'processed_at' => now()]);
            return;
        }

        if (in_array($payout->status, ['completed', 'failed'], true)) {
            $event->update(['status' => 'processed', 'processed_at' => now()]);
            return;
        }
        try {
            $status = strtoupper((string) (Arr::get($data, 'status') ?: Str::afterLast($eventType, '.')));
            $succeeded = $eventType === 'v3_payout.succeeded' || $status === 'SUCCEEDED';
            $failed = in_array($status, ['FAILED', 'REJECTED', 'REVERSED', 'CANCELLED', 'EXPIRED'], true);
            $payout->forceFill([
                'gateway_payout_id' => Arr::get($data, 'payout_id') ?: $payout->gateway_payout_id,
                'gateway_status' => $status,
                'gateway_failure_code' => Arr::get($data, 'failure_code'),
                'gateway_processed_at' => now(),
                'status' => 'processing',
            ])->save();

            if ($succeeded) {
                $this->payouts->complete($payout->fresh());
                Notification::firstOrCreate(['unique_key' => "payout-completed:{$payout->id}"], [
                    'user_id' => $payout->user_id,
                    'title' => 'Pendapatan berhasil dikirim',
                    'message' => 'Pencairan sebesar Rp'.number_format((float) $payout->amount, 0, ',', '.').' berhasil dikirim ke rekening terdaftar.',
                    'type' => 'success', 'target_url' => '/guru/dompet',
                ]);
            } elseif ($failed) {
                $this->payouts->release($payout->fresh(), 'Penyedia pembayaran: '.($payout->gateway_failure_code ?: $status));
                Notification::firstOrCreate(['unique_key' => "payout-failed:{$payout->id}:{$status}"], [
                    'user_id' => $payout->user_id,
                    'title' => 'Pencairan belum berhasil',
                    'message' => 'Dana belum terkirim dan otomatis kembali menjadi saldo tersedia. Periksa kembali rekening tujuan.',
                    'type' => 'warning', 'target_url' => '/guru/dompet#rekening',
                ]);
            }
            $event->update(['status' => 'processed', 'error' => null, 'processed_at' => now()]);
        } catch (Throwable $exception) {
            $event->update(['status' => 'failed', 'error' => Str::limit($exception->getMessage(), 1500)]);
            throw $exception;
        }
    }

    private function event(string $eventId, string $eventType, array $payload, array $links): PaymentGatewayEvent
    {
        return PaymentGatewayEvent::firstOrCreate(['event_id' => 'xendit:'.$eventId], array_merge([
            'provider' => 'xendit', 'event_type' => $eventType, 'payload' => $payload, 'status' => 'received',
        ], $links));
    }
}
