import React from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../assets/Hero.svg?react';
import { useTheme } from '@mui/material';

const benefits = [
  {
    icon: '🔒',
    iconLabel: 'Seguro',
    title: 'landing.benefit1',
    desc: 'landing.benefit1desc',
  },
  {
    icon: '⚡',
    iconLabel: 'Rápido',
    title: 'landing.benefit2',
    desc: 'landing.benefit2desc',
  },
  {
    icon: '🌐',
    iconLabel: 'Global',
    title: 'landing.benefit3',
    desc: 'landing.benefit3desc',
  },
];

export default function Landing() {
  const { t } = useTranslation();
  const theme = useTheme();
  // Animación de entrada simple
  React.useEffect(() => {
    document.querySelectorAll('.fade-in').forEach((el, i) => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(40px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }, 200 + i * 150);
    });
  }, []);
  return (
    <main role="main" aria-label="Página principal" style={{ minHeight: 'calc(100vh - 80px)', background: theme.palette.background.paper }}>
      <section role="region" aria-label="Hero principal" style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 48, padding: '64px 16px 32px 16px', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap'
      }}>
        <div className="fade-in" style={{ flex: 1, minWidth: 320 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 16, color: theme.palette.primary.main, letterSpacing: -1 }}>{t('landing.title')}</h1>
          <p style={{ fontSize: 20, color: theme.palette.text.primary, marginBottom: 32 }}>{t('landing.subtitle')}</p>
          <a
            href="#benefits"
            role="button"
            tabIndex={0}
            aria-label="Ver beneficios principales"
            className="cta-btn fade-in"
            style={{
              display: 'inline-block', background: theme.palette.primary.main, color: theme.palette.background.paper, fontWeight: 700, fontSize: 18,
              padding: '14px 36px', borderRadius: 8, boxShadow: theme.shadows[2], textDecoration: 'none',
              transition: 'background 0.2s', marginBottom: 24, outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {t('landing.cta')}
          </a>
        </div>
        <div className="fade-in" style={{ flex: 1, minWidth: 220, display: 'flex', justifyContent: 'center' }}>
          <Hero width={220} height={160} />
        </div>
      </section>
      <section id="benefits" role="region" aria-label="Beneficios principales" style={{
        background: theme.palette.background.default, padding: '48px 0', marginTop: 24
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="benefit-card fade-in"
              role="article"
              aria-label={t(b.title)}
              tabIndex={0}
              style={{
                background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #1976d220', padding: 32, minWidth: 260, maxWidth: 320,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1,
                outline: 'none',
              }}
            >
              <span role="img" aria-label={b.iconLabel} style={{ fontSize: 40 }}>{b.icon}</span>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1976d2', margin: 0 }}>{t(b.title)}</h3>
              <p style={{ color: '#181c32', fontSize: 16, textAlign: 'center', margin: 0 }}>{t(b.desc)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
} 