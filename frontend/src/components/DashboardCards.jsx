import React from 'react';
import { useTheme } from '@mui/material';

const mockData = {
  certificates: 4,
  courses: 3,
  badges: 7,
  progress: 82
};

export default function DashboardCards() {
  const theme = useTheme();
  const cardStyle = {
    background: theme.palette.background.paper,
    borderRadius: 8,
    boxShadow: theme.shadows[2],
    padding: 32,
    minWidth: 180,
    flex: 1,
    textAlign: 'center',
    margin: 8
  };
  return (
    <section style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 32, color: theme.palette.primary.main, fontWeight: 700 }}>{mockData.certificates}</div>
        <div>Certificados</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 32, color: theme.palette.primary.main, fontWeight: 700 }}>{mockData.courses}</div>
        <div>Cursos</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 32, color: theme.palette.primary.main, fontWeight: 700 }}>{mockData.badges}</div>
        <div>Badges</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 32, color: theme.palette.primary.main, fontWeight: 700 }}>{mockData.progress}%</div>
        <div>Progreso</div>
      </div>
    </section>
  );
} 