import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ margin: '16px 0' }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, idx) => (
          <li key={item.to || idx} style={{ display: 'flex', alignItems: 'center', color: idx === items.length - 1 ? '#1976d2' : '#181c32', fontWeight: idx === items.length - 1 ? 700 : 500 }}>
            {item.to ? (
              <Link to={item.to} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
            {idx < items.length - 1 && <span style={{ margin: '0 8px', color: '#bdbdbd' }}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
} 