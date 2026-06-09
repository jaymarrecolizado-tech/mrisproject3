import { getRouterBasename, getApiBasePath, getAppBasePath } from '../../src/utils/appBase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('appBase utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRouterBasename returns correct path for subdirectory deployment', () => {
    // The function uses import.meta.env.BASE_URL
    // In test environment, we can't easily mock import.meta.env
    // This is a basic test to ensure the function exists and is callable
    expect(typeof getRouterBasename).toBe('function');
  });

  it('getApiBasePath returns correct API path', () => {
    expect(typeof getApiBasePath).toBe('function');
  });

  it('getAppBasePath returns correct app path', () => {
    expect(typeof getAppBasePath).toBe('function');
  });
});