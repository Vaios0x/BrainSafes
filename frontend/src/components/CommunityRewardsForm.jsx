import React, { useRef } from 'react';
import { Box, TextField, Button, Tooltip, Snackbar, Alert, InputAdornment, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import SendIcon from '@mui/icons-material/Send';

export default function CommunityRewardsForm({ user, setUser, pts, setPts, loading, assignPoints, message, error }) {
  const [snackbar, setSnackbar] = React.useState({ open: false, type: '', msg: '' });
  const userInputRef = useRef();
  const ptsInputRef = useRef();

  React.useEffect(() => {
    if (message) setSnackbar({ open: true, type: 'success', msg: message });
    if (error) setSnackbar({ open: true, type: 'error', msg: error });
  }, [message, error]);

  const handleAssign = () => {
    assignPoints(user, pts);
  };

  return (
    <Box sx={{ background: '#fff', borderRadius: 2, boxShadow: '0 2px 8px #1976d220', p: 3, mb: 3 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><StarIcon color="warning" /> Asignar Puntos (Admin)</h3>
      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Tooltip title="Dirección del usuario" arrow enterDelay={300} leaveDelay={100} describeChild>
          <TextField
            inputRef={userInputRef}
            value={user}
            onChange={e => setUser(e.target.value)}
            placeholder="Dirección usuario"
            size="small"
            sx={{ minWidth: 180 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary" />
                </InputAdornment>
              ),
              tabIndex: 0,
              'aria-label': 'Dirección usuario',
              style: { outline: 'none' },
            }}
            autoComplete="off"
            role="textbox"
          />
        </Tooltip>
        <Tooltip title="Cantidad de puntos a asignar" arrow enterDelay={300} leaveDelay={100} describeChild>
          <TextField
            inputRef={ptsInputRef}
            value={pts}
            onChange={e => setPts(e.target.value)}
            placeholder="Puntos"
            size="small"
            sx={{ minWidth: 100 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <StarIcon color="primary" />
                </InputAdornment>
              ),
              tabIndex: 0,
              'aria-label': 'Cantidad de puntos',
              style: { outline: 'none' },
              inputMode: 'numeric',
            }}
            autoComplete="off"
            role="spinbutton"
            type="number"
          />
        </Tooltip>
        <Tooltip title="Asignar puntos" arrow enterDelay={300} leaveDelay={100} describeChild>
          <span>
            <Button
              onClick={handleAssign}
              disabled={loading || !user || !pts}
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
              tabIndex={0}
              aria-label="Asignar puntos"
              role="button"
              style={{ fontWeight: 600, minWidth: 120, boxShadow: '0 2px 8px #1976d220', transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: loading ? 'scale(0.98)' : 'scale(1)' }}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !loading && user && pts) handleAssign(); }}
              onFocus={e => e.currentTarget.style.boxShadow = '0 4px 16px #1976d220'}
              onBlur={e => e.currentTarget.style.boxShadow = '0 2px 8px #1976d220'}
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </span>
        </Tooltip>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.type} sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
} 