import React, { useState, useEffect } from "react";
import { Card, Tooltip, useTheme, useMediaQuery, Fade } from "@mui/material";
import { useTranslation } from "react-i18next";
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const iconMap = [
  <PeopleIcon fontSize="large" color="primary" />, // Usuarios
  <SwapHorizIcon fontSize="large" color="primary" />, // Transacciones
  <LockIcon fontSize="large" color="primary" />, // Contratos activos
  <AccountBalanceWalletIcon fontSize="large" color="primary" />, // Balance
];

const MetricsSummary = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const metricsInit = [
    { label: t('dashboard.metrics.users'), value: 0, tooltip: t('dashboard.metrics.users') },
    { label: t('dashboard.metrics.transactions'), value: 0, tooltip: t('dashboard.metrics.transactions') },
    { label: t('dashboard.metrics.activeContracts'), value: 0, tooltip: t('dashboard.metrics.activeContracts') },
    { label: t('dashboard.metrics.balance'), value: 0, tooltip: t('dashboard.metrics.balance') + ' (ETH)' },
  ];
  const [metrics, setMetrics] = useState(metricsInit);
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics([
        { label: t('dashboard.metrics.users'), value: 1200 + Math.floor(Math.random() * 50), tooltip: t('dashboard.metrics.users') },
        { label: t('dashboard.metrics.transactions'), value: 50000 + Math.floor(Math.random() * 1000), tooltip: t('dashboard.metrics.transactions') },
        { label: t('dashboard.metrics.activeContracts'), value: 35 + Math.floor(Math.random() * 5), tooltip: t('dashboard.metrics.activeContracts') },
        { label: t('dashboard.metrics.balance'), value: (1000 + Math.random() * 100).toFixed(2), tooltip: t('dashboard.metrics.balance') + ' (ETH)' },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '1.5rem' : '2.5rem',
        alignItems: isMobile ? 'stretch' : 'center',
        width: '100%',
      }}
      role="region"
      aria-label={t('dashboard.main')}
    >
      {metrics.map((m, i) => (
        <Tooltip
          key={m.label}
          title={<span><b>{m.label}</b>: {m.tooltip} <br />
            {i === 0 && t('Usuarios registrados en la plataforma.')} 
            {i === 1 && t('Total de transacciones procesadas.')} 
            {i === 2 && t('Contratos inteligentes activos actualmente.')} 
            {i === 3 && t('Balance total en la plataforma (ETH).')}
          </span>}
          arrow
        >
          <Card
            tabIndex={0}
            role="status"
            aria-label={`${m.label}: ${m.value}`}
            style={{
              padding: isMobile ? '1.2rem 1rem' : '1.5rem 2rem',
              minWidth: isMobile ? 120 : 170,
              textAlign: "center",
              transition: 'box-shadow 0.3s, transform 0.2s',
              boxShadow: hovered === i ? theme.shadows[6] : theme.shadows[2],
              background: theme.palette.background.paper,
              outline: 'none',
              border: `2px solid ${theme.palette.primary.main}`,
              color: theme.palette.text.primary,
              cursor: 'pointer',
              borderRadius: 8,
              marginBottom: 0,
              fontSize: isMobile ? 15 : 18,
              flex: 1,
              maxWidth: isMobile ? '100%' : 220,
              transform: hovered === i ? 'scale(1.04)' : 'scale(1)',
            }}
            onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.palette.primary.main}`}
            onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(-1)}
          >
            <Fade in timeout={400}>{iconMap[i]}</Fade>
            <h3 style={{ margin: 0, color: theme.palette.primary.main, fontSize: isMobile ? 16 : 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {m.label}
            </h3>
            <Fade in timeout={400}>
              <p style={{ fontSize: isMobile ? 22 : 32, fontWeight: "bold", margin: 0, transition: 'color 0.3s' }}>{m.value}</p>
            </Fade>
          </Card>
        </Tooltip>
      ))}
    </div>
  );
};

export default MetricsSummary; 