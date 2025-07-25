import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect, useState } from 'react';

export default function BadgeGallery() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setBadges([
        { id: 1, name: 'Insignia Blockchain' },
        { id: 2, name: 'Insignia Seguridad' }
      ]);
      setLoading(false);
      showToast('Insignias cargadas', 'success');
    }, 1200);
  }, [showToast]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Insignias' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Insignias</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <Skeleton width={120} height={120} />
          <Skeleton width={120} height={120} />
        </div>
      ) : (
        <ul style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
          {badges.map(b => (
            <li key={b.id} style={{ minWidth: 120, minHeight: 120, background: '#f3f3f3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 }}>{b.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
} 