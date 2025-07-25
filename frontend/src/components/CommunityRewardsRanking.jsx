import React, { useState } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import Tooltip from '@mui/material/Tooltip';

export default function CommunityRewardsRanking({ rewards }) {
  const [hovered, setHovered] = useState(-1);
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return (
      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16 }}>
        <h4>Ranking de Recompensas</h4>
        <div style={{ color: '#888', fontStyle: 'italic' }}>No hay recompensas registradas.</div>
      </div>
    );
  }
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16 }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><StarIcon color="warning" fontSize="medium" /> Ranking de Recompensas</h4>
      <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }} role="list" aria-label="Ranking de recompensas">
        {rewards.map((r, i) => (
          <li
            key={r.user || r.id || i}
            style={{
              fontWeight: 600,
              color: '#1976d2',
              background: hovered === i ? '#e3f2fd' : 'transparent',
              borderRadius: 8,
              marginBottom: 4,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: hovered === i ? '0 2px 8px #1976d220' : 'none',
              outline: hovered === i ? '2px solid #1976d2' : 'none',
              transition: 'box-shadow 0.2s, outline 0.2s, background 0.2s',
              cursor: 'pointer',
            }}
            tabIndex={0}
            aria-label={`Posición ${i + 1}: ${r.user || r.name}, ${r.points ?? r.value ?? 0} puntos`}
            role="listitem"
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(-1)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(-1)}
          >
            <Tooltip title={`Posición ${i + 1}`} arrow enterDelay={300} leaveDelay={100} describeChild>
              <span><EmojiEventsIcon color={i === 0 ? 'warning' : 'disabled'} fontSize="small" /></span>
            </Tooltip>
            <Tooltip title={r.user ? `Usuario: ${r.user}` : 'Sin usuario'} arrow enterDelay={300} leaveDelay={100} describeChild>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PersonIcon fontSize="small" /> {r.user || r.name}
              </span>
            </Tooltip>
            <Tooltip title={`Puntos: ${r.points ?? r.value ?? 0}`} arrow enterDelay={300} leaveDelay={100} describeChild>
              <span style={{ color: '#43a047', fontWeight: 700 }}>{r.points ?? r.value ?? 0} pts</span>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
} 