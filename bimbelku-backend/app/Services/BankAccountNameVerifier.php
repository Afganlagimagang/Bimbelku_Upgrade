<?php

namespace App\Services;

/**
 * Bank-owner lookup must come from the banking network, not user-entered text.
 * Xendit Data Services Name Validator is not activated for this installation.
 */
class BankAccountNameVerifier
{
    public function available(): bool
    {
        return false;
    }

    public function matches(string $channelCode, string $accountNumber, string $expectedName): bool
    {
        // Fail closed until a provider-backed lookup is implemented and activated.
        return false;
    }
}
