import React, { useState } from 'react';
import { Paper, Typography, LinearProgress, Button, Box, Chip, Fade, useTheme, useMediaQuery } from '@mui/material';

const cursosSimulados = [
  {
    id: 1,
    nombre: 'Introducción a Blockchain',
    progreso: 100,
    certificado: true,
    badge: 'Pionero',
    mentor: 'Alice',
  },
  {
    id: 2,
    nombre: 'Smart Contracts Avanzados',
    progreso: 60,
    certificado: false,
    badge: 'Desarrollador',
    mentor: 'Bob',
  },
  {
    id: 3,
    nombre: 'DeFi y Finanzas Web3',
    progreso: 20,
    certificado: false,
    badge: 'Financiero',
    mentor: 'Charlie',
  },
];

export default function CourseList() {
  const [selected, setSelected] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Box>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Cursos y Tutoriales</Typography>
      {cursosSimulados.map((c, i) => (
        <Fade in key={c.id} timeout={400 + i * 100}>
          <Paper elevation={2} style={{ padding: isMobile ? 10 : 18, marginBottom: isMobile ? 10 : 18, borderRadius: 12, background: theme.palette.background.paper }}>
            <Box display={isMobile ? 'block' : 'flex'} alignItems={isMobile ? 'stretch' : 'center'} justifyContent="space-between" gap={isMobile ? 1 : 2}>
              <Box>
                <Typography variant="subtitle1" style={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: isMobile ? 14 : 16 }}>{c.nombre}</Typography>
                <Box display="flex" gap={1} alignItems="center" mt={1} flexDirection={isMobile ? 'column' : 'row'}>
                  <Chip label={c.badge} color="info" size="small" style={{ fontSize: isMobile ? 11 : 13 }} />
                  <Chip label={`Mentor: ${c.mentor}`} color="default" size="small" style={{ fontSize: isMobile ? 11 : 13 }} />
                  {c.certificado && <Chip label="Certificado NFT" color="success" size="small" style={{ fontSize: isMobile ? 11 : 13 }} />}
                </Box>
                <Box mt={1} display={isMobile ? 'block' : 'flex'} alignItems="center">
                  <LinearProgress variant="determinate" value={c.progreso} style={{ height: isMobile ? 6 : 8, borderRadius: 6, width: isMobile ? 120 : 180 }} />
                  <Typography variant="caption" style={{ marginLeft: 8, fontSize: isMobile ? 11 : 13 }}>{c.progreso}% completado</Typography>
                </Box>
              </Box>
              <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} gap={isMobile ? 1 : 1} mt={isMobile ? 2 : 0}>
                <Button variant="outlined" size={isMobile ? 'small' : 'medium'} style={{ fontSize: isMobile ? 13 : 15 }} onClick={() => setSelected(c.id)}>Quiz</Button>
                {c.certificado && <Button variant="contained" size={isMobile ? 'small' : 'medium'} color="success" style={{ fontSize: isMobile ? 13 : 15 }}>Ver Certificado</Button>}
              </Box>
            </Box>
            {selected === c.id && (
              <Box mt={2}>
                <Typography variant="body2" style={{ fontSize: isMobile ? 12 : 14 }}>(Simulación) Aquí iría el quiz interactivo para este curso.</Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      ))}
    </Box>
  );
} 