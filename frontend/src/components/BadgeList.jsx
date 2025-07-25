import React from 'react';
import BadgeCard from './BadgeCard';

export default function BadgeList({ badges }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {badges.map(badge => (
        <BadgeCard key={badge.tokenId} badge={badge} />
      ))}
    </div>
  );
} 