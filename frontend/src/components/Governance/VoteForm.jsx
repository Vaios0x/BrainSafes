import React, { useState } from 'react';
import { Button, ButtonGroup, Fade, Alert, useTheme, useMediaQuery, Tooltip, CircularProgress, Snackbar } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import GavelIcon from '@mui/icons-material/Gavel';

export default function VoteForm({ onVote }) {
  const [voted, setVoted] = useState(false);
  const [option, setOption] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, type: '', msg: '' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleVote = (opt) => {
    if (voted) {
      setError('Ya has votado en esta propuesta.');
      setSnackbar({ open: true, type: 'error', msg: 'Ya has votado en esta propuesta.' });
      return;
    }
    setOption(opt);
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setVoted(true);
      setLoading(false);
      setSnackbar({ open: true, type: 'success', msg: '¡Voto registrado!' });
      onVote(opt);
    }, 1000);
  };

  const voteOptions = [
    { key: 'yes', label: 'Sí', icon: <ThumbUpIcon />, tooltip: 'Votar a favor' },
    { key: 'no', label: 'No', icon: <ThumbDownIcon />, tooltip: 'Votar en contra' },
    { key: 'abstain', label: 'Abstención', icon: <GavelIcon />, tooltip: 'Abstenerse' },
  ];

  return (
    <div style={{ marginBottom: isMobile ? 10 : 16 }}>
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {voteOptions.map(opt => (
            <Tooltip key={opt.key} title={opt.tooltip} arrow enterDelay={300} leaveDelay={100} describeChild>
              <span>
                <Button
                  onClick={() => handleVote(opt.key)}
                  disabled={voted || loading}
                  variant="contained"
                  color="primary"
                  style={{ fontSize: 15, boxShadow: theme.shadows[2], transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: loading && option === opt.key ? 'scale(0.98)' : 'scale(1)' }}
                  startIcon={loading && option === opt.key ? <CircularProgress size={16} /> : opt.icon}
                  tabIndex={0}
                  aria-label={opt.tooltip}
                  role="button"
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !voted && !loading) handleVote(opt.key); }}
                  onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                  onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                >
                  {loading && option === opt.key ? 'Votando...' : opt.label}
                </Button>
              </span>
            </Tooltip>
          ))}
        </div>
      ) : (
        <ButtonGroup variant="contained" color="primary">
          {voteOptions.map(opt => (
            <Tooltip key={opt.key} title={opt.tooltip} arrow enterDelay={300} leaveDelay={100} describeChild>
              <span>
                <Button
                  onClick={() => handleVote(opt.key)}
                  disabled={voted || loading}
                  style={{ fontSize: 16, boxShadow: theme.shadows[2], transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: loading && option === opt.key ? 'scale(0.98)' : 'scale(1)' }}
                  startIcon={loading && option === opt.key ? <CircularProgress size={16} /> : opt.icon}
                  tabIndex={0}
                  aria-label={opt.tooltip}
                  role="button"
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !voted && !loading) handleVote(opt.key); }}
                  onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                  onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                >
                  {loading && option === opt.key ? 'Votando...' : opt.label}
                </Button>
              </span>
            </Tooltip>
          ))}
        </ButtonGroup>
      )}
      <Fade in={!!error}><Alert severity="error" style={{ marginTop: 12, fontSize: isMobile ? 13 : 15 }}>{error}</Alert></Fade>
      <Fade in={voted && !error}><Alert severity="success" style={{ marginTop: 12, fontSize: isMobile ? 13 : 15 }}>¡Voto registrado!</Alert></Fade>
      <Snackbar open={snackbar.open} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
    </div>
  );
} 