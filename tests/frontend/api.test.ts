import { api } from '../../src/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    (global.fetch as any).mockReset();
  });

  const mockResponse = (data: any, ok = true, status = 200) => ({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)], { type: 'application/json' })),
  });

  const mockSuccess = <T>(data: T) => ({ success: true, message: 'OK', data });

  it('get makes GET request with token', async () => {
    localStorage.setItem('mris_token', 'test-token');
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess({ id: 1 })));

    const result = await api.get('test.action');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/index.php?action=test.action'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        }),
      })
    );
    expect(result).toEqual(mockSuccess({ id: 1 }));
  });

  it('get makes GET request without token when not set', async () => {
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess({ id: 1 })));

    const result = await api.get('test.action');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/index.php?action=test.action'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockSuccess({ id: 1 }));
  });

  it('post makes POST request with body', async () => {
    localStorage.setItem('mris_token', 'test-token');
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess({ id: 2 })));

    const result = await api.post('test.action', { name: 'Test' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/index.php?action=test.action'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        }),
        body: JSON.stringify({ name: 'Test' }),
      })
    );
    expect(result).toEqual(mockSuccess({ id: 2 }));
  });

  it('put makes PUT request with id', async () => {
    localStorage.setItem('mris_token', 'test-token');
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess({ id: 3 })));

    const result = await api.put('test.action', { name: 'Updated' }, 3);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=test.action&id=3'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      })
    );
    expect(result).toEqual(mockSuccess({ id: 3 }));
  });

  it('delete makes DELETE request with id', async () => {
    localStorage.setItem('mris_token', 'test-token');
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess(null)));

    const result = await api.delete('test.action', 3);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=test.action&id=3'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
    expect(result).toEqual(mockSuccess(null));
  });

  it('getPaginated makes GET request with pagination params', async () => {
    localStorage.setItem('mris_token', 'test-token');
    const paginatedData = {
      data: [{ id: 1 }],
      pagination: { total: 1, page: 1, per_page: 10, last_page: 1 },
    };
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess(paginatedData)));

    const result = await api.getPaginated('test.action', { page: 1, per_page: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=test.action&page=1&per_page=10'),
      expect.any(Object)
    );
    expect(result).toEqual(mockSuccess(paginatedData));
  });

  it('upload makes multipart request', async () => {
    localStorage.setItem('mris_token', 'test-token');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    (global.fetch as any).mockResolvedValue(mockResponse(mockSuccess({ id: 4 })));

    const result = await api.upload('test.upload', file, { site_id: 1 });

    const call = (global.fetch as any).mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect(call[1].body).toBeInstanceOf(FormData);
    expect(call[1].headers).not.toHaveProperty('Content-Type'); // Let browser set boundary
    expect(result).toEqual(mockSuccess({ id: 4 }));
  });

  it('throws ApiError on non-ok response', async () => {
    (global.fetch as any).mockResolvedValue(mockResponse({ message: 'Not found' }, false, 404));

    await expect(api.get('test.action')).rejects.toThrow('Not found');
  });

  it('clears auth on 401 and redirects', async () => {
    localStorage.setItem('mris_token', 'test-token');
    localStorage.setItem('mris_user', JSON.stringify({ id: 1 }));
    sessionStorage.setItem('test', 'value');
    
    (global.fetch as any).mockResolvedValue(mockResponse({ message: 'Unauthorized' }, false, 401));

    await expect(api.get('test.action')).rejects.toThrow('Unauthorized');
    
    expect(localStorage.getItem('mris_token')).toBeNull();
    expect(localStorage.getItem('mris_user')).toBeNull();
    expect(sessionStorage.getItem('test')).toBeNull();
  });

  it('buildUrl includes params', async () => {
    // Access private function via getPaginated which uses it
    (global.fetch as any).mockResolvedValue(mockResponse({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, per_page: 10, last_page: 1 },
    }));

    await api.getPaginated('test', { page: 2, per_page: 20, filter: 'active' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('per_page=20'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('filter=active'),
      expect.any(Object)
    );
  });
});