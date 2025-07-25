import React, { useState } from 'react';
import { Button, TextField, Switch, FormControlLabel, Paper, useTheme, useMediaQuery, Tooltip, InputAdornment, Snackbar, Alert, IconButton } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function ProfileSecurity({ user, onEdit, t }) {
  const [password, setPassword] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [devices] = useState([
    { id: 1, name: 'Chrome - Windows', last: '2024-07-25 10:00' },
    { id: 2, name: 'iPhone - Safari', last: '2024-07-24 18:30' },
  ]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('La clave debe tener al menos 6 caracteres.'));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPassword('');
      setSuccess(true);
      onEdit({ passwordChanged: true });
      setTimeout(() => setSuccess(false), 2000);
    }, 1200);
  };
  const handle2FAToggle = () => {
    setLoading(true);
    setTimeout(() => {
      setTwoFA((prev) => {
        onEdit({ twoFA: !prev });
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        return !prev;
      });
    }, 1000);
  };

  return (
    <section style={{ marginBottom: isMobile ? 18 : 32 }}>
      <h3 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: theme.palette.text.primary, marginBottom: isMobile ? 10 : 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SecurityIcon color="primary" /> {t('profile.security') || 'Seguridad'}
      </h3>
      <Paper elevation={2} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 10 : 16, background: theme.palette.background.paper }}>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', gap: isMobile ? 8 : 16, alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <Tooltip title={t('Cambiar clave de acceso.')} arrow>
            <TextField
              label={t('profile.changePassword') || 'Nueva clave'}
              type="password"
              value={password}
              onChange={handlePasswordChange}
              size={isMobile ? 'small' : 'medium'}
              style={{ minWidth: isMobile ? 120 : 180 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
              error={!!error}
              helperText={error}
            />
          </Tooltip>
          <Tooltip title={t('Guardar nueva clave.')} arrow>
            <span>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!password || loading}
                style={{ fontSize: isMobile ? 13 : 15, boxShadow: theme.shadows[2], transition: 'box-shadow 0.3s, transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                startIcon={<CheckCircleIcon />}
              >
                {loading ? t('Guardando...') : t('profile.save') || 'Guardar'}
              </Button>
            </span>
          </Tooltip>
        </form>
        <Tooltip title={t('Activar o desactivar autenticación en dos pasos (2FA).')} arrow>
          <FormControlLabel
            control={<Switch checked={twoFA} onChange={handle2FAToggle} color="primary" disabled={loading} icon={<SecurityIcon />} checkedIcon={<SecurityIcon />} />}
            label={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>{t('profile.enable2FA') || 'Activar 2FA'}</span>}
          />
        </Tooltip>
      </Paper>
      <div>
        <h4 style={{ fontWeight: 600, marginBottom: 8, color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DevicesIcon color="primary" /> {t('profile.devices') || 'Dispositivos conectados'}
        </h4>
        <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
          {devices.map(d => (
            <Tooltip key={d.id} title={t('Dispositivo autorizado para acceder a tu cuenta.')} arrow>
              <li style={{ background: theme.palette.background.default, borderRadius: 8, padding: isMobile ? '7px 10px' : '10px 18px', marginBottom: 8, color: theme.palette.primary.main, fontWeight: 500, fontSize: isMobile ? 13 : 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DevicesIcon fontSize="small" color="primary" />
                {d.name} <span style={{ color: theme.palette.text.secondary, fontWeight: 400, marginLeft: 8 }}>{t('profile.lastAccess') || 'Último acceso'}: {d.last}</span>
              </li>
            </Tooltip>
          ))}
        </ul>
      </div>
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{t('Cambios guardados correctamente.')}</Alert>
      </Snackbar>
      <Snackbar open={!!error && !loading} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" sx={{ width: '100%' }} icon={<ErrorOutlineIcon />}>{error}</Alert>
      </Snackbar>
    </section>
  );
} 