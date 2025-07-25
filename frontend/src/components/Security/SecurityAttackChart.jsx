import React from 'react';
import { Paper, Typography, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Front-running', ataques: 4 },
  { name: 'Reentrancy', ataques: 2 },
  { name: 'Phishing', ataques: 6 },
  { name: 'DoS', ataques: 1 },
  { name: 'Oracle', ataques: 3 },
];

export default function SecurityAttackChart() {
  const theme = useTheme();
  return (
    <Paper elevation={2} style={{ padding: 24, background: theme.palette.background.paper }}>
      <Typography variant="h6" gutterBottom style={{ color: theme.palette.text.primary }}>Gráfica de Ataques Detectados</Typography>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip contentStyle={{ background: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} />
          <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
          <Bar dataKey="ataques" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
} 