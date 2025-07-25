import React from 'react';
import { useTheme } from '@mui/material';

export default function CertificateCard({ cert }) {
  const theme = useTheme();
  const cardStyle = {
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    padding: 28,
    minWidth: 220,
    maxWidth: 340,
    margin: 12,
    flex: 1
  };
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 8 }}>{cert.title}</div>
      <div style={{ color: theme.palette.primary.main, fontWeight: 500, marginBottom: 8 }}>Emitido: {cert.issueDate}</div>
      <div style={{ color: theme.palette.text.secondary, fontSize: 14, marginBottom: 8 }}>Token ID: {cert.tokenId}</div>
      <div style={{ marginBottom: 12 }}>
        {cert.skills.map(skill => (
          <span key={skill} style={{ display: 'inline-block', background: theme.palette.info.light, color: theme.palette.primary.main, borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600, margin: '0 6px 6px 0' }}>{skill}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button style={{ background: theme.palette.primary.main, color: theme.palette.background.paper, border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Verificar</button>
        <button style={{ background: theme.palette.background.paper, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>Compartir</button>
      </div>
    </div>
  );
} 