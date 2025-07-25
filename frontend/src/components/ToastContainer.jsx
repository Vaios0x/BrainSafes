import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            style={{
              minWidth: 220,
              maxWidth: 320,
              padding: '14px 24px',
              borderRadius: 8,
              background: toast.type === 'error' ? '#d32f2f' : toast.type === 'success' ? '#43a047' : '#1976d2',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 4px 16px #0002',
              opacity: 1,
              transform: 'translateY(0)',
              animation: 'toast-in 0.4s cubic-bezier(.4,0,.2,1)',
            }}
          >
            {toast.message}
          </div>
        ))}
        <style>{`
          @keyframes toast-in {
            0% { opacity: 0; transform: translateY(-30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
} 