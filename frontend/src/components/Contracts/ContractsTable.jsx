import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, useTheme, useMediaQuery } from '@mui/material';

export default function ContractsTable({ contratos, onSelect, selected }) {
  const [search, setSearch] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const filtered = contratos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Paper elevation={2} style={{ marginBottom: isMobile ? 16 : 32, background: theme.palette.background.paper }}>
      <div style={{ padding: isMobile ? 10 : 16 }}>
        <TextField
          label="Buscar contrato"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size={isMobile ? 'small' : 'medium'}
          fullWidth
        />
      </div>
      <TableContainer style={{ maxWidth: '100vw', overflowX: isMobile ? 'auto' : 'visible' }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Nombre</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Dirección</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Tipo</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: isMobile ? 13 : 16 }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(c => (
              <TableRow
                key={c.address}
                hover
                selected={selected && selected.address === c.address}
                onClick={() => onSelect(c)}
                style={{
                  cursor: 'pointer',
                  background: selected && selected.address === c.address ? theme.palette.info.light : undefined,
                  fontSize: isMobile ? 13 : 15,
                }}
                tabIndex={0}
                aria-label={`Seleccionar contrato ${c.name}`}
              >
                <TableCell style={{ color: theme.palette.text.primary }}>{c.name}</TableCell>
                <TableCell style={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>{c.address}</TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>{c.type}</TableCell>
                <TableCell style={{ color: theme.palette.text.primary }}>{c.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 