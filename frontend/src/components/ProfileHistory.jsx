import React from 'react';

export default function ProfileHistory({ t }) {
  return (
    <section>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#181c32', marginBottom: 16 }}>{t('profile.history') || 'Historial'}</h3>
      <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
        <li style={{ background: '#f3f6fa', borderRadius: 8, padding: '14px 20px', marginBottom: 10, color: '#1976d2', fontWeight: 500 }}>Certificado "Blockchain Fundamentals" emitido el 2024-01-15</li>
        <li style={{ background: '#f3f6fa', borderRadius: 8, padding: '14px 20px', marginBottom: 10, color: '#1976d2', fontWeight: 500 }}>Completado curso "Smart Contract Development"</li>
        <li style={{ background: '#f3f6fa', borderRadius: 8, padding: '14px 20px', marginBottom: 10, color: '#1976d2', fontWeight: 500 }}>Obtenida insignia "DeFi Pioneer"</li>
      </ul>
    </section>
  );
} 