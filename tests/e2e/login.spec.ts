import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('DICT MRIS');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast-error, [role="alert"]')).toContainText(/Invalid email or password/i);
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Using default seed credentials
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/$/);
    
    // Click logout
    await page.click('button[title="Sign Out"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access dashboard - should redirect to login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    const protectedRoutes = [
      '/map',
      '/freewifi',
      '/dict-projects',
      '/users',
      '/roles',
      '/audit',
      '/reports',
      '/schema',
      '/profile',
      '/notifications',
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('persists login across page refresh', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/$/);
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('displays user info in header after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/$/);
    
    // Check header shows user info
    await expect(page.locator('header')).toContainText('Admin');
  });
});

test.describe('Password Reset Flow', () => {
  test('forgot password shows success message for any email', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password link (if exists)
    const forgotLink = page.locator('a:has-text("Forgot password"), a:has-text("forgot password")');
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      
      // Fill email
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');
      
      // Should show success message (account enumeration protection)
      await expect(page.locator('.toast-success, [role="alert"]')).toContainText(/If the email exists/i);
    }
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/);
  });

  test('displays KPI cards', async ({ page }) => {
    await expect(page.locator('text=Total Sites')).toBeVisible();
    await expect(page.locator('text=Online')).toBeVisible();
    await expect(page.locator('text=Offline')).toBeVisible();
    await expect(page.locator('text=Daily Users')).toBeVisible();
  });

  test('displays 30-day trend chart', async ({ page }) => {
    await expect(page.locator('text=30-Day Status Trend')).toBeVisible();
    await expect(page.locator('canvas, svg')).toBeVisible();
  });

  test('displays recent activity feed', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });
});

test.describe('Free WiFi Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dict.gov.ph');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/);
  });

  test('loads Free WiFi sites', async ({ page }) => {
    await page.goto('/freewifi');
    await expect(page.locator('h1')).toContainText('Free WiFi Monitoring');
    
    // Table should load with sites
    await expect(page.locator('table')).toBeVisible();
  });

  test('filters sites by status', async ({ page }) => {
    await page.goto('/freewifi');
    
    await page.selectOption('select:has(option:has-text("All Status"))', 'UP');
    await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
  });

  test('searches sites by name', async ({ page }) => {
    await page.goto('/freewifi');
    
    await page.fill('input[placeholder*="Search"]', 'test');
    // Wait for filter to apply
    await page.waitForTimeout(500);
  });
});