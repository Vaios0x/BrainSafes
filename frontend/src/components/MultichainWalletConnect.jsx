import React, { useState } from 'react';
import { 
  Button, 
  Tooltip, 
  Chip, 
  Box, 
  Typography 
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAccount, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

// Configuración de redes permitidas
const ALLOWED_NETWORKS = {
  42161: { name: 'Arbitrum', color: '#28A0F0' },
  8453: { name: 'Base', color: '#0052FF' },
  10: { name: 'Optimism', color: '#FF0420' },
  137: { name: 'Polygon', color: '#8247E5' }
};

export default function MultichainWalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useAppKit();
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const currentNetwork = chain ? ALLOWED_NETWORKS[chain.id] : null;

  const handleClick = () => {
    if (isConnected) {
      setShowNetworkSelector(!showNetworkSelector);
    } else {
      open();
    }
  };

  const handleNetworkSwitch = (chainId) => {
    if (switchNetwork) {
      switchNetwork(chainId);
    }
    setShowNetworkSelector(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowNetworkSelector(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title={isConnected ? 'Wallet Connected' : 'Connect Wallet'} arrow>
        <Button
          variant={isConnected ? "outlined" : "contained"}
          color="primary"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={handleClick}
          sx={{
            minWidth: isConnected ? 180 : 160,
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
          {isConnected ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{shortAddress}</Typography>
              {currentNetwork && (
                <Chip
                  label={currentNetwork.name}
                  size="small"
                  sx={{
                    backgroundColor: currentNetwork.color,
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              )}
            </Box>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      </Tooltip>

      {/* Network Selector */}
      {showNetworkSelector && isConnected && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            minWidth: 200,
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Switch Network
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(ALLOWED_NETWORKS).map(([chainId, network]) => (
              <Button
                key={chainId}
                variant={chain?.id === parseInt(chainId) ? "contained" : "outlined"}
                size="small"
                onClick={() => handleNetworkSwitch(parseInt(chainId))}
                sx={{
                  justifyContent: 'flex-start',
                  backgroundColor: chain?.id === parseInt(chainId) ? network.color : 'transparent',
                  color: chain?.id === parseInt(chainId) ? 'white' : 'inherit',
                  '&:hover': {
                    backgroundColor: network.color,
                    color: 'white'
                  }
                }}
              >
                {network.name}
              </Button>
            ))}
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleDisconnect}
              sx={{ mt: 1 }}
            >
              Disconnect
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
} 