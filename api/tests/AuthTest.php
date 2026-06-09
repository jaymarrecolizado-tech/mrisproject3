<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase
{
    private $baseUrl;
    private $db;

    protected function setUp(): void
    {
        $this->baseUrl = 'http://localhost:8000/api/index.php'; // Adjust if using different port
        $this->db = $_ENV['TEST_DB'] ?? null;
    }

    private function request(string $action, string $method = 'GET', array $body = [], string $token = null): array
    {
        $url = $this->baseUrl . '?action=' . $action;
        $ch = curl_init($url);
        
        $headers = ['Content-Type: application/json'];
        if ($token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }
        
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body ? json_encode($body) : null,
            CURLOPT_TIMEOUT => 10,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'code' => $httpCode,
            'data' => json_decode($response, true) ?? [],
        ];
    }

    public function testLoginValidCredentials(): void
    {
        // Assumes seed data has admin@dict.gov.ph / password123
        // We'll need to create a test user with known password
        $this->createTestUser('test@example.com', 'TestPass123!@#');
        
        $response = $this->request('auth.login', 'POST', [
            'email' => 'test@example.com',
            'password' => 'TestPass123!@#',
        ]);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['data']['success'] ?? false);
        $this->assertArrayHasKey('token', $response['data']['data'] ?? []);
        $this->assertArrayHasKey('user', $response['data']['data'] ?? []);
    }

    public function testLoginInvalidPassword(): void
    {
        $this->createTestUser('test2@example.com', 'TestPass123!@#');
        
        $response = $this->request('auth.login', 'POST', [
            'email' => 'test2@example.com',
            'password' => 'WrongPassword123!@#',
        ]);
        
        $this->assertEquals(401, $response['code']);
        $this->assertFalse($response['data']['success'] ?? true);
    }

    public function testLoginNonExistentUser(): void
    {
        $response = $this->request('auth.login', 'POST', [
            'email' => 'nonexistent@example.com',
            'password' => 'TestPass123!@#',
        ]);
        
        // Account enumeration protection: same error for invalid email and invalid password
        $this->assertEquals(401, $response['code']);
        $this->assertFalse($response['data']['success'] ?? true);
        $this->assertEquals('Invalid email or password', $response['data']['message'] ?? '');
    }

    public function testMeRequiresToken(): void
    {
        $response = $this->request('auth.me');
        $this->assertEquals(401, $response['code']);
    }

    public function testMeWithValidToken(): void
    {
        $this->createTestUser('test3@example.com', 'TestPass123!@#');
        $login = $this->request('auth.login', 'POST', [
            'email' => 'test3@example.com',
            'password' => 'TestPass123!@#',
        ]);
        
        $token = $login['data']['data']['token'] ?? '';
        $response = $this->request('auth.me', 'GET', [], $token);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['data']['success'] ?? false);
        $this->assertEquals('test3@example.com', $response['data']['data']['email'] ?? '');
    }

    public function testForgotPasswordAccountEnumerationProtection(): void
    {
        // Non-existent email should return same success message as existing email
        $response1 = $this->request('auth.forgot-password', 'POST', [
            'email' => 'nonexistent@example.com',
        ]);
        
        $this->createTestUser('test4@example.com', 'TestPass123!@#');
        $response2 = $this->request('auth.forgot-password', 'POST', [
            'email' => 'test4@example.com',
        ]);
        
        // Both should return 200 with same message (account enumeration protection)
        $this->assertEquals(200, $response1['code']);
        $this->assertEquals(200, $response2['code']);
        $this->assertEquals(
            'If the email exists, a reset link has been sent',
            $response1['data']['message'] ?? ''
        );
        $this->assertEquals(
            'If the email exists, a reset link has been sent',
            $response2['data']['message'] ?? ''
        );
    }

    public function testResetPasswordWithValidToken(): void
    {
        $this->createTestUser('test5@example.com', 'TestPass123!@#');
        
        // Request reset
        $this->request('auth.forgot-password', 'POST', [
            'email' => 'test5@example.com',
        ]);
        
        // Get the token from database
        $stmt = $this->db->prepare('SELECT token_hash FROM password_resets WHERE user_id = (SELECT id FROM users WHERE email = ?) ORDER BY created_at DESC LIMIT 1');
        $stmt->execute(['test5@example.com']);
        $row = $stmt->fetch();
        
        // We can't easily test the full flow without exposing the token
        // This is a placeholder for integration test
        $this->assertNotNull($row);
    }

    public function testResetPasswordInvalidToken(): void
    {
        $response = $this->request('auth.reset-password', 'POST', [
            'token' => 'invalid-token',
            'email' => 'test5@example.com',
            'new_password' => 'NewPass123!@#',
        ]);
        
        // Should return success to prevent account enumeration
        $this->assertEquals(200, $response['code']);
        $this->assertEquals('Password has been reset successfully', $response['data']['message'] ?? '');
    }

    private function createTestUser(string $email, string $password): void
    {
        if (!$this->db) {
            $this->markTestSkipped('Test database not available');
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare('
            INSERT IGNORE INTO users (name, email, password_hash, role_id, is_active) 
            VALUES (?, ?, ?, 1, 1)
        ');
        $stmt->execute(['Test User', $email, $hash]);
    }
}