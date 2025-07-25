import Spinner from './Spinner';
import Skeleton from './Skeleton';
import Breadcrumbs from './Breadcrumbs';
import { useToast } from './ToastContainer';
import React, { useEffect } from 'react';
import CourseList from './CourseList';
import { useUser } from '../hooks/useUser';

export default function Courses() {
  const { user, loading, error } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Breadcrumbs items={[
        { to: '/', label: 'Inicio' },
        { label: 'Cursos' }
      ]} />
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Cursos</h2>
      {loading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton width={120} height={120} />
          <Skeleton width={120} height={120} />
        </div>
      ) : user && user.courses ? (
        <CourseList courses={user.courses} />
      ) : (
        <div>No se encontraron cursos.</div>
      )}
    </main>
  );
} 