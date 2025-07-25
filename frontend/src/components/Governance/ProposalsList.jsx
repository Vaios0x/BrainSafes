import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, useMediaQuery, Tooltip, Skeleton, Box, Avatar } from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';

const statusIcon = {
  'Abierta': { icon: <HowToVoteIcon color="primary" />, label: 'Propuesta abierta' },
  'Aprobada': { icon: <CheckCircleIcon color="success" />, label: 'Propuesta aprobada' },
  'Rechazada': { icon: <CancelIcon color="error" />, label: 'Propuesta rechazada' },
};
const typeIcon = {
  'General': { icon: <GavelIcon color="action" />, label: 'Propuesta general' },
  'Finanzas': { icon: <GavelIcon color="secondary" />, label: 'Propuesta financiera' },
};

export default function ProposalsList({ propuestas, onSelect, selected, loading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hovered, setHovered] = React.useState(-1);

  if (loading) {
    return (
      <Paper elevation={2} style={{ marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper }}>
        <TableContainer style={{ maxWidth: '100vw', overflowX: isMobile ? 'auto' : 'visible' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Votos</TableCell>
                <TableCell>Fecha de cierre</TableCell>
                <TableCell>Tipo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1,2,3].map(i => (
                <TableRow key={i}>
                  {Array.from({length:5}).map((_,j) => (
                    <TableCell key={j}><Skeleton variant="text" width={j===0?120:60} height={24} aria-busy="true" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
  if (!propuestas || propuestas.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={180} width="100%" mt={4}>
        <HowToVoteIcon color="disabled" sx={{ fontSize: 56, mb: 1 }} />
        <span style={{ color: theme.palette.text.secondary, fontSize: 18 }}>No hay propuestas disponibles.</span>
      </Box>
    );
  }
  return (
    <Paper elevation={2} style={{ marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper }}>
      <TableContainer style={{ maxWidth: '100vw', overflowX: isMobile ? 'auto' : 'visible' }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Título</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Estado</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Votos</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Fecha de cierre</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Tipo</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Autor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {propuestas.map((p, idx) => (
              <TableRow
                key={p.id}
                hover
                selected={selected && selected.id === p.id}
                onClick={() => onSelect(p)}
                style={{
                  cursor: 'pointer',
                  background: selected && selected.id === p.id ? theme.palette.info.light : undefined,
                  fontSize: isMobile ? 13 : 15,
                  boxShadow: selected && selected.id === p.id ? theme.shadows[6] : hovered === idx ? theme.shadows[3] : theme.shadows[1],
                  transform: hovered === idx ? 'scale(1.01)' : 'scale(1)',
                  outline: hovered === idx || (selected && selected.id === p.id) ? `2px solid ${theme.palette.primary.main}` : 'none',
                  transition: 'box-shadow 0.2s, transform 0.2s, outline 0.2s',
                }}
                tabIndex={0}
                aria-label={`Seleccionar propuesta: ${p.title}. Estado: ${p.status}. Tipo: ${p.type}. Autor: ${p.author}`}
                role="button"
                onFocus={() => setHovered(idx)}
                onBlur={() => setHovered(-1)}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(-1)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(p);
                  }
                }}
              >
                <TableCell style={{ color: theme.palette.text.primary }}>
                  <Tooltip title={p.summary || p.title} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span style={{ fontWeight: 500, cursor: 'pointer' }}>{p.title}</span>
                  </Tooltip>
                </TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>
                  <Tooltip title={statusIcon[p.status]?.label || p.status} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {statusIcon[p.status]?.icon || <HowToVoteIcon color="disabled" />} {p.status}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>{p.votes.yes + p.votes.no + p.votes.abstain}</TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>{p.closeDate}</TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>
                  <Tooltip title={typeIcon[p.type]?.label || p.type} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {typeIcon[p.type]?.icon || <GavelIcon color="disabled" />} {p.type}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>
                  <Tooltip title={`Autor: ${p.author}`} arrow enterDelay={300} leaveDelay={100} describeChild>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 14 }}>{p.author?.[0]?.toUpperCase() || <PersonIcon fontSize="small" />}</Avatar> {p.author}
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 