<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../helpers/PasswordValidator.php';

class PasswordValidatorTest extends TestCase
{
    public function testValidPassword(): void
    {
        // Should not throw
        \PasswordValidator::validate('ValidPass123!@#');
        $this->assertTrue(true);
    }

    public function testTooShort(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('at least 12 characters');
        \PasswordValidator::validate('Short1!');
    }

    public function testNoUppercase(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('uppercase letter');
        \PasswordValidator::validate('lowercase123!@#');
    }

    public function testNoLowercase(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('lowercase letter');
        \PasswordValidator::validate('UPPERCASE123!@#');
    }

    public function testNoNumber(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('number');
        \PasswordValidator::validate('NoNumbersHere!@#');
    }

    public function testNoSpecialChar(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('special character');
        \PasswordValidator::validate('NoSpecialChar123');
    }

    public function testExactly12Chars(): void
    {
        // 12 chars with all requirements
        \PasswordValidator::validate('Aa1!aaaaaaa');
        $this->assertTrue(true);
    }
}