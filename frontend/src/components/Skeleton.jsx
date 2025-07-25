import React from 'react';

export default function Skeleton({ width = '100%', height = 24, borderRadius = 6, style = {} }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.2s infinite linear',
        ...style,
      }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </span>
  );
} 