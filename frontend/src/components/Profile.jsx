import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import { useUser } from '../hooks/useUser';
import ProfileInfo from './ProfileInfo';
import ProfileHistory from './ProfileHistory';
import ProfileBadges from './ProfileBadges';
import ProfileSecurity from './ProfileSecurity';
import ProfileConnections from './ProfileConnections';
import ProfileSettings from './ProfileSettings';
import { useTranslation } from 'react-i18next';
import { Container, useTheme, useMediaQuery } from '@mui/material';

export default function Profile() {
  const { user: userFromHook, loading, error } = useUser();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  useEffect(() => {
    if (userFromHook) setUser(userFromHook);
  }, [userFromHook]);

  const handleEdit = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
    showToast(t('profile.updated') || 'Perfil actualizado', 'success');
  };

  return (
    <Container
      maxWidth="md"
      disableGutters={isMobile}
      style={{
        padding: isMobile ? '1rem 0.5rem' : '2.5rem 2rem',
        background: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <Breadcrumbs items={[
        { to: '/', label: t('navbar.home') },
        { label: t('navbar.profile') }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>{t('profile.user') || 'Perfil'}</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton width={120} height={120} />
          <Skeleton width={120} height={24} />
        </div>
      ) : user ? (
        <>
          <ProfileInfo user={user} t={t} onEdit={handleEdit} />
          <ProfileBadges badges={user.badges || []} t={t} />
          <ProfileHistory t={t} />
          <ProfileSecurity user={user} onEdit={handleEdit} t={t} />
          <ProfileConnections user={user} t={t} />
          <ProfileSettings user={user} t={t} />
        </>
      ) : (
        <div style={{ color: theme.palette.text.secondary }}>{t('profile.notFound') || 'No se encontró información de perfil.'}</div>
      )}
    </Container>
  );
} 