import React from 'react';

export default function MentorshipRequestForm({ mentor, setMentor, loading, requestMentorship }) {
  return (
    <div>
      <h3>Solicitar Mentoría</h3>
      <input value={mentor} onChange={e => setMentor(e.target.value)} placeholder="Dirección del mentor" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', marginRight: 8 }} />
      <button onClick={requestMentorship} disabled={loading || !mentor} style={{ padding: '8px 20px', borderRadius: 8, background: '#43a047', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Solicitar</button>
    </div>
  );
} 