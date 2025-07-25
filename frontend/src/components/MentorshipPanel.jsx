import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect, useState } from 'react';

export default function MentorshipPanel() {
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setMentors([
        { id: 1, name: 'Mentor Blockchain' },
        { id: 2, name: 'Mentor Seguridad' }
      ]);
      setLoading(false);
      showToast('Mentores cargados', 'info');
    }, 1500);
  }, [showToast]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Mentoría' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Mentoría</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <Skeleton width={180} height={60} />
          <Skeleton width={180} height={60} />
        </div>
      ) : (
        <ul style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
          {mentors.map(m => (
            <li key={m.id} style={{ minWidth: 180, minHeight: 60, background: '#f3f3f3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 }}>{m.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
} 