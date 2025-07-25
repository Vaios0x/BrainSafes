import React, { useState } from 'react';
import { Tabs, Tab, Box, Typography, Paper, TextField, Button, List, ListItem, ListItemText, Fade, Accordion, AccordionSummary, AccordionDetails, Container, useTheme, useMediaQuery } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function FaqsPanel() {
  const faqs = [
    { q: '¿Cómo conecto mi wallet?', a: 'Haz clic en "Conectar Wallet" y sigue las instrucciones de Metamask.' },
    { q: '¿Qué es un NFT?', a: 'Un NFT es un token no fungible, único y verificable en blockchain.' },
    { q: '¿Cómo obtengo un certificado?', a: 'Completa un curso y aprueba el quiz para recibir tu certificado NFT.' },
  ];
  const [search, setSearch] = useState('');
  const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Paper elevation={2} style={{ padding: isMobile ? 12 : 24, borderRadius: 12, maxWidth: 600, background: theme.palette.background.paper, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Preguntas Frecuentes (FAQs)</Typography>
      <TextField value={search} onChange={e => setSearch(e.target.value)} size={isMobile ? 'small' : 'medium'} fullWidth placeholder="Buscar pregunta..." style={{ marginBottom: isMobile ? 10 : 16 }} />
      <List>
        {filtered.map((f, i) => (
          <Fade in key={f.q} timeout={400 + i * 100}>
            <ListItem alignItems="flex-start" style={{ padding: isMobile ? '6px 2px' : '10px 8px' }}>
              <ListItemText primary={<span style={{ fontSize: isMobile ? 13 : 15, color: theme.palette.text.primary }}>{f.q}</span>} secondary={<span style={{ fontSize: isMobile ? 12 : 14, color: theme.palette.text.secondary }}>{f.a}</span>} />
            </ListItem>
          </Fade>
        ))}
      </List>
    </Paper>
  );
}

function ContactPanel() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const handleSend = () => {
    if (msg.trim()) {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      setMsg('');
    }
  };
  return (
    <Paper elevation={2} style={{ padding: isMobile ? 12 : 24, borderRadius: 12, maxWidth: 500, background: theme.palette.background.paper, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Contacto y Soporte</Typography>
      <TextField value={msg} onChange={e => setMsg(e.target.value)} size={isMobile ? 'small' : 'medium'} fullWidth placeholder="Describe tu problema o pregunta..." multiline rows={3} style={{ marginBottom: isMobile ? 8 : 12 }} />
      <Button variant="contained" onClick={handleSend} color="primary" style={{ fontSize: isMobile ? 13 : 15 }}>Enviar</Button>
      {sent && <Typography color="success.main" style={{ marginTop: 10, fontSize: isMobile ? 13 : 15 }}>¡Mensaje enviado! Te responderemos pronto.</Typography>}
      <Typography variant="body2" color="textSecondary" style={{ marginTop: isMobile ? 10 : 16, fontSize: isMobile ? 11 : 13 }}>
        (Simulado) Pronto: chat en vivo y soporte multilingüe.
      </Typography>
    </Paper>
  );
}

function DocsPanel() {
  const docs = [
    {
      cat: 'Guías y Manuales',
      items: [
        { name: 'Guía de usuario', url: '#' },
        { name: 'Manual de administración', url: '#' },
        { name: 'Guía de integración LMS', url: '#' },
        { name: 'Guía de seguridad', url: '#' },
      ],
    },
    {
      cat: 'Documentos Técnicos',
      items: [
        { name: 'Whitepaper', url: '#' },
        { name: 'API Reference', url: '#' },
        { name: 'Smart Contracts', url: '#' },
        { name: 'SDK Docs', url: '#' },
      ],
    },
    {
      cat: 'Tutoriales y Ejemplos',
      items: [
        { name: 'Primeros pasos con BrainSafes', url: '#' },
        { name: 'Ejemplo de integración con Moodle', url: '#' },
        { name: 'Tutorial de NFTs educativos', url: '#' },
        { name: 'Uso del Panel de Gobernanza', url: '#' },
      ],
    },
  ];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Paper elevation={2} style={{ padding: isMobile ? 12 : 24, borderRadius: 12, maxWidth: 700, background: theme.palette.background.paper, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 15 : 18 }}>Documentación y Guías</Typography>
      {docs.map((cat, i) => (
        <Accordion key={cat.cat} defaultExpanded={i === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" style={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: isMobile ? 13 : 15 }}>{cat.cat}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {cat.items.map((d, j) => (
                <ListItem button component="a" href={d.url} target="_blank" key={d.name} style={{ fontSize: isMobile ? 13 : 15 }}>
                  <ListItemText primary={d.name} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
}

export default function SupportPanel() {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Container
      maxWidth="md"
      disableGutters={isMobile}
      style={{
        padding: isMobile ? '1rem 0.5rem' : '2.5rem 2rem',
        background: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>Soporte y Ayuda</h2>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="FAQs" />
        <Tab label="Contacto" />
        <Tab label="Documentación" />
      </Tabs>
      <Box mt={isMobile ? 2 : 3}>
        {tab === 0 && <FaqsPanel />}
        {tab === 1 && <ContactPanel />}
        {tab === 2 && <DocsPanel />}
      </Box>
    </Container>
  );
} 