import React, { useState } from 'react';
import { Box, Button, MenuItem, Select, TextField, Typography, Fade, Alert, useTheme, useMediaQuery } from '@mui/material';

export default function ContractFunctionForm({ abi }) {
  const [selectedFn, setSelectedFn] = useState(abi[0]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFnChange = (e) => {
    const fn = abi.find(f => f.name === e.target.value);
    setSelectedFn(fn);
    setInputs({});
    setResult(null);
    setError(null);
  };

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!selectedFn.inputs) return true;
    for (const inp of selectedFn.inputs) {
      if (!inputs[inp.name] || inputs[inp.name].toString().trim() === '') return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      if (selectedFn.stateMutability === 'view') {
        setResult('Resultado simulado: 12345');
      } else {
        setResult('Transacción enviada (simulada)');
      }
    }, 1200);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary, fontSize: isMobile ? 16 : 20 }}>Funciones disponibles</Typography>
      <Select
        value={selectedFn.name}
        onChange={handleFnChange}
        style={{ marginBottom: isMobile ? 10 : 16, minWidth: isMobile ? 140 : 220, fontSize: isMobile ? 13 : 15 }}
        size={isMobile ? 'small' : 'medium'}
      >
        {abi.map(fn => (
          <MenuItem key={fn.name} value={fn.name} style={{ fontSize: isMobile ? 13 : 15 }}>{fn.name} ({fn.stateMutability})</MenuItem>
        ))}
      </Select>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16, maxWidth: isMobile ? 260 : 400 }}>
        {selectedFn.inputs && selectedFn.inputs.map(inp => (
          <TextField
            key={inp.name}
            label={`${inp.name} (${inp.type})`}
            value={inputs[inp.name] || ''}
            onChange={e => handleInputChange(inp.name, e.target.value)}
            required
            size={isMobile ? 'small' : 'medium'}
            sx={{ fontSize: isMobile ? 13 : 15 }}
          />
        ))}
        <Button type="submit" variant="contained" color="primary" disabled={!validate() || loading} style={{ fontSize: isMobile ? 13 : 15 }}>
          {loading ? 'Procesando...' : selectedFn.stateMutability === 'view' ? 'Consultar' : 'Enviar'}
        </Button>
      </form>
      <Box mt={2}>
        <Fade in={!!result}><Alert severity="success" sx={{ fontSize: isMobile ? 13 : 15 }}>{result}</Alert></Fade>
        <Fade in={!!error}><Alert severity="error" sx={{ fontSize: isMobile ? 13 : 15 }}>{error}</Alert></Fade>
      </Box>
    </Box>
  );
} 