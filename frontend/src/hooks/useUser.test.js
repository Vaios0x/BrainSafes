import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useUser } from './useUser';

global.fetch = vi.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ id: '1', name: 'Test User' })
}));

describe('useUser', () => {
  it('devuelve datos de usuario', async () => {
    const { result } = renderHook(() => useUser('1'));
    await waitFor(() => expect(result.current.user).toEqual({ id: '1', name: 'Test User' }));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
}); 