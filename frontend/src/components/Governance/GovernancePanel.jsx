import React, { useState, useEffect } from 'react';
import ProposalsList from './ProposalsList';
import ProposalDetails from './ProposalDetails';
import ProposalsFilterBar from './ProposalsFilterBar';
import { Alert, Fade, Container, useTheme, useMediaQuery } from '@mui/material';

// Propuestas simuladas
const propuestasEjemplo = [
  {
    id: 1,
    title: 'Actualizar tasa de recompensas',
    status: 'abierta',
    votes: { yes: 120, no: 30, abstain: 10 },
    closeDate: '2024-07-30',
    type: 'Economía',
    description: 'Se propone aumentar la tasa de recompensas de staking al 8%.',
  },
  {
    id: 2,
    title: 'Agregar nuevo curso NFT',
    status: 'cerrada',
    votes: { yes: 200, no: 15, abstain: 5 },
    closeDate: '2024-07-20',
    type: 'Educación',
    description: 'Propuesta para lanzar un nuevo curso certificado como NFT.',
  },
  {
    id: 3,
    title: 'Mejorar sistema de votación',
    status: 'abierta',
    votes: { yes: 80, no: 40, abstain: 20 },
    closeDate: '2024-08-05',
    type: 'Gobernanza',
    description: 'Actualizar el sistema de votación a Quadratic Voting.',
  },
];

export default function GovernancePanel() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState({ status: 'todas', type: 'todas', search: '' });
  const [showAlert, setShowAlert] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = propuestasEjemplo.filter(p =>
    (filter.status === 'todas' || p.status === filter.status) &&
    (filter.type === 'todas' || p.type === filter.type) &&
    (p.title.toLowerCase().includes(filter.search.toLowerCase()) || p.description.toLowerCase().includes(filter.search.toLowerCase()))
  );

  return (
    <Container
      maxWidth="lg"
      disableGutters={isMobile}
      style={{
        padding: isMobile ? '1rem 0.5rem' : '2.5rem 2rem',
        background: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>Gobernanza</h2>
      <Fade in={showAlert}><Alert severity="info" style={{ marginBottom: isMobile ? 10 : 16 }}>¡Nueva propuesta disponible! Actualiza la lista para verla.</Alert></Fade>
      <ProposalsFilterBar filter={filter} setFilter={setFilter} />
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 18 : 32, alignItems: 'flex-start', width: '100%' }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <ProposalsList propuestas={filtered} onSelect={setSelected} selected={selected} />
        </div>
        {selected && (
          <div style={{ flex: 3, minWidth: 0 }}>
            <ProposalDetails propuesta={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </Container>
  );
} 