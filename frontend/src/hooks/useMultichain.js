import { useCallback } from 'react';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

// Configuración de redes permitidas
export const ALLOWED_NETWORKS = {
  42161: { 
    name: 'Arbitrum', 
    color: '#28A0F0',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  8453: { 
    name: 'Base', 
    color: '#0052FF',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  },
  10: { 
    name: 'Optimism', 
    color: '#FF0420',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  137: { 
    name: 'Polygon', 
    color: '#8247E5',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  }
};

export function useMultichain() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isPending } = useSwitchNetwork();

  const currentNetwork = chain ? ALLOWED_NETWORKS[chain.id] : null;
  const isOnAllowedNetwork = chain ? !!ALLOWED_NETWORKS[chain.id] : false;

  const switchToNetwork = useCallback((chainId) => {
    if (switchNetwork && ALLOWED_NETWORKS[chainId]) {
      switchNetwork(chainId);
    }
  }, [switchNetwork]);

  const getNetworkInfo = useCallback((chainId) => {
    return ALLOWED_NETWORKS[chainId] || null;
  }, []);

  const getAllowedNetworks = useCallback(() => {
    return Object.entries(ALLOWED_NETWORKS).map(([chainId, network]) => ({
      chainId: parseInt(chainId),
      ...network
    }));
  }, []);

  return {
    address,
    isConnected,
    currentNetwork,
    isOnAllowedNetwork,
    switchToNetwork,
    getNetworkInfo,
    getAllowedNetworks,
    isPending
  };
} 