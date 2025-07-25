import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuthContext();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && !user.roles?.includes(role)) return <Navigate to="/" />;
  return children;
} 