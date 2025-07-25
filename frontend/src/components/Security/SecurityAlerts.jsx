import React from 'react';
import { List, ListItem, ListItemText, Chip, Paper, Typography, Fade, useTheme } from '@mui/material';

const alertasSimuladas = [
  { id: 1, nivel: 'Crítico', fecha: '2024-07-25 10:00', desc: 'Ataque de front-running detectado en contrato DeFi.' },
  { id: 2, nivel: 'Alto', fecha: '2024-07-24 18:30', desc: 'Intento de acceso no autorizado a multisig.' },
  { id: 3, nivel: 'Medio', fecha: '2024-07-23 15:10', desc: 'Uso de función deprecated en contrato NFT.' },
  { id: 4, nivel: 'Bajo', fecha: '2024-07-22 09:45', desc: 'Transacción revertida por falta de gas.' },
];

const colorNivel = (nivel, theme) => {
  switch (nivel) {
    case 'Crítico': return theme.palette.error.main;
    case 'Alto': return theme.palette.warning.main;
    case 'Medio': return theme.palette.info.main;
    case 'Bajo': return theme.palette.text.secondary;
    default: return theme.palette.text.primary;
  }
};

export default function SecurityAlerts() {
  const theme = useTheme();
  return (
    <Paper elevation={2} style={{ padding: 24, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Alertas de Seguridad</Typography>
      <List>
        {alertasSimuladas.map((a, i) => (
          <Fade in key={a.id} timeout={500 + i * 200}>
            <ListItem>
              <Chip label={a.nivel} style={{ marginRight: 16, background: colorNivel(a.nivel, theme), color: '#fff' }} />
              <ListItemText
                primary={a.desc}
                secondary={<span style={{ color: theme.palette.text.secondary }}>{a.fecha}</span>}
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </Paper>
  );
} 