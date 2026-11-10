<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next, ?string $access = null): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Sesi tidak ditemukan. Silakan masuk kembali.',
            ], 401);
        }

        if ($user->role === 'student' && $user->status === 'pending'
            && $user->email_verified_at && $user->google_onboarding_required_at) {
            if ($access === 'google-onboarding' && $request->isMethod('GET')) {
                return $next($request);
            }

            return response()->json([
                'message' => 'Selesaikan persetujuan akun Google sebelum menggunakan fitur ini.',
                'error_code' => 'google_onboarding_required',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Sesi tidak berlaku karena akun sedang tidak aktif.',
            ], $user->role === 'admin' ? 403 : 401);
        }

        return $next($request);
    }
}
