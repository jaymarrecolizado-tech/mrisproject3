import { describe, it, expect } from 'vitest';

// Frontend password validation (mirrors backend PasswordValidator)
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

describe('Password Validation (Frontend)', () => {
  it('validates correct password', () => {
    const result = validatePassword('ValidPass123!@#');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects too short password', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters');
  });

  it('rejects password without uppercase', () => {
    const result = validatePassword('lowercase123!@#');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects password without lowercase', () => {
    const result = validatePassword('UPPERCASE123!@#');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('rejects password without number', () => {
    const result = validatePassword('NoNumbersHere!@#');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('rejects password without special character', () => {
    const result = validatePassword('NoSpecialChar123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('accepts exactly 12 chars with all requirements', () => {
    const result = validatePassword('Aa1!aaaaaaaa');
    expect(result.valid).toBe(true);
  });

  it('returns all errors for completely invalid password', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});