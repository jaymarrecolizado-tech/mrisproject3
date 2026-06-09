<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../helpers/JWT.php';

class JWTTest extends TestCase
{
    protected function setUp(): void
    {
        \JWT::setSecret('test-secret-key-for-testing-only-32-chars-minimum');
        \JWT::setExpiry(3600);
    }

    public function testEncodeDecode(): void
    {
        $payload = ['sub' => 1, 'email' => 'test@example.com', 'role' => 'admin'];
        $result = \JWT::encode($payload);
        
        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('token_version', $result);
        $this->assertIsString($result['token']);
        
        $decoded = \JWT::decode($result['token']);
        $this->assertNotFalse($decoded);
        $this->assertEquals(1, $decoded['sub']);
        $this->assertEquals('test@example.com', $decoded['email']);
        $this->assertEquals('admin', $decoded['role']);
    }

    public function testDecodeInvalidToken(): void
    {
        $this->assertFalse(\JWT::decode('invalid.token.string'));
        $this->assertFalse(\JWT::decode(''));
        $this->assertFalse(\JWT::decode('a.b.c'));
    }

    public function testDecodeExpiredToken(): void
    {
        \JWT::setExpiry(-1); // Expired
        $payload = ['sub' => 1];
        $result = \JWT::encode($payload);
        
        $this->assertFalse(\JWT::decode($result['token']));
    }

    public function testTokenVersionIncluded(): void
    {
        $payload = ['sub' => 1, 'token_version' => 5];
        $result = \JWT::encode($payload);
        $decoded = \JWT::decode($result['token']);
        
        $this->assertEquals(5, $result['token_version']);
    }

    public function testSetSecretThrowsOnEmpty(): void
    {
        $this->expectException(\RuntimeException::class);
        \JWT::setSecret('');
    }

    public function testSetSecretThrowsOnDefault(): void
    {
        $this->expectException(\RuntimeException::class);
        \JWT::setSecret('dict-mris-jwt-secret-change-in-production-2026');
    }
}