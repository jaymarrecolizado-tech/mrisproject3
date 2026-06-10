<?php
/**
 * DICT MRIS — JWT Implementation with Access + Refresh Token Rotation
 * Access tokens: 15 min, Refresh tokens: 7 days (rotating)
 * Algorithm: HS256 (configurable for future RS256 migration)
 */

class JWT {
    private static string $secret;
    private static string $algorithm = 'HS256';
    private static int $accessExpiry = 900;      // 15 minutes
    private static int $refreshExpiry = 604800;  // 7 days
    private static string $issuer = 'dict-mris';
    private static string $audience = 'dict-mris-app';

    public static function setSecret(string $secret): void {
        $normalized = trim($secret);
        if ($normalized === '') {
            throw new \RuntimeException(
                'JWT_SECRET is not set. Set a strong, unique secret in the .env file.'
            );
        }
        if (strlen($normalized) < 32) {
            throw new \RuntimeException(
                'JWT_SECRET must be at least 32 characters long. ' .
                'Generate with: openssl rand -base64 32'
            );
        }
        // Check for common weak/default values
        $weakValues = [
            'dict-mris-jwt-secret-change-in-production-2026',
            'change-me',
            'secret',
            'default',
            'jwt-secret',
            'my-secret-key',
        ];
        if (in_array(strtolower($normalized), $weakValues, true)) {
            throw new \RuntimeException(
                'JWT_SECRET is using a known weak/default value. ' .
                'Generate a strong secret with: openssl rand -base64 32'
            );
        }
        self::$secret = $normalized;
    }

    public static function setAlgorithm(string $algorithm): void {
        $allowed = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
        if (!in_array($algorithm, $allowed, true)) {
            throw new \InvalidArgumentException('Unsupported algorithm: ' . $algorithm);
        }
        self::$algorithm = $algorithm;
    }

    public static function setIssuer(string $issuer): void {
        self::$issuer = $issuer;
    }

    public static function setAudience(string $audience): void {
        self::$audience = $audience;
    }

    public static function setAccessExpiry(int $seconds): void {
        self::$accessExpiry = $seconds;
    }

    public static function setRefreshExpiry(int $seconds): void {
        self::$refreshExpiry = $seconds;
    }

    public static function setExpiry(int $seconds): void {
        self::setAccessExpiry($seconds);
    }

    public static function encode(array $payload): array {
        $tokenVersion = (int)($payload['token_version'] ?? 0);

        return [
            'token' => self::encodeAccess($payload),
            'token_version' => $tokenVersion,
        ];
    }

    /**
     * Encode access token (short-lived)
     */
    public static function encodeAccess(array $payload): string {
        if (empty(self::$secret)) {
            throw new \RuntimeException('JWT secret not configured');
        }
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + self::$accessExpiry;
        $payload['type'] = 'access';
        $payload['iss'] = self::$issuer;
        $payload['aud'] = self::$audience;
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]));
        $payloadEnc = self::base64UrlEncode(json_encode($payload));
        $signature = self::sign("{$header}.{$payloadEnc}");
        return "{$header}.{$payloadEnc}.{$signature}";
    }

    /**
     * Encode refresh token (long-lived, stored in DB with hash)
     */
    public static function encodeRefresh(array $payload): array {
        if (empty(self::$secret)) {
            throw new \RuntimeException('JWT secret not configured');
        }
        $jti = bin2hex(random_bytes(32)); // JWT ID for revocation
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + self::$refreshExpiry;
        $payload['type'] = 'refresh';
        $payload['jti'] = $jti;
        $payload['iss'] = self::$issuer;
        $payload['aud'] = self::$audience;
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]));
        $payloadEnc = self::base64UrlEncode(json_encode($payload));
        $signature = self::sign("{$header}.{$payloadEnc}");
        return [
            'token' => "{$header}.{$payloadEnc}.{$signature}",
            'jti' => $jti,
            'expires_at' => date('Y-m-d H:i:s', $payload['exp']),
        ];
    }

    /**
     * Decode and validate any token (access or refresh)
     */
    public static function decode(string $token): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $payload, $signature] = $parts;

        if (!self::verify("{$header}.{$payload}", $signature)) return false;

        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!$decoded) return false;
        if (isset($decoded['exp']) && $decoded['exp'] < time()) return false;
        if (isset($decoded['iss']) && $decoded['iss'] !== self::$issuer) return false;
        if (isset($decoded['aud']) && $decoded['aud'] !== self::$audience) return false;

        return $decoded;
    }

    /**
     * Decode without expiry check (for expired refresh token rotation)
     */
    public static function decodeNoExpiryCheck(string $token): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $payload, $signature] = $parts;

        if (!self::verify("{$header}.{$payload}", $signature)) return false;

        $decoded = json_decode(self::base64UrlDecode($payload), true) ?? false;
        if (!$decoded) return false;
        if (isset($decoded['iss']) && $decoded['iss'] !== self::$issuer) return false;
        if (isset($decoded['aud']) && $decoded['aud'] !== self::$audience) return false;

        return $decoded;
    }

    private static function sign(string $input): string {
        return self::base64UrlEncode(hash_hmac('sha256', $input, self::$secret, true));
    }

    private static function verify(string $input, string $signature): bool {
        $expected = self::sign($input);
        return hash_equals($expected, $signature);
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
