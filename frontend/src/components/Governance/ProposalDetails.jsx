import React, { useState } from 'react';
import { Paper, Typography, Button, Box, Fade, IconButton, TextField, List, ListItem, ListItemText, useTheme, useMediaQuery, Tooltip, Skeleton, Avatar, CircularProgress } from '@mui/material';
import VoteForm from './VoteForm';
import ProposalResults from './ProposalResults';
import CloseIcon from '@mui/icons-material/Close';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import CommentIcon from '@mui/icons-material/Comment';

const comentariosSimulados = [
  { user: 'Alice', text: 'Me parece una gran propuesta.', date: '2024-07-25 10:00' },
  { user: 'Bob', text: '¿Cómo afectará esto a los usuarios actuales?', date: '2024-07-25 10:15' },
];

const statusIcon = {
  'abierta': { icon: <HowToVoteIcon color="primary" />, label: 'Propuesta abierta' },
  'aprobada': { icon: <CheckCircleIcon color="success" />, label: 'Propuesta aprobada' },
  'rechazada': { icon: <CancelIcon color="error" />, label: 'Propuesta rechazada' },
};
const typeIcon = {
  'Gobernanza': { icon: <GavelIcon color="action" />, label: 'Propuesta de gobernanza' },
  'Economía': { icon: <GavelIcon color="secondary" />, label: 'Propuesta económica' },
  'Educación': { icon: <GavelIcon color="primary" />, label: 'Propuesta educativa' },
};

export default function ProposalDetails({ propuesta, onClose, loading, error }) {
  const [votes, setVotes] = useState(propuesta?.votes || { yes: 0, no: 0, abstain: 0 });
  const [voted, setVoted] = useState(false);
  const [comments, setComments] = useState(comentariosSimulados);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const handleVote = (option) => {
    setVotes(prev => ({ ...prev, [option]: prev[option] + 1 }));
    setVoted(true);
  };
  const handleAddComment = () => {
    if (newComment.trim()) {
      setCommentLoading(true);
      setTimeout(() => {
        setComments([...comments, { user: 'Tú', text: newComment, date: new Date().toLocaleString() }]);
        setNewComment('');
        setCommentLoading(false);
      }, 900);
    }
  };
  const votingPower = 1;

  if (loading) {
    return (
      <Fade in>
        <Paper elevation={3} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper }}>
          <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={80} />
        </Paper>
      </Fade>
    );
  }
  if (error) {
    return (
      <Fade in>
        <Paper elevation={3} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper, color: theme.palette.error.main }}>
          <Typography variant="h6" color="error">Error al cargar la propuesta. Intenta de nuevo.</Typography>
        </Paper>
      </Fade>
    );
  }
  return (
    <Fade in>
      <Paper elevation={3} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 16 : 32, position: 'relative', background: theme.palette.background.paper }}>
        <Tooltip title="Cerrar detalle" arrow enterDelay={300} leaveDelay={100} describeChild>
          <IconButton onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, boxShadow: theme.shadows[1], transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none' }} aria-label="Cerrar" tabIndex={0} role="button">
            <CloseIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" style={{ fontWeight: 700, marginBottom: isMobile ? 8 : 12, color: theme.palette.text.primary, fontSize: isMobile ? 18 : 22 }}>{propuesta.title}</Typography>
        <Box display="flex" alignItems="center" gap={2} mb={isMobile ? 1 : 2}>
          <Tooltip title={statusIcon[propuesta.status]?.label || propuesta.status} arrow enterDelay={300} leaveDelay={100} describeChild>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {statusIcon[propuesta.status]?.icon || <HowToVoteIcon color="disabled" />} <b>{propuesta.status}</b>
            </span>
          </Tooltip>
          <span style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 13 : 15 }}>|</span>
          <Tooltip title={typeIcon[propuesta.type]?.label || propuesta.type} arrow enterDelay={300} leaveDelay={100} describeChild>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {typeIcon[propuesta.type]?.icon || <GavelIcon color="disabled" />} <b>{propuesta.type}</b>
            </span>
          </Tooltip>
          <span style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 13 : 15 }}>|</span>
          <Tooltip title={`Autor: ${propuesta.author}`} arrow enterDelay={300} leaveDelay={100} describeChild>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 14 }}>{propuesta.author?.[0]?.toUpperCase() || <PersonIcon fontSize="small" />}</Avatar> {propuesta.author}
            </span>
          </Tooltip>
        </Box>
        <div style={{ color: theme.palette.primary.main, marginBottom: isMobile ? 6 : 8, fontSize: isMobile ? 13 : 15 }}>Cierra: <b>{propuesta.closeDate}</b></div>
        <Typography variant="body1" style={{ marginBottom: isMobile ? 12 : 20, color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16 }}>{propuesta.description}</Typography>
        {!voted && propuesta.status === 'abierta' && (
          <VoteForm onVote={handleVote} />
        )}
        <Box mt={isMobile ? 1 : 2}>
          <ProposalResults votes={votes} />
        </Box>
        <Box mt={isMobile ? 2 : 4}>
          <Typography variant="h6" style={{ marginBottom: isMobile ? 6 : 8, color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Comentarios y Discusión</Typography>
          <List>
            {comments.map((c, i) => (
              <ListItem key={i} alignItems="flex-start" style={{ padding: isMobile ? '6px 2px' : '10px 8px' }}>
                <ListItemText primary={c.user} secondary={<><span>{c.text}</span><br /><span style={{ fontSize: 12, color: theme.palette.text.secondary }}>{c.date}</span></>} />
              </ListItem>
            ))}
          </List>
          <Box display="flex" gap={isMobile ? 1 : 2} mt={2} flexDirection={isMobile ? 'column' : 'row'}>
            <TextField
              label="Agregar comentario"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              sx={{ fontSize: isMobile ? 13 : 15 }}
              inputProps={{ tabIndex: 0, 'aria-label': 'Agregar comentario', style: { outline: 'none' } }}
              role="textbox"
            />
            <Tooltip title="Comentar" arrow enterDelay={300} leaveDelay={100} describeChild>
              <span>
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || commentLoading}
                  style={{ fontSize: isMobile ? 13 : 15, minWidth: isMobile ? 90 : 120, boxShadow: theme.shadows[2], transition: 'box-shadow 0.2s, transform 0.2s', outline: 'none', transform: commentLoading ? 'scale(0.98)' : 'scale(1)' }}
                  startIcon={commentLoading ? <CircularProgress size={16} /> : <CommentIcon />}
                  tabIndex={0}
                  aria-label="Comentar"
                  role="button"
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !commentLoading) handleAddComment(); }}
                  onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
                  onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
                >
                  {commentLoading ? 'Enviando...' : 'Comentar'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <div style={{ marginBottom: 8, color: theme.palette.success.main, fontSize: isMobile ? 13 : 15 }}>Tu poder de voto: <b>{votingPower}</b></div>
      </Paper>
    </Fade>
  );
} 