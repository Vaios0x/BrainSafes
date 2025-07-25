import React, { useState, useEffect } from 'react';
import { Paper, Typography, FormGroup, FormControlLabel, Switch, Select, MenuItem, Button, Box, TextField, Chip, useTheme, useMediaQuery, Tooltip, InputAdornment, Snackbar, Alert } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

const idiomas = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];
const temas = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export default function ProfileSettings({ user, t }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [settings, setSettings] = useState({
    idioma: 'es',
    tema: 'light',
    notificaciones: true,
    wallets: [user?.wallet],
    newWallet: '',
    integraciones: { discord: false, telegram: false },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('profileSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('profileSettings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const handleSwitch = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleWalletAdd = () => {
    if (settings.newWallet && !settings.wallets.includes(settings.newWallet)) {
      setLoading(true);
      setTimeout(() => {
        setSettings(prev => ({ ...prev, wallets: [...prev.wallets, prev.newWallet], newWallet: '' }));
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }, 1000);
    }
  };
  const handleWalletRemove = (w) => {
    setLoading(true);
    setTimeout(() => {
      setSettings(prev => ({ ...prev, wallets: prev.wallets.filter(x => x !== w) }));
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };
  const handleIntegration = (key) => setSettings(prev => ({ ...prev, integraciones: { ...prev.integraciones, [key]: !prev.integraciones[key] } }));

  return (
    <Paper elevation={2} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 18 : 32, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 16 : 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SyncAltIcon color="primary" /> Panel de Configuración
      </Typography>
      <Box mb={2}>
        <Typography variant="subtitle2" style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Preferencias de usuario</Typography>
        <Box display="flex" gap={isMobile ? 1 : 2} alignItems="center" mt={1} flexDirection={isMobile ? 'column' : 'row'}>
          <Tooltip title={t('Selecciona el idioma de la interfaz.')} arrow>
            <Select value={settings.idioma} onChange={e => handleChange('idioma', e.target.value)} size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 90 : 120 }} startAdornment={<InputAdornment position="start"><LanguageIcon color="primary" /></InputAdornment>}>
              {idiomas.map(i => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
            </Select>
          </Tooltip>
          <Tooltip title={t('Selecciona el tema visual.')} arrow>
            <Select value={settings.tema} onChange={e => handleChange('tema', e.target.value)} size={isMobile ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 90 : 120 }} startAdornment={<InputAdornment position="start"><Brightness4Icon color="primary" /></InputAdornment>}>
              {temas.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </Tooltip>
          <Tooltip title={t('Activar o desactivar notificaciones.')} arrow>
            <FormControlLabel
              control={<Switch checked={settings.notificaciones} onChange={() => handleSwitch('notificaciones')} color="primary" icon={<NotificationsActiveIcon />} checkedIcon={<NotificationsActiveIcon />} />}
              label={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Notificaciones</span>}
            />
          </Tooltip>
        </Box>
      </Box>
      <Box mb={2}>
        <Typography variant="subtitle2" style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Gestión de wallets</Typography>
        <Box display="flex" gap={1} alignItems="center" mt={1} flexDirection={isMobile ? 'column' : 'row'}>
          <TextField
            size={isMobile ? 'small' : 'medium'}
            label="Añadir wallet"
            value={settings.newWallet}
            onChange={e => handleChange('newWallet', e.target.value)}
            style={{ maxWidth: isMobile ? 90 : 120 }}
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
              <Button variant="outlined" size={isMobile ? 'small' : 'medium'} onClick={handleWalletAdd} style={{ fontSize: isMobile ? 13 : 15 }} startIcon={<AddIcon />} disabled={loading || !settings.newWallet}>
                {loading ? <CloudDoneIcon /> : 'Añadir'}
              </Button>
            </span>
          </Tooltip>
        </Box>
        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
          {settings.wallets.map((w, i) => (
            <Tooltip key={w} title={i === 0 ? t('Wallet principal') : t('Eliminar wallet')} arrow>
              <Chip
                label={w}
                onDelete={i > 0 ? () => handleWalletRemove(w) : undefined}
                color={i === 0 ? 'primary' : 'default'}
                style={{ marginRight: 4, marginBottom: 4, fontSize: isMobile ? 12 : 14, boxShadow: theme.shadows[2], transition: 'box-shadow 0.3s, transform 0.2s', cursor: i > 0 ? 'pointer' : 'default' }}
                icon={<AccountBalanceWalletIcon fontSize="small" />}
                onMouseEnter={e => i > 0 && (e.currentTarget.style.boxShadow = theme.shadows[6])}
                onMouseLeave={e => i > 0 && (e.currentTarget.style.boxShadow = theme.shadows[2])}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
      <Box mb={2}>
        <Typography variant="subtitle2" style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Integraciones</Typography>
        <FormGroup row={!isMobile}>
          <Tooltip title={t('Activar o desactivar integración con Discord.')} arrow>
            <FormControlLabel
              control={<Switch checked={settings.integraciones.discord} onChange={() => handleIntegration('discord')} color="primary" icon={<SyncAltIcon />} checkedIcon={<SyncAltIcon />} />}
              label={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Discord</span>}
            />
          </Tooltip>
          <Tooltip title={t('Activar o desactivar integración con Telegram.')} arrow>
            <FormControlLabel
              control={<Switch checked={settings.integraciones.telegram} onChange={() => handleIntegration('telegram')} color="primary" icon={<SyncAltIcon />} checkedIcon={<SyncAltIcon />} />}
              label={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>Telegram</span>}
            />
          </Tooltip>
        </FormGroup>
      </Box>
      <Typography variant="body2" color="textSecondary" style={{ fontSize: isMobile ? 11 : 13 }}>
        (Simulado) Tus preferencias se guardan localmente. Próximamente: sincronización en la nube, multi-wallet, hardware wallets.
      </Typography>
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{t('Cambios guardados correctamente.')}</Alert>
      </Snackbar>
    </Paper>
  );
} 