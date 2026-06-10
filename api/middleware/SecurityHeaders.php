<?php
/**
 * DICT MRIS — Security Headers Middleware
 * Applies security headers to all API responses
 */

class SecurityHeaders {
    public static function apply(): void {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // XSS Protection (legacy but still useful for older browsers)
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer Policy - strict origin when cross-origin
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions Policy - restrict browser features
        header('Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
        
        // Content Security Policy - restrictive for API
        // API endpoints should not load any resources
        $csp = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
        header("Content-Security-Policy: $csp");
        
        // HSTS - only apply in production with HTTPS
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            // 1 year, include subdomains, preload
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Cross-Origin policies
        header('Cross-Origin-Opener-Policy: same-origin');
        header('Cross-Origin-Resource-Policy: same-origin');
        header('Cross-Origin-Embedder-Policy: require-corp');
    }
    
    public static function applyForCorsPreflight(): void {
        // Minimal headers for preflight
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
    }
}
