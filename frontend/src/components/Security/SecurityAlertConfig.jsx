import React, { useState } from 'react';
import { Paper, Typography, FormGroup, FormControlLabel, Switch, Fade, useTheme } from '@mui/material';

export default function SecurityAlertConfig() {
  const theme = useTheme();
  const [config, setConfig] = useState({
    critico: true,
    alto: true,
    medio: false,
    bajo: false,
  });
  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.checked });
  };
  return (
    <Paper elevation={2} style={{ padding: 24, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Configuración de Alertas</Typography>
      <FormGroup>
        {['critico', 'alto', 'medio', 'bajo'].map((nivel, i) => (
          <Fade in key={nivel} timeout={500 + i * 200}>
            <FormControlLabel
              control={<Switch checked={config[nivel]} onChange={handleChange} name={nivel} color="primary" />}
              label={<span style={{ color: theme.palette.text.primary, textTransform: 'capitalize' }}>{nivel}</span>}
            />
          </Fade>
        ))}
      </FormGroup>
      <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
        Tus preferencias se guardan localmente y afectan solo a este dispositivo.
      </Typography>
    </Paper>
  );
} 