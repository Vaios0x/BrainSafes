import React from 'react';

export default function MentorRegisterForm({ loading, registerMentor, message }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Registro de Mentor</h3>
      <button onClick={registerMentor} disabled={loading} style={{ marginBottom: 16, padding: '8px 20px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Registrarse como mentor</button>
      {message && <div style={{ marginTop: 16, color: '#388e3c', fontWeight: 600 }}>{message}</div>}
    </div>
  );
} 