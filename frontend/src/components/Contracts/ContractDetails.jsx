import React, { useState } from 'react';
import { Paper, Typography, Tabs, Tab, Box, useTheme, useMediaQuery } from '@mui/material';
import ContractFunctionForm from './ContractFunctionForm';
import ContractEvents from './ContractEvents';
import ContractHistory from './ContractHistory';

export default function ContractDetails({ contrato }) {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Paper elevation={3} style={{ padding: isMobile ? 14 : 24, marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper }}>
      <Typography variant="h5" style={{ fontWeight: 700, marginBottom: isMobile ? 8 : 12, color: theme.palette.text.primary, fontSize: isMobile ? 18 : 22 }}>{contrato.name}</Typography>
      <div style={{ color: theme.palette.primary.main, marginBottom: isMobile ? 6 : 8, fontSize: isMobile ? 13 : 15 }}>
        Dirección: <span style={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>{contrato.address}</span>
      </div>
      <div style={{ marginBottom: isMobile ? 10 : 16, color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>
        Tipo: <b>{contrato.type}</b> | Estado: <b>{contrato.status}</b>
      </div>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Tabs contrato" variant={isMobile ? 'fullWidth' : 'standard'}>
        <Tab label="Funciones" style={{ fontSize: isMobile ? 13 : 15 }} />
        <Tab label="Eventos" style={{ fontSize: isMobile ? 13 : 15 }} />
        <Tab label="Historial" style={{ fontSize: isMobile ? 13 : 15 }} />
      </Tabs>
      <Box hidden={tab !== 0} mt={isMobile ? 1 : 2}>
        <ContractFunctionForm abi={contrato.abi} />
      </Box>
      <Box hidden={tab !== 1} mt={isMobile ? 1 : 2}>
        <ContractEvents events={contrato.events} />
      </Box>
      <Box hidden={tab !== 2} mt={isMobile ? 1 : 2}>
        <ContractHistory />
      </Box>
    </Paper>
  );
} 