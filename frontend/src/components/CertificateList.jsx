import React from 'react';
import CertificateCard from './CertificateCard';

export default function CertificateList({ certificates }) {
  return (
    <section style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {certificates.map(cert => (
        <CertificateCard key={cert.id} cert={cert} />
      ))}
    </section>
  );
} 