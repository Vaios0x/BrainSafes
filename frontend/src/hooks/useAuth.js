import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000/api/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWallet = useCallback(async (address, signature, message) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/login-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  return { user, token, loading, error, login, register, loginWallet, logout };
} 