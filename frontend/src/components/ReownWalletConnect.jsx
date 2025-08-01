import React from 'react';
import { Button, Tooltip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export default function ReownWalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      // Open Reown AppKit modal
      open();
    }
  };

  return (
    <Tooltip title={isConnected ? 'Wallet Connected' : 'Connect Wallet'} arrow>
      <Button
        variant={isConnected ? "outlined" : "contained"}
        color="primary"
        startIcon={<AccountBalanceWalletIcon />}
        onClick={handleClick}
        sx={{
          minWidth: isConnected ? 140 : 160,
          height: 40,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: isConnected ? 'none' : 2,
          '&:hover': {
            boxShadow: isConnected ? 1 : 4,
          }
        }}
      >
        {isConnected ? shortAddress : 'Connect Wallet'}
      </Button>
    </Tooltip>
  );
} 