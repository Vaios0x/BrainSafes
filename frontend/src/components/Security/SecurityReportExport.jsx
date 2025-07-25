import React, { useState } from 'react';
import { Paper, Typography, Button, useTheme } from '@mui/material';

export default function SecurityReportExport() {
  const theme = useTheme();
  const [generando, setGenerando] = useState(false);
  const handleExport = () => {
    setGenerando(true);
    setTimeout(() => setGenerando(false), 1500);
  };
  return (
    <Paper elevation={2} style={{ padding: 24, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Exportar Reporte de Seguridad</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleExport}
        disabled={generando}
        style={{ marginTop: 16 }}
      >
        {generando ? 'Generando...' : 'Exportar PDF'}
      </Button>
    </Paper>
  );
} 