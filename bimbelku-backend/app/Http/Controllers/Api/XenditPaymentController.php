<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentGatewayEvent;
use App\Services\CheapClassService;
use App\Services\PackageCheckoutService;
use App\Services\XenditPaymentService;
use App\Services\XenditWebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class XenditPaymentController extends Controller
{
    public function createSession(Request $request, Order $order, XenditPaymentService $xendit)
    {
        $validated = $request->validate(['mode' => 'sometimes|in:components,payment_link']);
        abort_unless((int) $order->user_id === (int) $request->user()->id, 403);
        abort_unless(in_array($order->status, ['pending', 'rejected', 'partially_paid'], true), 422, 'Tagihan ini sudah tidak dapat dibayar.');
        abort_if($order->learningPackage?->payment_due_at && ! $order->learningPackage->payment_due_at->isFuture(), 422, 'Batas pembayaran paket sudah berakhir.');
        abort_if($order->cheapClassEnrollment?->seat_expires_at && ! $order->cheapClassEnrollment->seat_expires_at->isFuture(), 422, 'Batas pembayaran kursi sudah berakhir.');

        try {
            $mode = ($validated['mode'] ?? 'payment_link') === 'components' ? 'COMPONENTS' : 'PAYMENT_LINK';
            return response()->json(['data' => $xendit->createSession($order, $request->user(), $mode, $request->header('Origin'))])
                ->header('Cache-Control', 'no-store');
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => $xendit->configured() ? 'xendit_unavailable' : 'xendit_not_configured',
            ], $xendit->configured() ? 502 : 503);
        }
    }

    public function sync(
        Request $request,
        Order $order,
        PackageCheckoutService $packages,
        CheapClassService $cheapClasses,
        XenditPaymentService $xendit
    ) {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 403);

        if (blank($order->gateway_session_id) || $order->status === 'paid') {
            return response()->json([
                'status' => $order->status,
                'gateway_status' => $order->gateway_status,
            ]);
        }

        try {
            $data = $xendit->fetchSession($order);
            $status = strtoupper((string) Arr::get($data, 'status', ''));
            $successful = in_array($status, ['COMPLETED', 'SUCCEEDED', 'PAID', 'CAPTURED'], true);

            if ($successful) {
                $this->settleSuccessfulPayment($order, $data, $xendit, $packages, $cheapClasses);
            } else {
                $order->forceFill([
                    'gateway_status' => $status ?: $order->gateway_status,
                    'gateway_expires_at' => Arr::get($data, 'expires_at') ?: $order->gateway_expires_at,
                ])->save();
            }

            $fresh = $order->fresh();

            return response()->json([
                'status' => $fresh->status,
                'gateway_status' => $fresh->gateway_status,
                'gateway_paid_at' => $fresh->gateway_paid_at,
            ]);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 502);
        }
    }

    public function webhook(
        Request $request,
        PackageCheckoutService $packages,
        CheapClassService $cheapClasses,
        XenditPaymentService $xendit,
        XenditWebhookService $moneyWebhooks
    ) {
        $configuredToken = (string) config('xendit.webhook_token');
        $receivedToken = (string) $request->header('x-callback-token', '');
        abort_if($configuredToken === '' || ! hash_equals($configuredToken, $receivedToken), 401, 'Webhook token tidak valid.');

        $payload = $request->all();
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $eventType = strtolower((string) ($payload['event'] ?? $payload['event_type'] ?? 'unknown'));
        $eventId = (string) ($payload['id'] ?? $payload['event_id'] ?? $request->header('webhook-id', ''));
        if ($eventId === '') {
            $eventId = 'hash-'.hash('sha256', $request->getContent());
        }

        if (str_starts_with($eventType, 'refund.') || str_starts_with($eventType, 'v3_payout.')) {
            $moneyWebhooks->handle($eventType, $eventId, $payload, $data);
            return response()->json(['received' => true]);
        }

        $sessionId = Arr::get($data, 'payment_session_id')
            ?? Arr::get($data, 'session_id')
            ?? Arr::get($data, 'payment_session.id');
        $reference = Arr::get($data, 'reference_id')
            ?? Arr::get($data, 'payment_session.reference_id');
        $orderId = Arr::get($data, 'metadata.order_id')
            ?? Arr::get($data, 'payment_session.metadata.order_id');

        $order = Order::query()
            ->when($sessionId, fn ($query) => $query->where('gateway_session_id', $sessionId))
            ->when(! $sessionId && $reference, fn ($query) => $query->where('gateway_reference_id', $reference))
            ->when(! $sessionId && ! $reference && $orderId, fn ($query) => $query->whereKey($orderId))
            ->first();

        $event = PaymentGatewayEvent::firstOrCreate(
            ['event_id' => 'xendit:'.$eventId],
            [
                'provider' => 'xendit',
                'event_type' => $eventType,
                'order_id' => $order?->id,
                'payload' => $payload,
                'status' => 'received',
            ]
        );
        if (! $event->wasRecentlyCreated && $event->status === 'processed') {
            return response()->json(['received' => true]);
        }
        if (! $order) {
            $event->update(['status' => 'ignored', 'error' => 'Order tidak ditemukan', 'processed_at' => now()]);
            return response()->json(['received' => true], 202);
        }

        $status = strtoupper((string) (Arr::get($data, 'status') ?? Arr::get($data, 'payment_session.status') ?? ''));
        $successful = Str::contains($eventType, ['payment_session.completed', 'payment.succeeded', 'payment.capture'])
            || in_array($status, ['COMPLETED', 'SUCCEEDED', 'PAID', 'CAPTURED'], true);

        if (! $successful) {
            $gatewayStatus = in_array($status, ['EXPIRED', 'CANCELED', 'CANCELLED', 'FAILED'], true) ? $status : ($status ?: 'EVENT_RECEIVED');
            $order->forceFill(['gateway_status' => $gatewayStatus])->save();
            $event->update(['status' => 'processed', 'processed_at' => now()]);
            return response()->json(['received' => true]);
        }

        $paidAmount = $this->paidAmount($data);
        if ($paidAmount <= 0 && filled($order->gateway_session_id)) {
            // Some completion notifications omit the amount. Verify the session
            // server-to-server before accepting it instead of trusting a blank value.
            $verified = $xendit->fetchSession($order);
            $data = array_replace_recursive($data, $verified);
            $paidAmount = $this->paidAmount($data);
        }
        $expectedAmount = $xendit->externalDue($order);
        if ($paidAmount <= 0 || ($order->status !== 'submitted' && abs($paidAmount - $expectedAmount) > 0.009)) {
            $event->update(['status' => 'failed', 'error' => 'Nominal webhook tidak sama dengan tagihan.']);
            return response()->json(['received' => true], 202);
        }

        try {
            $this->settleSuccessfulPayment($order, $data, $xendit, $packages, $cheapClasses);
            $event->update(['order_id' => $order->id, 'status' => 'processed', 'error' => null, 'processed_at' => now()]);
        } catch (Throwable $exception) {
            $event->update(['status' => 'failed', 'error' => Str::limit($exception->getMessage(), 1500)]);
            throw $exception;
        }

        return response()->json(['received' => true]);
    }

    private function settleSuccessfulPayment(
        Order $order,
        array $data,
        XenditPaymentService $xendit,
        PackageCheckoutService $packages,
        CheapClassService $cheapClasses
    ): void {
        Cache::lock('gateway-order-settlement:'.$order->id, 60)->block(15, function () use ($order, $data, $xendit, $packages, $cheapClasses) {
            $current = $order->fresh();
            if (in_array($current->status, ['paid', 'refund_pending', 'refunded'], true)) {
                return;
            }

            $paidAmount = $this->paidAmount($data);
            if ($current->status !== 'submitted') {
                $expectedAmount = $xendit->externalDue($current);
                if ($paidAmount > 0 && abs($paidAmount - $expectedAmount) > 0.009) {
                    throw new RuntimeException('Nominal pembayaran tidak sama dengan tagihan.');
                }

                DB::transaction(function () use ($current, $data, $paidAmount) {
                    $locked = Order::query()->lockForUpdate()->findOrFail($current->id);
                    if (in_array($locked->status, ['paid', 'refund_pending', 'refunded'], true)) {
                        return;
                    }
                    if ($locked->status === 'submitted' && $locked->gateway_status === 'COMPLETED') {
                        return;
                    }

                    abort_unless(in_array($locked->status, ['pending', 'rejected', 'partially_paid'], true), 409, 'Tagihan tidak lagi dapat diselesaikan.');
                    $locked->forceFill([
                        'payment_provider' => 'xendit',
                        'gateway_payment_id' => Arr::get($data, 'payment_id') ?? Arr::get($data, 'payment.id'),
                        'gateway_payment_request_id' => Arr::get($data, 'payment_request_id') ?? Arr::get($data, 'payment_request.id'),
                        'gateway_status' => 'COMPLETED',
                        'gateway_paid_at' => now(),
                        'status' => 'submitted',
                        'external_received_amount' => round((float) $locked->external_received_amount + ($paidAmount > 0 ? $paidAmount : max(0, (float) $locked->amount - (float) $locked->wallet_reserved_amount)), 2),
                        'payment_outstanding_amount' => 0,
                        'payment_surplus_amount' => 0,
                        'payment_reconciliation_status' => 'exact',
                        'payment_submitted_at' => now(),
                        'payment_rejection_reason' => null,
                    ])->save();
                }, 3);
            }

            $fresh = $order->fresh();
            if ($fresh->status !== 'submitted') {
                return;
            }
            if ($fresh->learning_package_id) {
                $packages->activatePaidPackage($fresh, null);
            } elseif ($fresh->cheap_class_enrollment_id) {
                $result = $cheapClasses->verifyPayment($fresh, 'paid', '', null);
                if (! empty($result['class_id'])) {
                    $class = \App\Models\CheapClass::find($result['class_id']);
                    if ($class) {
                        $cheapClasses->finalizeIfReady($class);
                    }
                }
            }
        });
    }

    private function paidAmount(array $data): float
    {
        return (float) (Arr::get($data, 'amount')
            ?? Arr::get($data, 'payment_details.amount')
            ?? Arr::get($data, 'payment.amount')
            ?? 0);
    }
}
