import React, { useState } from 'react';
import { Button, Paper, Fade, TextField, useTheme, useMediaQuery, Tooltip, IconButton, Snackbar, Alert, CircularProgress, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TwitterIcon from '@mui/icons-material/Twitter';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'; // Usar como icono de Discord

export default function ProfileConnections({ user, t }) {
  const [wallets, setWallets] = useState([user?.wallet, '0x456...abcd']);
  const [newWallet, setNewWallet] = useState('');
  const [socials, setSocials] = useState([
    { name: 'Twitter', connected: true },
    { name: 'Discord', connected: false },
  ]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const handleAddWallet = () => {
    if (newWallet && !wallets.includes(newWallet)) {
      setLoading(true);
      setTimeout(() => {
        setWallets([...wallets, newWallet]);
        setNewWallet('');
        setLoading(false);
        setSuccess(true);
        setActionMsg(t('Wallet añadida correctamente.'));
        setTimeout(() => setSuccess(false), 2000);
      }, 1000);
    }
  };
  const handleRemoveWallet = (w) => {
    setLoading(true);
    setTimeout(() => {
      setWallets(wallets.filter(x => x !== w));
      setLoading(false);
      setSuccess(true);
      setActionMsg(t('Wallet eliminada correctamente.'));
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };
  const handleToggleSocial = (name) => {
    setLoading(true);
    setTimeout(() => {
      setSocials(socials.map(s => s.name === name ? { ...s, connected: !s.connected } : s));
      setLoading(false);
      setSuccess(true);
      setActionMsg(t('Conexión actualizada.'));
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };
  // Usar AlternateEmailIcon como icono de Discord (personalizable)
  const socialIcon = (name) => name === 'Twitter' ? <TwitterIcon color="primary" /> : <AlternateEmailIcon color="primary" />;
  return (
    <section style={{ marginBottom: isMobile ? 18 : 32 }}>
      <h3 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: theme.palette.text.primary, marginBottom: isMobile ? 10 : 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AccountBalanceWalletIcon color="primary" /> {t('profile.connections') || 'Conexiones'}
      </h3>
      <Paper elevation={2} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 10 : 16, background: theme.palette.background.paper }}>
        <div style={{ marginBottom: 12, color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16 }}>
          <b>{t('profile.wallets') || 'Wallets'}:</b>
          {wallets.map((w, i) => (
            <Fade in key={w} timeout={400}>
              <span style={{ marginRight: 12, display: 'inline-block', fontSize: isMobile ? 13 : 15, position: 'relative' }}>
                <Tooltip title={t('Wallet conectada.')} arrow>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AccountBalanceWalletIcon fontSize="small" color="primary" /> {w}
                  </span>
                </Tooltip>
                {i > 0 && (
                  <Tooltip title={t('Eliminar wallet')} arrow>
                    <IconButton size="small" color="error" onClick={() => handleRemoveWallet(w)} style={{ marginLeft: 4 }} disabled={loading}>
                      {loading ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </span>
            </Fade>
          ))}
        </div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextField
            size={isMobile ? 'small' : 'medium'}
            label={t('profile.addWallet') || 'Añadir wallet'}
            value={newWallet}
            onChange={e => setNewWallet(e.target.value)}
            style={{ marginRight: 8, minWidth: isMobile ? 100 : 120 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountBalanceWalletIcon color="primary" />
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />
          <Tooltip title={t('Añadir nueva wallet')} arrow>
            <span>
              <Button
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                onClick={handleAddWallet}
                style={{ fontSize: isMobile ? 13 : 15 }}
                startIcon={<AddIcon />}
                disabled={loading || !newWallet}
              >
                {loading ? <CircularProgress size={16} /> : t('profile.add') || 'Añadir'}
              </Button>
            </span>
          </Tooltip>
        </div>
        <div style={{ color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16 }}>
          <b>{t('profile.socials') || 'Redes sociales'}:</b>
          {socials.map(s => (
            <Fade in key={s.name} timeout={400}>
              <Tooltip title={s.connected ? t('Desconectar') : t('Conectar')} arrow>
                <Button
                  variant={s.connected ? 'contained' : 'outlined'}
                  color={s.connected ? 'primary' : 'inherit'}
                  style={{ marginRight: 8, fontSize: isMobile ? 13 : 15, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => handleToggleSocial(s.name)}
                  startIcon={socialIcon(s.name)}
                  endIcon={s.connected ? <LinkOffIcon /> : <LinkIcon />}
                  disabled={loading}
                >
                  {s.name} {s.connected ? t('profile.connected') || 'Conectado' : t('profile.connect') || 'Conectar'}
                  {loading && <CircularProgress size={16} style={{ marginLeft: 6 }} />}
                </Button>
              </Tooltip>
            </Fade>
          ))}
        </div>
      </Paper>
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{actionMsg || t('Acción realizada correctamente.')}</Alert>
      </Snackbar>
    </section>
  );
} 