import React from 'react';
import { useTheme } from '@mui/material';

export default function BadgeCard({ badge }) {
  const theme = useTheme();
  return (
    <div style={{
      background: theme.palette.background.paper,
      borderRadius: 8,
      boxShadow: theme.shadows[2],
      padding: 18,
      minWidth: 120,
      maxWidth: 180,
      margin: 10,
      textAlign: 'center',
      color: theme.palette.text.primary
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{badge.icon}</div>
      <div style={{ fontWeight: 700, color: theme.palette.primary.main, marginBottom: 4 }}>{badge.name}</div>
      <div style={{ color: theme.palette.text.secondary, fontSize: 13 }}>{badge.desc}</div>
    </div>
  );
} 