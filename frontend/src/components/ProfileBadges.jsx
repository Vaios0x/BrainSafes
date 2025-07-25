import React, { useState } from 'react';
import { Fade, Tooltip, useTheme, useMediaQuery, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function ProfileBadges({ badges, t }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hovered, setHovered] = useState(-1);
  return (
    <section style={{ marginBottom: isMobile ? 18 : 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 10 : 16 }}>
        <h3 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>{t('profile.badges') || 'Insignias'}</h3>
        <Tooltip title={t('Insignias obtenidas por logros, participación y reputación.')} arrow>
          <IconButton size="small" color="primary" tabIndex={0} aria-label={t('Ayuda sobre insignias')}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 10 : 16, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        {badges.length === 0 ? (
          <div style={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>{t('profile.noBadges') || 'Sin insignias aún.'}</div>
        ) : (
          badges.map((b, i) => (
            <Fade in key={b.name} timeout={500}>
              <Tooltip title={<span><b>{b.name}</b>: {b.desc}</span>} arrow>
                <div
                  style={{
                    background: theme.palette.background.paper,
                    borderRadius: 10,
                    boxShadow: hovered === i ? theme.shadows[6] : theme.shadows[2],
                    padding: isMobile ? 12 : 20,
                    minWidth: isMobile ? 110 : 160,
                    textAlign: 'center',
                    transition: 'box-shadow 0.3s, transform 0.2s',
                    transform: hovered === i ? 'scale(1.04)' : 'scale(1)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(-1)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(-1)}
                  aria-label={b.name}
                >
                  <div style={{ fontSize: isMobile ? 22 : 32 }}>{b.icon}</div>
                  <div style={{ fontWeight: 700, color: theme.palette.primary.main, marginTop: 8, fontSize: isMobile ? 14 : 17 }}>{b.name}</div>
                  <div style={{ color: theme.palette.text.secondary, fontSize: isMobile ? 11 : 14, marginTop: 4 }}>{b.desc}</div>
                </div>
              </Tooltip>
            </Fade>
          ))
        )}
      </div>
    </section>
  );
} 