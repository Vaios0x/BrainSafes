import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect } from 'react';
import { useUser } from '../hooks/useUser';

export default function Dashboard() {
  const { user, loading, error } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { to: '/', label: 'Inicio' },
        { label: 'Panel' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Panel de Usuario</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton width={120} height={24} />
          <Skeleton width={120} height={24} />
        </div>
      ) : user ? (
        <div style={{ background: '#f3f3f3', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{user.name}</div>
          <div style={{ color: '#1976d2', marginBottom: 16 }}>ID: {user.id}</div>
          <div style={{ marginBottom: 12 }}><b>Insignias:</b> {user.badges && user.badges.length > 0 ? user.badges.map(b => b.name).join(', ') : 'Sin insignias'}</div>
          <div style={{ marginBottom: 12 }}><b>Certificados:</b> {user.certificates && user.certificates.length > 0 ? user.certificates.map(c => c.name).join(', ') : 'Sin certificados'}</div>
          <div><b>Cursos:</b> {user.courses && user.courses.length > 0 ? user.courses.map(c => c.name).join(', ') : 'Sin cursos'}</div>
        </div>
      ) : (
        <div>No se encontró información de usuario.</div>
      )}
    </main>
  );
} 