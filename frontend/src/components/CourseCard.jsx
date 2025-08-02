import React from 'react';
import { useTheme } from '@mui/material';

export default function CourseCard({ course }) {
  const theme = useTheme();
  const cardStyle = {
    background: theme.palette.background.paper,
    borderRadius: 8,
    boxShadow: theme.shadows[2],
    padding: 20,
    minWidth: 220,
    maxWidth: 340,
    margin: 12,
    flex: 1
  };
  return (
    <div style={cardStyle}>
      <img src={course.image} alt={course.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: theme.palette.text.primary, marginBottom: 8 }}>{course.title}</div>
      <div style={{ color: theme.palette.text.primary, fontSize: 15, marginBottom: 8 }}>{course.description}</div>
      <div style={{ color: theme.palette.primary.main, fontWeight: 500, marginBottom: 4 }}>Duración: {course.duration}</div>
      <div style={{ color: theme.palette.text.secondary, fontSize: 14, marginBottom: 8 }}>Nivel: {course.level}</div>
      <button style={{ background: theme.palette.primary.main, color: theme.palette.background.paper, border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'background 0.2s' }}>Inscribirse</button>
    </div>
  );
} 