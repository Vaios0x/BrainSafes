import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Tooltip, IconButton, Fade, CircularProgress } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RedeemIcon from '@mui/icons-material/Redeem';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

export default function CommunityRewardsPanel() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const { showToast } = useToast();
  const [hovered, setHovered] = useState(-1);
  const [snackbar, setSnackbar] = useState({ open: false, type: '', msg: '' });
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setRewards([
        { id: 1, name: 'Premio Colaborador', description: 'Por colaborar activamente en la comunidad.', claimed: false, type: 'star' },
        { id: 2, name: 'Premio Mentor', description: 'Por mentoría y ayuda a nuevos usuarios.', claimed: true, type: 'gift' }
      ]);
      setLoading(false);
      showToast('Recompensas de comunidad cargadas', 'info');
    }, 1400);
  }, [showToast]);

  const handleClaim = (id) => {
    setClaimingId(id);
    setTimeout(() => {
      setRewards(rewards => rewards.map(r => r.id === id ? { ...r, claimed: true } : r));
      setSnackbar({ open: true, type: 'success', msg: '¡Recompensa reclamada!' });
      setClaimingId(null);
    }, 1200);
  };
  const handleShare = (id) => {
    setSnackbar({ open: true, type: 'info', msg: '¡Comparte tu logro en redes sociales!' });
  };
  const handleDetails = (id) => {
    setSnackbar({ open: true, type: 'info', msg: 'Detalles de la recompensa (simulado).' });
  };

  // Asignar icono según tipo de recompensa
  const getRewardIcon = (reward) => {
    if (reward.type === 'gift') return <CardGiftcardIcon color={reward.claimed ? 'disabled' : 'secondary'} fontSize="large" />;
    if (reward.type === 'star') return <StarIcon color={reward.claimed ? 'disabled' : 'warning'} fontSize="large" />;
    return <EmojiEventsIcon color={reward.claimed ? 'disabled' : 'primary'} fontSize="large" />;
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Comunidad' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Recompensas de Comunidad</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <Skeleton width={180} height={60} aria-busy="true" aria-label="Cargando recompensa" />
          <Skeleton width={180} height={60} aria-busy="true" aria-label="Cargando recompensa" />
        </div>
      ) : rewards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, width: '100%', marginTop: 32 }}>
          <SentimentDissatisfiedIcon color="disabled" sx={{ fontSize: 56, mb: 1 }} />
          <span style={{ color: '#888', fontSize: 18, marginTop: 8 }}>No hay recompensas disponibles.</span>
        </div>
      ) : (
        <ul style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 0, listStyle: 'none' }} role="list" aria-label="Lista de recompensas de comunidad">
          {rewards.map((r, idx) => (
            <Fade in timeout={500} key={r.id}>
              <li
                style={{
                  minWidth: 200,
                  minHeight: 80,
                  background: r.claimed ? '#e0e0e0' : '#f3f3f3',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 18,
                  boxShadow: hovered === idx ? '0 4px 16px #1976d220' : '0 2px 8px #1976d220',
                  transform: hovered === idx ? 'scale(1.03)' : 'scale(1)',
                  outline: hovered === idx ? '2px solid #1976d2' : 'none',
                  transition: 'box-shadow 0.2s, transform 0.2s, outline 0.2s',
                  position: 'relative',
                  cursor: 'pointer',
                  marginBottom: 8
                }}
                tabIndex={0}
                aria-label={`Recompensa: ${r.name}. Estado: ${r.claimed ? 'Reclamada' : 'Disponible'}. Acciones: reclamar, ver detalles, compartir.`}
                role="listitem"
                onFocus={() => setHovered(idx)}
                onBlur={() => setHovered(-1)}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(-1)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !r.claimed) handleClaim(r.id);
                }}
              >
                <Tooltip title={r.description} arrow enterDelay={300} leaveDelay={100} describeChild>
                  <span>{getRewardIcon(r)}</span>
                </Tooltip>
                <Tooltip title={r.description} arrow enterDelay={300} leaveDelay={100} describeChild>
                  <span style={{ margin: '8px 0 4px 0', fontWeight: 700 }}>{r.name}</span>
                </Tooltip>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Tooltip title={r.claimed ? 'Ya reclamada' : 'Reclamar recompensa'} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span>
                      <IconButton
                        color={r.claimed ? 'default' : 'primary'}
                        onClick={e => { e.stopPropagation(); if (!r.claimed && !claimingId) handleClaim(r.id); }}
                        disabled={r.claimed || claimingId === r.id}
                        aria-label={r.claimed ? 'Recompensa ya reclamada' : 'Reclamar recompensa'}
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !r.claimed && !claimingId) { e.stopPropagation(); handleClaim(r.id); } }}
                        style={{ boxShadow: hovered === idx ? '0 4px 16px #1976d220' : '0 2px 8px #1976d220', transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: hovered === idx ? 'scale(1.08)' : 'scale(1)' }}
                        onFocus={e => e.currentTarget.style.boxShadow = '0 4px 16px #1976d220'}
                        onBlur={e => e.currentTarget.style.boxShadow = '0 2px 8px #1976d220'}
                      >
                        {claimingId === r.id ? <CircularProgress size={20} /> : <RedeemIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Ver detalles de la recompensa" arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span>
                      <IconButton color="info" onClick={e => { e.stopPropagation(); handleDetails(r.id); }} aria-label="Ver detalles" tabIndex={0} role="button"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleDetails(r.id); } }}
                        style={{ boxShadow: hovered === idx ? '0 4px 16px #1976d220' : '0 2px 8px #1976d220', transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: hovered === idx ? 'scale(1.08)' : 'scale(1)' }}
                        onFocus={e => e.currentTarget.style.boxShadow = '0 4px 16px #1976d220'}
                        onBlur={e => e.currentTarget.style.boxShadow = '0 2px 8px #1976d220'}
                      >
                        <InfoOutlinedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Compartir recompensa" arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span>
                      <IconButton color="secondary" onClick={e => { e.stopPropagation(); handleShare(r.id); }} aria-label="Compartir recompensa" tabIndex={0} role="button"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleShare(r.id); } }}
                        style={{ boxShadow: hovered === idx ? '0 4px 16px #1976d220' : '0 2px 8px #1976d220', transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: hovered === idx ? 'scale(1.08)' : 'scale(1)' }}
                        onFocus={e => e.currentTarget.style.boxShadow = '0 4px 16px #1976d220'}
                        onBlur={e => e.currentTarget.style.boxShadow = '0 2px 8px #1976d220'}
                      >
                        <ShareIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
                {r.claimed && <Fade in><span style={{ color: '#388e3c', fontSize: 13, marginTop: 2, transition: 'opacity 0.3s' }}>¡Reclamada!</span></Fade>}
              </li>
            </Fade>
          ))}
        </ul>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} sx={{ width: '100%' }} role={snackbar.type === 'success' ? 'status' : 'alert'}>{snackbar.msg}</Alert>
      </Snackbar>
    </main>
  );
} 