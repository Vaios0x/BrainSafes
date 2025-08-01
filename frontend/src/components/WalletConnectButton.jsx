import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  Chip, 
  Alert, 
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useWallet } from '../hooks/useWallet';
import { useAuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function WalletConnectButton() {
  const { t } = useTranslation();
  const { wallet, loading, error, connectWallet, disconnectWallet, getWalletInfo, isConnected } = useWallet();
  const { loginWallet } = useAuthContext();
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      const { address, signature, message } = await connectWallet();
      
      // Intentar login con el backend
      await loginWallet(address, signature, message);
      
      setShowDialog(false);
    } catch (err) {
      console.error('Error conectando wallet:', err);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDialog(false);
  };

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const walletInfo = getWalletInfo();

  return (
    <>
      <Tooltip title={isConnected ? 'Wallet Connected' : 'Connect Wallet'} arrow>
        <Button
          variant={isConnected ? "outlined" : "contained"}
          color="primary"
          startIcon={isConnected ? <AccountBalanceWalletIcon /> : <AccountBalanceWalletIcon />}
          onClick={() => setShowDialog(true)}
          disabled={loading}
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
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isConnected ? (
            walletInfo?.shortAddress || 'Wallet Connected'
          ) : (
            'Connect Wallet'
          )}
        </Button>
      </Tooltip>

      <Dialog 
        open={showDialog} 
        onClose={() => setShowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isConnected && walletInfo ? (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Dirección de Wallet
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, flex: 1 }}>
                  {walletInfo.address}
                </Typography>
                <IconButton onClick={handleCopyAddress} size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Box>
              
              {copied && (
                <Chip 
                  label="¡Copiado!" 
                  color="success" 
                  size="small" 
                  sx={{ mb: 2 }}
                />
              )}

              <Typography variant="body2" color="text.secondary">
                Red: {walletInfo.network?.name || 'Desconocida'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Conectar tu Wallet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conecta tu wallet para acceder a todas las funcionalidades de BrainSafes
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowDialog(false)}>
            Cancelar
          </Button>
          
          {isConnected ? (
            <Button 
              onClick={handleDisconnect}
              color="error"
              startIcon={<LogoutIcon />}
              variant="outlined"
            >
              Disconnect Wallet
            </Button>
          ) : (
            <Button 
              onClick={handleConnect}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWalletIcon />}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
} 