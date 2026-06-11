import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRouterBasename, getAppBasePath, getApiBasePath } from '../../src/utils/appBase';

describe('appBase utility functions', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Save original window and define a mock one
    global.window = Object.create(window);
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  it('should return undefined basename when window is undefined', () => {
    // @ts-expect-error — deleting window to simulate SSR environment
    delete global.window;
    expect(getRouterBasename()).toBeUndefined();
    expect(getAppBasePath()).toBe('/');
    expect(getApiBasePath()).toBe('/api');
  });

  it('should return undefined basename when path does not start with DEPLOY_BASE', () => {
    Object.defineProperty(global.window, 'location', {
      value: { pathname: '/other-path/login' },
      configurable: true,
      writable: true
    });
    expect(getRouterBasename()).toBeUndefined();
    expect(getAppBasePath()).toBe('/');
    expect(getApiBasePath()).toBe('/api');
  });

  it('should return DEPLOY_BASE basename when path exactly matches DEPLOY_BASE', () => {
    Object.defineProperty(global.window, 'location', {
      value: { pathname: '/Projects/projecttracking3' },
      configurable: true,
      writable: true
    });
    expect(getRouterBasename()).toBe('/Projects/projecttracking3');
    expect(getAppBasePath()).toBe('/Projects/projecttracking3/');
    expect(getApiBasePath()).toBe('/Projects/projecttracking3/api');
  });

  it('should return DEPLOY_BASE basename when path starts with DEPLOY_BASE subpath', () => {
    Object.defineProperty(global.window, 'location', {
      value: { pathname: '/Projects/projecttracking3/dashboard' },
      configurable: true,
      writable: true
    });
    expect(getRouterBasename()).toBe('/Projects/projecttracking3');
    expect(getAppBasePath()).toBe('/Projects/projecttracking3/');
    expect(getApiBasePath()).toBe('/Projects/projecttracking3/api');
  });
});
