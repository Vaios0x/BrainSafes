import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useContractBalance } from './useContractBalance';

vi.mock('ethers', () => ({
  ethers: {
    providers: {
      Web3Provider: vi.fn().mockImplementation(() => ({
        getSigner: vi.fn(),
      })),
    },
    Contract: vi.fn().mockImplementation(() => ({
      balanceOf: vi.fn().mockResolvedValue('1000'),
    })),
  },
}));

describe('useContractBalance', () => {
  it('devuelve el balance del contrato', async () => {
    globalThis.window = globalThis.window || {};
    globalThis.window.ethereum = {};
    const { result } = renderHook(() => useContractBalance('0x123'));
    await waitFor(() => expect(result.current).toBe('1000'));
  });
}); 