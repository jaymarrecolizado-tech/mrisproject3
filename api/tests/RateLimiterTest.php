<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../helpers/RateLimiter.php';

class RateLimiterTest extends TestCase
{
    protected function setUp(): void
    {
        // Clean up rate limit files before each test
        $dir = __DIR__ . '/../uploads/rate_limit/';
        if (is_dir($dir)) {
            foreach (glob($dir . '*.json') as $file) {
                unlink($file);
            }
        }
    }

    public function testAllowsRequestsUnderLimit(): void
    {
        $identifier = 'test_ip_1';
        $maxAttempts = 5;
        $windowSeconds = 60;
        
        for ($i = 0; $i < $maxAttempts; $i++) {
            $this->assertTrue(\RateLimiter::check($identifier, $maxAttempts, $windowSeconds));
        }
    }

    public function testBlocksRequestsOverLimit(): void
    {
        $identifier = 'test_ip_2';
        $maxAttempts = 3;
        $windowSeconds = 60;
        
        for ($i = 0; $i < $maxAttempts; $i++) {
            \RateLimiter::check($identifier, $maxAttempts, $windowSeconds);
        }
        
        $this->assertFalse(\RateLimiter::check($identifier, $maxAttempts, $windowSeconds));
    }

    public function testResetClearsLimit(): void
    {
        $identifier = 'test_ip_3';
        $maxAttempts = 2;
        $windowSeconds = 60;
        
        \RateLimiter::check($identifier, $maxAttempts, $windowSeconds);
        \RateLimiter::check($identifier, $maxAttempts, $windowSeconds);
        $this->assertFalse(\RateLimiter::check($identifier, $maxAttempts, $windowSeconds));
        
        \RateLimiter::reset($identifier);
        $this->assertTrue(\RateLimiter::check($identifier, $maxAttempts, $windowSeconds));
    }

    public function testDifferentIdentifiersIndependent(): void
    {
        \RateLimiter::check('ip_a', 1, 60);
        \RateLimiter::check('ip_a', 1, 60); // Should be blocked
        
        $this->assertTrue(\RateLimiter::check('ip_b', 1, 60)); // Different IP should work
    }
}