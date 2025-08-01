import React, { lazy, Suspense } from 'react';
import { Button, Tooltip, CircularProgress } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Lazy loading del componente ReownWalletConnect
const ReownWalletConnect = lazy(() => import('./ReownWalletConnect.jsx'));

// Componente de carga
const LoadingButton = () => (
  <Button
    variant="contained"
    color="primary"
    startIcon={<AccountBalanceWalletIcon />}
    disabled
    sx={{
      minWidth: 160,
      height: 40,
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
    }}
  >
    <CircularProgress size={16} sx={{ mr: 1 }} />
    Cargando...
  </Button>
);

export default function ReownWalletConnectLazy() {
  return (
    <Suspense fallback={<LoadingButton />}>
      <ReownWalletConnect />
    </Suspense>
  );
} 