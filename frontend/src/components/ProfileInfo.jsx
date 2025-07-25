import React, { useRef, useState } from 'react';
import { Button, Avatar, Fade, useTheme, useMediaQuery, Tooltip, CircularProgress, IconButton, Snackbar, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function ProfileInfo({ user, t, onEdit }) {
  const fileInput = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        onEdit({ avatarNFT: url });
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }, 1200);
    }
  };

  return (
    <section style={{ background: theme.palette.background.paper, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[2], padding: isMobile ? 18 : 32, marginBottom: isMobile ? 18 : 32 }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 14 : 24, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        <Fade in timeout={600}>
          <div style={{ position: 'relative', marginBottom: isMobile ? 10 : 0 }}>
            <Tooltip title={t('profile.changeAvatar') || 'Cambiar avatar'} arrow>
              <span>
                <Avatar
                  src={user?.avatarNFT || ''}
                  alt="NFT Avatar"
                  sx={{
                    width: isMobile ? 64 : 80,
                    height: isMobile ? 64 : 80,
                    bgcolor: theme.palette.info.light,
                    color: theme.palette.primary.main,
                    fontSize: isMobile ? 32 : 40,
                    fontWeight: 700,
                    boxShadow: loading ? theme.shadows[6] : theme.shadows[2],
                    transition: 'box-shadow 0.3s, transform 0.2s',
                    transform: loading ? 'scale(1.08)' : 'scale(1)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {!user?.avatarNFT && (user?.email ? user.email[0].toUpperCase() : user?.wallet?.slice(2, 3).toUpperCase() || 'U')}
                  {loading && <CircularProgress size={32} color="primary" style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }} />}
                </Avatar>
              </span>
            </Tooltip>
            <Tooltip title={t('profile.changeAvatar') || 'Cambiar avatar'} arrow>
              <IconButton
                color="primary"
                size="small"
                style={{ position: 'absolute', bottom: -10, left: 0, fontSize: 16, background: theme.palette.background.paper, border: `1px solid ${theme.palette.primary.main}` }}
                onClick={() => fileInput.current.click()}
                onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                tabIndex={0}
                aria-label={t('profile.changeAvatar') || 'Cambiar avatar'}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <input
              type="file"
              accept="image/*"
              ref={fileInput}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
        </Fade>
        <div>
          <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: theme.palette.text.primary }}>{user?.email || user?.wallet}</div>
          <div style={{ color: theme.palette.primary.main, fontWeight: 500, marginTop: 4, fontSize: isMobile ? 13 : 16 }}>{t('profile.roles') || 'Roles'}: {user?.roles?.join(', ') || 'Usuario'}</div>
        </div>
      </div>
      <div style={{ marginTop: isMobile ? 16 : 24 }}>
        <Tooltip title={t('Editar datos de perfil')} arrow>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            style={{ borderRadius: theme.shape.borderRadius, fontWeight: 700, fontSize: isMobile ? 14 : 16, boxShadow: theme.shadows[2], transition: 'box-shadow 0.3s, transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
            onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
            onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
            onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
          >
            {t('profile.edit') || 'Editar perfil'}
          </Button>
        </Tooltip>
      </div>
      <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{t('Avatar actualizado correctamente.')}</Alert>
      </Snackbar>
    </section>
  );
} 