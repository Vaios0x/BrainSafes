import React, { useState } from 'react';
import CourseList from './CourseList';
import { Tabs, Tab, Box, Typography, Paper, Chip, Button, Fade, LinearProgress, TextField, List, ListItem, ListItemText, Container, useTheme, useMediaQuery } from '@mui/material';

function QuizPanel() {
  const [step, setStep] = useState(0);
  const preguntas = [
    { q: '¿Qué es un smart contract?', a: ['Un contrato legal', 'Un programa en blockchain', 'Un NFT'], correct: 1 },
    { q: '¿Qué red es famosa por DeFi?', a: ['Ethereum', 'Bitcoin', 'Solana'], correct: 0 },
    { q: '¿Qué es un NFT?', a: ['Token fungible', 'Token no fungible', 'Un exchange'], correct: 1 },
  ];
  const [respuestas, setRespuestas] = useState([]);
  const theme = useTheme();
  const handleAnswer = idx => {
    setRespuestas([...respuestas, idx]);
    setStep(step + 1);
  };
  const aciertos = respuestas.filter((r, i) => r === preguntas[i]?.correct).length;
  return (
    <Paper elevation={2} style={{ padding: 24, borderRadius: 12, maxWidth: 500, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Quiz interactivo</Typography>
      {step < preguntas.length ? (
        <Box>
          <Typography variant="subtitle1" style={{ marginBottom: 12, color: theme.palette.text.primary }}>{preguntas[step].q}</Typography>
          {preguntas[step].a.map((op, i) => (
            <Button key={i} variant="outlined" onClick={() => handleAnswer(i)} style={{ marginRight: 8, marginBottom: 8, color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>{op}</Button>
          ))}
          <Box mt={2}><LinearProgress variant="determinate" value={((step) / preguntas.length) * 100} /></Box>
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle1" style={{ color: theme.palette.text.primary }}>¡Completado! Aciertos: {aciertos} de {preguntas.length}</Typography>
          <Chip label={aciertos === preguntas.length ? '¡Perfecto!' : aciertos > 1 ? '¡Bien hecho!' : 'Sigue practicando'} color={aciertos === preguntas.length ? 'success' : 'info'} style={{ marginTop: 8 }} />
        </Box>
      )}
    </Paper>
  );
}

function AchievementsPanel() {
  const logros = [
    { name: 'Pionero', desc: 'Completaste tu primer curso', icon: '🏅' },
    { name: 'Quiz Master', desc: 'Acierto perfecto en un quiz', icon: '🎯' },
    { name: 'Mentor', desc: 'Ayudaste a otro usuario', icon: '🤝' },
  ];
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Logros e Insignias</Typography>
      <Box display="flex" gap={2} flexWrap="wrap">
        {logros.map((l, i) => (
          <Fade in key={l.name} timeout={400 + i * 100}>
            <Paper elevation={2} style={{ padding: 18, borderRadius: 12, minWidth: 160, textAlign: 'center', background: theme.palette.background.paper }}>
              <div style={{ fontSize: 32 }}>{l.icon}</div>
              <Typography variant="subtitle1" style={{ fontWeight: 700, color: theme.palette.primary.main }}>{l.name}</Typography>
              <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>{l.desc}</Typography>
            </Paper>
          </Fade>
        ))}
      </Box>
    </Box>
  );
}

function DiscussionForum() {
  const [posts, setPosts] = useState([
    { user: 'Alice', msg: '¿Alguien recomienda recursos para DeFi?', date: '2024-07-24' },
    { user: 'Bob', msg: '¿Qué opinan de los NFTs educativos?', date: '2024-07-23' },
  ]);
  const [msg, setMsg] = useState('');
  const theme = useTheme();
  const handlePost = () => {
    if (msg.trim()) {
      setPosts([{ user: 'Tú', msg, date: new Date().toLocaleDateString() }, ...posts]);
      setMsg('');
    }
  };
  return (
    <Paper elevation={2} style={{ padding: 24, borderRadius: 12, maxWidth: 500, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Foro de discusión</Typography>
      <Box display="flex" gap={1} mb={2}>
        <TextField value={msg} onChange={e => setMsg(e.target.value)} size="small" fullWidth placeholder="Escribe tu mensaje..." />
        <Button variant="contained" onClick={handlePost} color="primary">Publicar</Button>
      </Box>
      <List>
        {posts.map((p, i) => (
          <ListItem key={i} alignItems="flex-start">
            <ListItemText primary={p.user} secondary={<><span>{p.msg}</span><br /><span style={{ fontSize: 12, color: theme.palette.text.secondary }}>{p.date}</span></>} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

function CertificateList() {
  const certificados = [
    { name: 'Blockchain Fundamentals', date: '2024-07-20', nft: true },
    { name: 'Smart Contracts Avanzados', date: '2024-07-22', nft: true },
  ];
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Certificados NFT</Typography>
      <Box display="flex" gap={2} flexWrap="wrap">
        {certificados.map((c, i) => (
          <Fade in key={c.name} timeout={400 + i * 100}>
            <Paper elevation={2} style={{ padding: 18, borderRadius: 12, minWidth: 180, textAlign: 'center', background: theme.palette.background.paper }}>
              <Chip label="NFT" color="success" style={{ marginBottom: 8 }} />
              <Typography variant="subtitle1" style={{ fontWeight: 700, color: theme.palette.primary.main }}>{c.name}</Typography>
              <Typography variant="body2" style={{ color: theme.palette.text.secondary }}>Emitido: {c.date}</Typography>
              <Button variant="outlined" size="small" style={{ marginTop: 8, color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}>Ver NFT</Button>
            </Paper>
          </Fade>
        ))}
      </Box>
    </Box>
  );
}

export default function LearningPanel() {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>Panel de Aprendizaje</h2>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Cursos" />
        <Tab label="Quizzes" />
        <Tab label="Logros" />
        <Tab label="Foros" />
        <Tab label="Certificados" />
      </Tabs>
      <Box mt={isMobile ? 2 : 3}>
        {tab === 0 && <CourseList />}
        {tab === 1 && <QuizPanel />}
        {tab === 2 && <AchievementsPanel />}
        {tab === 3 && <DiscussionForum />}
        {tab === 4 && <CertificateList />}
      </Box>
    </Container>
  );
} 