import React from 'react';

export default function Spinner({ size = 40, color = '#1976d2', ariaLabel = 'Cargando...' }) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      style={{ display: 'inline-block', width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray="90 150"
          strokeLinecap="round"
          style={{
            transformOrigin: 'center',
            animation: 'spin 1s linear infinite',
          }}
        />
      </svg>
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
} 