import React from 'react';
import { List, ListItem, ListItemText, Fade, Typography, useTheme, useMediaQuery } from '@mui/material';

const historialSimulado = [
  { fn: 'transfer', params: 'to: 0x456..., amount: 100', result: 'OK', timestamp: '2024-07-25 12:05' },
  { fn: 'balanceOf', params: 'account: 0x123...', result: '12345', timestamp: '2024-07-25 12:01' },
  { fn: 'vote', params: 'proposalId: 1, support: true', result: 'OK', timestamp: '2024-07-25 11:50' },
];

export default function ContractHistory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <div style={{ padding: isMobile ? '0 2px' : '0 8px' }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Historial de interacciones</Typography>
      <List>
        {historialSimulado.map((h, i) => (
          <Fade in key={i} timeout={500 + i * 200}>
            <ListItem style={{ padding: isMobile ? '6px 2px' : '10px 8px' }}>
              <ListItemText
                primary={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>{`${h.fn} (${h.params})`}</span>}
                secondary={<span style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13 }}>{`Resultado: ${h.result} | ${h.timestamp}`}</span>}
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </div>
  );
} 