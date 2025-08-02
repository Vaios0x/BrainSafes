import React from "react";
import { Button, useTheme, useMediaQuery, Tooltip, Fade } from "@mui/material";
import { useTranslation } from "react-i18next";
import GavelIcon from '@mui/icons-material/Gavel';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';

const iconMap = [
  <GavelIcon />, // Gobernanza
  <StorefrontIcon />, // Marketplace
  <SchoolIcon />, // Educación
  <SecurityIcon />, // Seguridad
];

const QuickLinks = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const links = [
    { label: t('dashboard.quickLinks.governance'), to: "/gobernanza", tooltip: t('Ir al panel de gobernanza.') },
    { label: t('dashboard.quickLinks.marketplace'), to: "/marketplace", tooltip: t('Ir al marketplace de NFTs.') },
    { label: t('dashboard.quickLinks.education'), to: "/educacion", tooltip: t('Ir al panel de aprendizaje.') },
    { label: t('dashboard.quickLinks.security'), to: "/seguridad", tooltip: t('Ir al panel de seguridad.') },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.7rem' : '1rem',
        width: '100%',
        marginBottom: isMobile ? '1.2rem' : 0,
      }}
    >
      {links.map((link, i) => (
        <Tooltip key={link.label} title={link.tooltip} arrow>
          <Fade in timeout={400}>
            <Button
              variant="contained"
              color="primary"
              href={link.to}
              startIcon={iconMap[i]}
              style={{
                fontSize: isMobile ? 15 : 17,
                padding: isMobile ? '10px 0' : '10px 24px',
                borderRadius: 8,
                width: isMobile ? '100%' : 'auto',
                boxShadow: theme.shadows[2],
                transition: 'box-shadow 0.3s, transform 0.2s',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
              onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
              onFocus={e => e.currentTarget.style.boxShadow = theme.shadows[6]}
              onBlur={e => e.currentTarget.style.boxShadow = theme.shadows[2]}
            >
              {link.label}
            </Button>
          </Fade>
        </Tooltip>
      ))}
    </div>
  );
};

export default QuickLinks; 