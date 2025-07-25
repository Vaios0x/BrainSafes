import React from 'react';

const mockNotifications = [
  { id: 1, text: '¡Nuevo certificado emitido: Blockchain Fundamentals!' },
  { id: 2, text: 'Curso "DeFi Protocols" disponible para inscripción.' },
  { id: 3, text: 'Has ganado un nuevo badge: "Smart Contract Expert".' }
];

export default function DashboardNotifications() {
  return (
    <section style={{ background: '#f5f5f5', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <h3 style={{ color: '#1976d2', fontWeight: 700, marginTop: 0 }}>Notificaciones recientes</h3>
      <ul style={{ paddingLeft: 20 }}>
        {mockNotifications.map(n => (
          <li key={n.id} style={{ marginBottom: 8 }}>{n.text}</li>
        ))}
      </ul>
    </section>
  );
} 