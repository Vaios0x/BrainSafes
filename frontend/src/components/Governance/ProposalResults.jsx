import React from 'react';
import { Box, LinearProgress, Typography, useTheme, useMediaQuery, Tooltip, Fade } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import GavelIcon from '@mui/icons-material/Gavel';

export default function ProposalResults({ votes }) {
  const total = votes.yes + votes.no + votes.abstain;
  const percent = (n) => total === 0 ? 0 : Math.round((n / total) * 100);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (total === 0) {
    return (
      <Fade in>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={60}>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? 13 : 15 }}>
            Aún no hay votos registrados.
          </Typography>
        </Box>
      </Fade>
    );
  }
  return (
    <Box>
      <Typography variant="subtitle1" style={{ marginBottom: isMobile ? 4 : 8, color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16 }}>Resultados en tiempo real</Typography>
      <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} mb={1} flexDirection={isMobile ? 'column' : 'row'}>
        <Tooltip title={`Sí: ${votes.yes} votos (${percent(votes.yes)}%)`} arrow enterDelay={300} leaveDelay={100} describeChild>
          <Box minWidth={isMobile ? 60 : 80} style={{ fontSize: isMobile ? 13 : 15, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbUpIcon color="success" fontSize="small" /> Sí
          </Box>
        </Tooltip>
        <Box width="100%">
          <LinearProgress
            variant="determinate"
            value={percent(votes.yes)}
            color="success"
            sx={{ height: isMobile ? 8 : 12, borderRadius: 6, transition: 'width 0.7s, background 0.3s' }}
            aria-label={`Barra de votos a favor: ${votes.yes} votos, ${percent(votes.yes)}%`}
            role="progressbar"
          />
        </Box>
        <Box minWidth={isMobile ? 32 : 40} style={{ fontSize: isMobile ? 12 : 14 }}>{votes.yes} ({percent(votes.yes)}%)</Box>
      </Box>
      <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} mb={1} flexDirection={isMobile ? 'column' : 'row'}>
        <Tooltip title={`No: ${votes.no} votos (${percent(votes.no)}%)`} arrow enterDelay={300} leaveDelay={100} describeChild>
          <Box minWidth={isMobile ? 60 : 80} style={{ fontSize: isMobile ? 13 : 15, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbDownIcon color="error" fontSize="small" /> No
          </Box>
        </Tooltip>
        <Box width="100%">
          <LinearProgress
            variant="determinate"
            value={percent(votes.no)}
            color="error"
            sx={{ height: isMobile ? 8 : 12, borderRadius: 6, transition: 'width 0.7s, background 0.3s' }}
            aria-label={`Barra de votos en contra: ${votes.no} votos, ${percent(votes.no)}%`}
            role="progressbar"
          />
        </Box>
        <Box minWidth={isMobile ? 32 : 40} style={{ fontSize: isMobile ? 12 : 14 }}>{votes.no} ({percent(votes.no)}%)</Box>
      </Box>
      <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} mb={1} flexDirection={isMobile ? 'column' : 'row'}>
        <Tooltip title={`Abstención: ${votes.abstain} votos (${percent(votes.abstain)}%)`} arrow enterDelay={300} leaveDelay={100} describeChild>
          <Box minWidth={isMobile ? 60 : 80} style={{ fontSize: isMobile ? 13 : 15, display: 'flex', alignItems: 'center', gap: 4 }}>
            <GavelIcon color="info" fontSize="small" /> Abstención
          </Box>
        </Tooltip>
        <Box width="100%">
          <LinearProgress
            variant="determinate"
            value={percent(votes.abstain)}
            color="info"
            sx={{ height: isMobile ? 8 : 12, borderRadius: 6, transition: 'width 0.7s, background 0.3s' }}
            aria-label={`Barra de abstenciones: ${votes.abstain} votos, ${percent(votes.abstain)}%`}
            role="progressbar"
          />
        </Box>
        <Box minWidth={isMobile ? 32 : 40} style={{ fontSize: isMobile ? 12 : 14 }}>{votes.abstain} ({percent(votes.abstain)}%)</Box>
      </Box>
    </Box>
  );
} 