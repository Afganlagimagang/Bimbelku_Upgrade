<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class XenditPaymentService
{
    public function configured(): bool
    {
        return (bool) config('xendit.enabled')
            && filled(config('xendit.secret_key'))
            && filled(config('xendit.webhook_token'));
    }

    public function createSession(Order $order, User $customer, string $mode = 'PAYMENT_LINK', ?string $origin = null): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Layanan pembayaran belum siap pada server.');
        }
        if (! in_array($mode, ['PAYMENT_LINK', 'COMPONENTS'], true)) {
            throw new RuntimeException('Mode pembayaran tidak dikenal.');
        }
        if ($mode === 'COMPONENTS') {
            if ($origin === null || ! in_array($origin, config('cors.allowed_origins', []), true)) {
                throw new RuntimeException('Alamat halaman pembayaran belum diizinkan. Periksa FRONTEND_ORIGINS pada server.');
            }
            if (parse_url($origin, PHP_URL_SCHEME) !== 'https') {
                if (! app()->environment(['local', 'testing'])) {
                    throw new RuntimeException('Pembayaran di dalam halaman memerlukan alamat HTTPS.');
                }
                // Xendit Components rejects HTTP origins, including localhost.
                // Keep the same invoice and use a hosted sandbox checkout locally.
                $mode = 'PAYMENT_LINK';
            }
        }

        $prepared = DB::transaction(function () use ($order) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($locked->gateway_status === 'ACTIVE'
                && filled($locked->gateway_session_id)
                && $locked->gateway_expires_at?->isFuture()) {
                return ['existing' => true, 'order' => $locked, 'reference' => $locked->gateway_reference_id];
            }
            if (! in_array($locked->status, ['pending', 'rejected', 'partially_paid'], true)) {
                throw new RuntimeException('Tagihan ini sudah tidak dapat dibayar.');
            }
            if ($this->externalDue($locked) <= 0.009) {
                throw new RuntimeException('Tagihan ini tidak memiliki sisa pembayaran eksternal.');
            }

            // Persist the reference before the remote request. A retry therefore uses
            // the same provider idempotency key even if the first response was lost.
            // A provider rejection (4xx) means no usable session was issued.
            // Rotate its reference so a corrected retry cannot collide with the
            // provider's old idempotency/customer reference. Ambiguous in-flight
            // requests remain CREATING and continue to reuse their reference.
            $rejectedWithoutSession = $locked->gateway_status === 'SESSION_FAILED'
                && blank($locked->gateway_session_id);
            $reference = $rejectedWithoutSession || blank($locked->gateway_reference_id)
                ? 'BKU-'.$locked->id.'-'.Str::upper(Str::random(12))
                : $locked->gateway_reference_id;
            $locked->forceFill([
                'payment_provider' => 'xendit',
                'gateway_reference_id' => $reference,
                'gateway_status' => 'CREATING',
            ])->save();
            return ['existing' => false, 'order' => $locked->fresh(), 'reference' => $reference];
        }, 3);

        if ($prepared['existing']) {
            $existing = $prepared['order'];
            if (filled($existing->gateway_checkout_url)) return $this->sessionPayload($existing);
            $session = $this->fetchSession($existing);
            $sdkKey = $session['components_sdk_key'] ?? null;
            if (! is_string($sdkKey) || $sdkKey === '') {
                throw new RuntimeException('Checkout yang sudah aktif belum dapat dimuat ulang. Periksa status pembayaran sebelum mencoba lagi.');
            }
            return $this->sessionPayload($existing, $sdkKey);
        }
        /** @var Order $locked */
        $locked = $prepared['order'];
        $reference = $prepared['reference'];
        $names = preg_split('/\s+/', trim((string) $customer->name), 2) ?: ['Murid BimbelKu'];
        $phone = $this->normalisePhone((string) ($customer->phone ?? ''));
        $individual = ['given_names' => $names[0] ?: 'Murid'];
        if (! empty($names[1])) $individual['surname'] = $names[1];
        $customerPayload = [
            'reference_id' => 'USER-'.$customer->id.'-'.$reference,
            'type' => 'INDIVIDUAL',
            'email' => $customer->email,
            'individual_detail' => $individual,
        ];
        if ($phone !== null) $customerPayload['mobile_number'] = $phone;

        $sessionRequest = [
                'reference_id' => $reference,
                'session_type' => 'PAY',
                'mode' => $mode,
                'amount' => (int) round($this->externalDue($locked)),
                'currency' => config('xendit.currency', 'IDR'),
                'country' => config('xendit.country', 'ID'),
                'customer' => $customerPayload,
                'description' => 'Pembayaran '.$locked->order_id.' BimbelKu',
                'metadata' => ['order_id' => (string) $locked->id, 'order_number' => $locked->order_id, 'user_id' => (string) $customer->id],
        ];
        if ($mode === 'COMPONENTS') {
            $componentsConfiguration = ['origins' => [$origin]];
            if (parse_url($origin, PHP_URL_SCHEME) === 'https') {
                $componentsConfiguration['return_url'] = rtrim($origin, '/').'/payment?checkout=resume';
            }
            $sessionRequest['components_configuration'] = $componentsConfiguration;
        } else {
            $sessionRequest = [...$sessionRequest, ...$this->returnUrls()];
        }

        $response = $this->client()
            ->withHeaders(['Idempotency-key' => 'xendit-session-'.$reference])
            ->post(config('xendit.base_url').'/sessions', $sessionRequest);
        if (! $response->successful()) {
            $locked->forceFill(['gateway_status' => 'SESSION_FAILED'])->save();
            report(new RuntimeException('Payment session failed: '.$response->status().' '.$response->body()));
            throw new RuntimeException($this->sessionFailureMessage(
                $response->status(),
                (string) $response->json('error_code', ''),
                (string) $response->json('message', '')
            ));
        }

        $data = $response->json();
        $sessionId = $data['payment_session_id'] ?? $data['id'] ?? null;
        $checkoutUrl = $data['payment_link_url'] ?? $data['payment_link'] ?? null;
        $sdkKey = $data['components_sdk_key'] ?? null;
        if (! is_string($sessionId)
            || ($mode === 'PAYMENT_LINK' && ! is_string($checkoutUrl))
            || ($mode === 'COMPONENTS' && ! is_string($sdkKey))) {
            $locked->forceFill(['gateway_status' => 'SESSION_FAILED'])->save();
            throw new RuntimeException('Komponen pembayaran belum tersedia. Periksa status tagihan sebelum mencoba lagi.');
        }
        $expiresAt = isset($data['expires_at']) ? Carbon::parse($data['expires_at']) : now()->addMinutes(max(15, (int) config('xendit.session_ttl_minutes', 60)));

        $saved = DB::transaction(function () use ($locked, $reference, $sessionId, $checkoutUrl, $data, $expiresAt) {
            $current = Order::query()->lockForUpdate()->findOrFail($locked->id);
            if ($current->gateway_reference_id !== $reference) {
                throw new RuntimeException('Referensi pembayaran berubah. Muat ulang tagihan.');
            }
            $current->forceFill([
                'gateway_session_id' => $sessionId,
                'gateway_checkout_url' => $checkoutUrl,
                'gateway_status' => strtoupper((string) ($data['status'] ?? 'ACTIVE')),
                'gateway_expires_at' => $expiresAt,
            ])->save();
            return $current->fresh();
        }, 3);

        return $this->sessionPayload($saved, is_string($sdkKey) ? $sdkKey : null);
    }


    public function fetchSession(Order $order): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Pembayaran otomatis belum dikonfigurasi pada server.');
        }
        if (blank($order->gateway_session_id)) {
            throw new RuntimeException('Session pembayaran belum tersedia.');
        }

        $response = $this->client()->get(
            config('xendit.base_url').'/sessions/'.rawurlencode((string) $order->gateway_session_id)
        );

        if (! $response->successful()) {
            report(new RuntimeException('Xendit get session failed: '.$response->status().' '.$response->body()));
            throw new RuntimeException('Status pembayaran belum dapat diperiksa. Coba kembali beberapa saat lagi.');
        }

        $data = $response->json();
        if (! is_array($data) || blank($data['status'] ?? null)) {
            throw new RuntimeException('Respons status pembayaran tidak valid.');
        }

        return $data;
    }

    private function returnUrls(): array
    {
        $urls = [];
        foreach (['success_return_url' => 'success_url', 'cancel_return_url' => 'cancel_url'] as $field => $key) {
            $url = (string) config('xendit.'.$key);
            if (filter_var($url, FILTER_VALIDATE_URL) && parse_url($url, PHP_URL_SCHEME) === 'https') {
                $urls[$field] = $url;
                continue;
            }
            // Optional return URLs cannot point to HTTP localhost. Payment status
            // is verified server-side when the customer returns to the application.
            if (! app()->environment(['local', 'testing'])) {
                throw new RuntimeException('Alamat kembali pembayaran harus menggunakan HTTPS. Hubungi pengelola BimbelKu.');
            }
        }
        return $urls;
    }

    private function sessionFailureMessage(int $status, string $errorCode = '', string $providerMessage = ''): string
    {
        if ($errorCode === 'INVALID_URL') {
            return 'Alamat kembali pembayaran belum dikonfigurasi dengan HTTPS. Hubungi pengelola BimbelKu.';
        }
        if ($errorCode === 'API_VALIDATION_ERROR' && str_contains($providerMessage, 'components_configuration.origins')) {
            return 'Pembayaran di dalam halaman memerlukan HTTPS. Pada localhost, muat ulang dan gunakan checkout aman.';
        }
        if ($errorCode === 'DUPLICATE_ERROR') {
            return 'Sesi pembayaran sebelumnya bentrok. Coba lagi; tagihan dan nominalmu tetap sama.';
        }
        return match (true) {
            in_array($status, [401, 403], true) => 'Layanan pembayaran belum terhubung dengan benar. Hubungi pengelola BimbelKu.',
            in_array($status, [400, 409, 422], true) => 'Pilihan pembayaran belum dapat dibuat dari data tagihan ini. Coba lagi atau hubungi bantuan jika masih gagal.',
            $status === 429 => 'Layanan pembayaran sedang sibuk. Tunggu sebentar lalu coba lagi; tagihan tidak akan dibuat ganda.',
            $status >= 500 => 'Jaringan pembayaran sedang mengalami gangguan. Coba lagi; tagihan tidak akan dibuat ganda.',
            default => 'Halaman pembayaran belum dapat dibuat. Coba lagi; tagihan tidak akan dibuat ganda.',
        };
    }

    private function client(): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->withBasicAuth((string) config('xendit.secret_key'), '')
            ->connectTimeout(8)
            ->timeout(20)
            ->retry(2, 250, throw: false);
    }

    private function sessionPayload(Order $order, ?string $sdkKey = null): array
    {
        return [
            'provider' => 'xendit',
            'mode' => filled($order->gateway_checkout_url) ? 'PAYMENT_LINK' : 'COMPONENTS',
            'session_id' => $order->gateway_session_id,
            'checkout_url' => $order->gateway_checkout_url,
            'components_sdk_key' => $sdkKey,
            'status' => $order->gateway_status,
            'expires_at' => $order->gateway_expires_at,
            'amount' => $this->externalDue($order),
        ];
    }

    public function externalDue(Order $order): float
    {
        $reserved = max(0, (float) $order->wallet_reserved_amount);
        $received = max(0, (float) $order->external_received_amount);
        $storedOutstanding = max(0, (float) $order->payment_outstanding_amount);
        if ($order->status === 'partially_paid' && $storedOutstanding > 0.009) return round($storedOutstanding, 2);
        return round(max(0, (float) $order->amount - $reserved - $received), 2);
    }

    private function normalisePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }
        if (! str_starts_with($digits, '62') || strlen($digits) < 10 || strlen($digits) > 15) {
            return null;
        }

        return '+'.$digits;
    }
}
