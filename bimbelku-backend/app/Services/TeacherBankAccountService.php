<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Support\XenditPayoutChannelCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TeacherBankAccountService
{
    public function rules(): array
    {
        return [
            'payout_channel_code' => ['nullable', 'required_without:bank_name', 'string', Rule::in(XenditPayoutChannelCatalog::codes())],
            'bank_name' => ['nullable', 'required_without:payout_channel_code', 'string', 'max:100', 'regex:/\pL/u'],
            'account_number' => ['required', 'string', 'min:8', 'max:20', 'regex:/^[0-9]+$/'],
            'account_name' => ['required', 'string', 'max:150', 'regex:/\pL/u', 'not_regex:/\d/u'],
            'current_password' => ['required', 'string', 'max:200'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/\pL/u'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_number.min' => 'Nomor rekening minimal 8 digit.',
            'account_number.max' => 'Nomor rekening maksimal 20 digit.',
            'account_number.regex' => 'Nomor rekening hanya boleh berisi angka.',
            'account_name.regex' => 'Nama pemilik rekening wajib mengandung huruf.',
            'account_name.not_regex' => 'Nama pemilik rekening tidak boleh memuat angka.',
            'address.required' => 'Isi alamat lengkap pada formulir pencairan.',
            'address.regex' => 'Alamat lengkap wajib mengandung huruf.',
            'current_password.required' => 'Masukkan kata sandi akun tutor untuk mengonfirmasi pencairan.',
        ];
    }

    public function save(User $teacher, array $data): array
    {
        $holder = trim(preg_replace('/\s+/u', ' ', $data['account_name']) ?? $data['account_name']);
        $channelCode = $data['payout_channel_code'] ?? XenditPayoutChannelCatalog::inferCode($data['bank_name'] ?? null);
        $channel = $channelCode ? XenditPayoutChannelCatalog::get($channelCode) : null;
        if (! $channel) {
            throw ValidationException::withMessages(['payout_channel_code' => 'Pilih bank yang mendukung pencairan otomatis.']);
        }

        $result = DB::transaction(function () use ($teacher, $data, $holder, $channelCode, $channel) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($teacher->id);
            abort_unless($lockedUser->role === 'teacher' && $lockedUser->status === 'active', 403, 'Akun tutor sedang tidak aktif.');
            if (! Hash::check($data['current_password'], $lockedUser->password)) {
                throw ValidationException::withMessages(['current_password' => 'Kata sandi akun tidak sesuai.']);
            }
            $profile = TeacherProfile::query()->firstOrCreate(['user_id' => $lockedUser->id]);
            $profile = TeacherProfile::query()->lockForUpdate()->findOrFail($profile->id);
            $fingerprint = hash_hmac('sha256', implode('|', [
                $channelCode, $data['account_number'], mb_strtolower($holder),
            ]), (string) config('app.key'));
            $changed = ! hash_equals((string) $profile->bank_account_fingerprint, $fingerprint);
            if ($changed) {
                $profile->forceFill([
                    'bank_name' => $channel['label'], 'payout_channel_code' => $channelCode,
                    'account_number' => $data['account_number'], 'account_name' => $holder,
                    'bank_account_fingerprint' => $fingerprint, 'bank_account_changed_at' => now(),
                    'bank_details_version' => (int) $profile->bank_details_version + 1,
                ]);
            }
            // The confirmed withdrawal is sent immediately; clear legacy holds.
            $profile->payout_hold_until = null;
            $profile->save();
            if (array_key_exists('address', $data)) {
                $lockedUser->address = trim((string) $data['address']) ?: null;
                $lockedUser->save();
            }
            if ($changed) {
                Notification::create([
                    'user_id' => $teacher->id, 'title' => 'Rekening pencairan diperbarui',
                    'message' => 'Data rekening pencairan Anda diperbarui setelah konfirmasi kata sandi.',
                    'type' => 'info', 'target_url' => '/guru/dompet',
                ]);
            }
            return ['changed' => $changed, 'payout_hold_until' => null];
        }, 3);
        $teacher->refresh();

        return $result;
    }
}
