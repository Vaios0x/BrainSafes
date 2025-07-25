import { useEffect, useState } from "react";
import { getUser } from "../utils/api";

export function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const data = await getUser(userId);
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err);
        setUser(null);
      }
      setLoading(false);
    }
    if (userId) {
      fetchUser();
    } else {
      // MOCK para desarrollo sin backend ni userId
      setUser({
        id: 'mock',
        name: 'Usuario Demo',
        badges: [
          { id: 1, name: 'Smart Contract Expert', icon: '🏅', desc: 'Dominio en contratos inteligentes', issued: '2024-01-10', issuer: '0x123...abc' },
          { id: 2, name: 'DeFi Pioneer', icon: '💸', desc: 'Participación en DeFi', issued: '2024-02-15', issuer: '0x456...def' }
        ],
        certificates: [
          { id: 1, name: 'Certificado Blockchain', issued: '2024-01-10', issuer: 'Academia Blockchain' },
          { id: 2, name: 'Certificado Seguridad', issued: '2024-02-15', issuer: 'Academia Seguridad' }
        ],
        courses: [
          { id: 1, name: 'Curso Blockchain', completed: true },
          { id: 2, name: 'Curso Seguridad', completed: false }
        ]
      });
      setLoading(false);
    }
  }, [userId]);

  return { user, loading, error };
} 