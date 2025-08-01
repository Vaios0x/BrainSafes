import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { 
  arbitrum, 
  base, 
  optimism, 
  polygon 
} from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Setup queryClient
const queryClient = new QueryClient();

// Project ID from Reown Dashboard
const projectId = 'TU_PROJECT_ID';

// Create metadata object
const metadata = {
  name: 'Tu dApp Multichain',
  description: 'dApp que funciona en Arbitrum, Base, Optimism y Polygon',
  url: 'http://localhost:3000',
  icons: ['https://tu-icono.com/icon.png']
};

// Solo las redes que necesitas
const networks = [arbitrum, base, optimism, polygon];

// Create Wagmi Adapter con configuración específica
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  // Configuración específica para tu dApp
  options: {
    // Solo mostrar estas redes
    showAllNetworks: false,
    // Orden específico de redes
    networkOrder: ['arbitrum', 'base', 'optimism', 'polygon'],
    // Configuración de wallets preferidas
    connectorOrder: [
      'walletConnect',
      'injected',
      'coinbase',
      'metamask'
    ]
  }
});

// Create modal con configuración específica
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    // Configuración específica para multichain
    multichain: {
      enabled: true,
      // Solo estas redes
      allowedNetworks: ['arbitrum', 'base', 'optimism', 'polygon'],
      // Configuración de red por defecto
      defaultNetwork: 'arbitrum'
    }
  }
});

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export { wagmiAdapter, queryClient }; 