import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect, useState } from 'react';

export default function LoanManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setLoans([
        { id: 1, name: 'Préstamo Blockchain' },
        { id: 2, name: 'Préstamo Seguridad' }
      ]);
      setLoading(false);
      showToast('Préstamos cargados', 'success');
    }, 1600);
  }, [showToast]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Préstamos' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Préstamos</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 24 }}>
          <Skeleton width={180} height={60} />
          <Skeleton width={180} height={60} />
        </div>
      ) : (
        <ul style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
          {loans.map(l => (
            <li key={l.id} style={{ minWidth: 180, minHeight: 60, background: '#f3f3f3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 }}>{l.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
} 