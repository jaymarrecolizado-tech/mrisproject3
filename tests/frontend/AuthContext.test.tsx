import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  role_name: 'Administrator',
  role_id: 1,
  department: 'IT',
  permissions: ['dashboard.view', 'users.manage'],
  project_access: { 1: 'admin' },
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // Helper component to test the hook
  const TestComponent = ({ onResult }: { onResult: (result: ReturnType<typeof useAuth>) => void }) => {
    const result = useAuth();
    React.useEffect(() => {
      onResult(result);
    }, [result, onResult]);
    return null;
  };

  const renderWithAuth = (children: React.ReactNode) => {
    return render(<AuthProvider>{children}</AuthProvider>);
  };

  it('provides auth context with initial state', () => {
    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);
    
    expect(hookResult).toBeDefined();
    expect(hookResult!.user).toBeNull();
    expect(hookResult!.token).toBeNull();
    // isLoading starts as true but useEffect runs synchronously in tests
    expect(typeof hookResult!.isLoading).toBe('boolean');
  });

  it('loads user from localStorage on mount', async () => {
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify(mockUser));
    
    (api.get as any).mockResolvedValue({ data: mockUser });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => {
      expect(hookResult!.isLoading).toBe(false);
    });

    expect(hookResult!.user).toEqual(mockUser);
    expect(hookResult!.token).toBe('test-token');
    expect(api.get).toHaveBeenCalledWith('auth.me');
  });

  it('clears auth on failed me request', async () => {
    localStorage.setItem('mris_token', 'invalid-token');
    localStorage.setItem('mris_user', JSON.stringify(mockUser));
    
    (api.get as any).mockRejectedValue(new Error('Unauthorized'));

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => {
      expect(hookResult!.isLoading).toBe(false);
    });

    expect(hookResult!.user).toBeNull();
    expect(hookResult!.token).toBeNull();
    expect(localStorage.getItem('mris_token')).toBeNull();
  });

  it('login sets user and token', async () => {
    (api.post as any).mockResolvedValue({
      data: { token: 'new-token', user: mockUser },
    });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(hookResult!.isLoading).toBe(false);
    });

    await act(async () => {
      await hookResult!.login('test@example.com', 'password123');
    });

    expect(hookResult!.user).toEqual(mockUser);
    expect(hookResult!.token).toBe('new-token');
    expect(localStorage.getItem('mris_token')).toBe('new-token');
    expect(localStorage.getItem('mris_user')).toBe(JSON.stringify(mockUser));
  });

  it('login throws on failure', async () => {
    (api.post as any).mockRejectedValue(new Error('Invalid email or password'));

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => {
      expect(hookResult!.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await hookResult!.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid email or password');

    expect(hookResult!.user).toBeNull();
    expect(hookResult!.token).toBeNull();
  });

  it('logout clears auth and redirects', async () => {
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify(mockUser));
    
    (api.post as any).mockResolvedValue({ success: true });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    // Wait for initial load
    await waitFor(() => expect(hookResult!.isLoading).toBe(false));

    await act(async () => {
      await hookResult!.logout();
    });

    expect(hookResult!.user).toBeNull();
    expect(hookResult!.token).toBeNull();
    expect(localStorage.getItem('mris_token')).toBeNull();
    expect(localStorage.getItem('mris_user')).toBeNull();
  });

  it('hasPermission checks user permissions', async () => {
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify(mockUser));
    (api.get as any).mockResolvedValue({ data: mockUser });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => expect(hookResult!.isLoading).toBe(false));

    expect(hookResult!.hasPermission('dashboard.view')).toBe(true);
    expect(hookResult!.hasPermission('users.manage')).toBe(true);
    expect(hookResult!.hasPermission('nonexistent.permission')).toBe(false);
  });

  it('hasProjectAccess checks project access levels', async () => {
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify(mockUser));
    (api.get as any).mockResolvedValue({ data: mockUser });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => expect(hookResult!.isLoading).toBe(false));

    expect(hookResult!.hasProjectAccess(1, 'view')).toBe(true);
    expect(hookResult!.hasProjectAccess(1, 'edit')).toBe(true);
    expect(hookResult!.hasProjectAccess(1, 'admin')).toBe(true);
    expect(hookResult!.hasProjectAccess(2, 'view')).toBe(false);
    expect(hookResult!.hasProjectAccess(999, 'view')).toBe(false);
  });

  it('hasProjectAccess returns true for projects.manage permission', async () => {
    const adminUser = { ...mockUser, permissions: [...mockUser.permissions, 'projects.manage'] };
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify(adminUser));
    (api.get as any).mockResolvedValue({ data: adminUser });

    let hookResult: ReturnType<typeof useAuth> | null = null;
    
    renderWithAuth(<TestComponent onResult={r => { hookResult = r; }} />);

    await waitFor(() => expect(hookResult!.isLoading).toBe(false));

    expect(hookResult!.hasProjectAccess(999, 'admin')).toBe(true);
  });
});