import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Chip, Fade, useTheme } from '@mui/material';

const auditoriasSimuladas = [
  { fecha: '2024-07-20', resultado: 'Aprobado', recomendaciones: ['Actualizar dependencias críticas', 'Revisar lógica de acceso en multisig'] },
  { fecha: '2024-06-10', resultado: 'Observaciones', recomendaciones: ['Optimizar gas en función batchMint', 'Agregar validaciones a input de usuario'] },
];

const colorResultado = (resultado, theme) => {
  switch (resultado) {
    case 'Aprobado': return theme.palette.success.main;
    case 'Observaciones': return theme.palette.warning.main;
    case 'Crítico': return theme.palette.error.main;
    default: return theme.palette.text.primary;
  }
};

export default function SecurityAuditStatus() {
  const theme = useTheme();
  return (
    <Paper elevation={2} style={{ padding: 24, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Estado de Auditorías</Typography>
      <List>
        {auditoriasSimuladas.map((a, i) => (
          <Fade in key={a.fecha} timeout={500 + i * 200}>
            <ListItem alignItems="flex-start">
              <Chip label={a.resultado} style={{ marginRight: 16, background: colorResultado(a.resultado, theme), color: '#fff' }} />
              <ListItemText
                primary={<span style={{ color: theme.palette.text.primary }}>Fecha: {a.fecha}</span>}
                secondary={
                  <>
                    <Typography component="span" variant="body2" style={{ color: theme.palette.text.secondary }}>
                      Recomendaciones:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {a.recomendaciones.map((rec, idx) => (
                        <li key={idx} style={{ color: theme.palette.text.secondary }}>{rec}</li>
                      ))}
                    </ul>
                  </>
                }
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </Paper>
  );
} 