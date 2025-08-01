import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Lazy loading de Reown AppKit
const ReownAppKit = lazy(() => import('./reown.jsx'));

// Setup queryClient
const queryClient = new QueryClient();

// Componente de carga
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Cargando Reown AppKit...
  </div>
);

export function AppKitProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <ReownAppKit>
          {children}
        </ReownAppKit>
      </Suspense>
    </QueryClientProvider>
  );
}

export { queryClient }; 