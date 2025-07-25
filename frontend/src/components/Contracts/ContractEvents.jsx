import React from 'react';
import { List, ListItem, ListItemText, Fade, Typography, useTheme, useMediaQuery } from '@mui/material';

const eventosSimulados = [
  { name: 'Transfer', args: { from: '0x123...', to: '0x456...', value: '1000' }, timestamp: '2024-07-25 12:00' },
  { name: 'Transfer', args: { from: '0x789...', to: '0xabc...', value: '500' }, timestamp: '2024-07-25 11:30' },
  { name: 'Approval', args: { owner: '0x123...', spender: '0xdef...', value: '200' }, timestamp: '2024-07-25 10:45' },
];

export default function ContractEvents({ events }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <div style={{ padding: isMobile ? '0 2px' : '0 8px' }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Eventos recientes</Typography>
      <List>
        {eventosSimulados.map((ev, i) => (
          <Fade in key={i} timeout={500 + i * 200}>
            <ListItem style={{ padding: isMobile ? '6px 2px' : '10px 8px' }}>
              <ListItemText
                primary={<span style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 15 }}>{`${ev.name} (${Object.entries(ev.args).map(([k, v]) => `${k}: ${v}`).join(', ')})`}</span>}
                secondary={<span style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 11 : 13 }}>{ev.timestamp}</span>}
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </div>
  );
} 