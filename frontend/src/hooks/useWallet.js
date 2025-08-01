import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar si MetaMask está disponible
      if (!window.ethereum) {
        throw new Error('MetaMask no está instalado. Por favor, instala MetaMask para continuar.');
      }

      // Solicitar conexión a la wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas. Por favor, desbloquea MetaMask.');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Crear mensaje para firmar
      const message = `Conectando a BrainSafes\n\nDirección: ${address}\nTimestamp: ${Date.now()}`;
      
      // Solicitar firma
      const signature = await signer.signMessage(message);
      
      setWallet({
        address,
        signer,
        provider,
        signature,
        message
      });

      return { address, signature, message };
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setError(null);
  }, []);

  const getWalletInfo = useCallback(() => {
    if (!wallet) return null;
    
    return {
      address: wallet.address,
      shortAddress: `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
      network: wallet.provider.network
    };
  }, [wallet]);

  return {
    wallet,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    getWalletInfo,
    isConnected: !!wallet
  };
} 