import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText, Fade, Chip, Tooltip } from '@mui/material';

const sugerenciasSimuladas = [
  '¿Sabías que puedes automatizar tus auditorías de contratos?',
  'Te recomiendo revisar las últimas propuestas de gobernanza.',
  '¿Quieres aprender sobre NFTs? Prueba el módulo de cursos.',
];

const prediccionesSimuladas = [
  'Posible congestión de red detectada para mañana.',
  'Se recomienda optimizar el contrato BrainSafes.sol.',
];

export default function AIChatPanel() {
  const [messages, setMessages] = useState([
    { from: 'ai', text: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    setSuggestion(sugerenciasSimuladas[Math.floor(Math.random() * sugerenciasSimuladas.length)]);
  }, [messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: input }]);
    setTimeout(() => {
      // Simulación de respuesta IA
      let respuesta = 'Estoy procesando tu consulta...';
      if (input.toLowerCase().includes('nft')) respuesta = 'Puedes ver y comprar NFTs en el Marketplace.';
      else if (input.toLowerCase().includes('gobernanza')) respuesta = 'Las propuestas de gobernanza están en la sección Comunidad.';
      else if (input.toLowerCase().includes('seguridad')) respuesta = 'Revisa el Panel de Seguridad para alertas y auditorías.';
      else if (input.toLowerCase().includes('curso')) respuesta = 'Encuentra cursos en la sección Courses.';
      else respuesta = '¡Gracias por tu pregunta! Estoy aquí para ayudarte.';
      setMessages(prev => [...prev, { from: 'ai', text: respuesta }]);
    }, 900);
    setInput('');
  };

  return (
    <Paper elevation={4} style={{ maxWidth: 260, minWidth: 200, margin: '24px auto', padding: 16, borderRadius: 18, boxShadow: '0 4px 24px #0001' }}>
      <Typography variant="h6" style={{ fontWeight: 700, marginBottom: 10, fontSize: 17, color: '#1976d2' }}>Asistente IA</Typography>
      <Box style={{ minHeight: 120, maxHeight: 150, overflowY: 'auto', marginBottom: 10, background: '#f3f6fa', borderRadius: 10, padding: 8 }}>
        <List>
          {messages.map((msg, i) => (
            <Fade in key={i} timeout={400 + i * 100}>
              <ListItem alignItems={msg.from === 'ai' ? 'flex-start' : 'flex-end'}>
                <ListItemText
                  primary={msg.text}
                  primaryTypographyProps={{ style: { color: msg.from === 'ai' ? '#1976d2' : '#222', fontWeight: msg.from === 'ai' ? 600 : 400, fontSize: 14 } }}
                />
              </ListItem>
            </Fade>
          ))}
          <div ref={chatEndRef} />
        </List>
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Mensaje..."
          size="small"
          inputProps={{
            style: {
              fontSize: 13,
              padding: '7px 10px',
              borderRadius: 20,
              background: '#fff',
              border: '1px solid #e0e0e0',
              width: 90,
              minWidth: 60,
              maxWidth: 120,
            },
            maxLength: 120
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 20,
              background: '#fff',
              fontSize: 13,
              paddingRight: 0,
            },
            '& .MuiInputBase-input': {
              padding: '7px 10px',
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          style={{ minWidth: 38, height: 38, borderRadius: 20, fontSize: 13, marginLeft: 2, padding: 0 }}
        >
          ➤
        </Button>
      </Box>
      <Box mt={1}>
        <Typography variant="subtitle2" style={{ marginBottom: 6, fontSize: 13, color: '#222' }}>Sugerencia inteligente</Typography>
        <Tooltip title={suggestion} placement="top">
          <Chip label={suggestion} color="info" style={{ marginBottom: 6, maxWidth: 180, fontSize: 12, borderRadius: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
        </Tooltip>
        <Typography variant="subtitle2" style={{ marginTop: 8, marginBottom: 6, fontSize: 13, color: '#222' }}>Análisis predictivo</Typography>
        {prediccionesSimuladas.map((p, i) => (
          <Tooltip key={i} title={p} placement="top">
            <Chip label={p} color="warning" style={{ marginRight: 4, marginBottom: 6, maxWidth: 180, fontSize: 12, borderRadius: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
} 