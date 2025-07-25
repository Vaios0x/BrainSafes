import React, { useState, useEffect } from "react";
import { Alert, Slide, useTheme, useMediaQuery, Tooltip, IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

const initialAlerts = [
  { severity: "error", message: "Fallo de seguridad detectado en contrato X.", usuario: "0x123" },
  { severity: "warning", message: "Alto volumen de transacciones detectado.", usuario: "0x456" },
  { severity: "info", message: "Nueva propuesta de gobernanza disponible.", usuario: "0x789" },
];

const iconMap = {
  error: <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />,
  warning: <WarningAmberOutlinedIcon color="warning" sx={{ mr: 1 }} />,
  info: <InfoOutlinedIcon color="info" sx={{ mr: 1 }} />,
};

const AlertsPanel = ({ filtros }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState(initialAlerts);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setAlerts((prev) => [
          ...prev,
          { severity: "info", message: "Evento aleatorio: " + new Date().toLocaleTimeString(), usuario: "0x123" },
        ]);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  let filteredAlerts = alerts;
  if (filtros.tipoEvento !== "all") {
    filteredAlerts = filteredAlerts.filter((a) => a.severity === filtros.tipoEvento);
  }
  if (filtros.usuario !== "all") {
    filteredAlerts = filteredAlerts.filter((a) => a.usuario === filtros.usuario);
  }

  return (
    <div
      style={{
        marginBottom: isMobile ? '1.2rem' : '2rem',
        width: '100%',
      }}
      role="region"
      aria-label={t('dashboard.alerts.title')}
    >
      <Tooltip title={t('Panel de alertas y notificaciones de seguridad, red y gobernanza.')} arrow>
        <h4 style={{ color: theme.palette.text.primary, fontSize: isMobile ? 16 : 20, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <InfoOutlinedIcon color="info" /> {t('dashboard.alerts.title')}
        </h4>
      </Tooltip>
      {filteredAlerts.slice(-3).map((alert, idx) => (
        <Slide key={idx} direction="down" in mountOnEnter unmountOnExit appear timeout={400}>
          <Tooltip title={alert.severity === 'error' ? t('Error crítico de seguridad.') : alert.severity === 'warning' ? t('Advertencia importante.') : t('Información general.')} arrow>
            <Alert
              severity={alert.severity}
              style={{
                marginBottom: isMobile ? '0.5rem' : '0.7rem',
                borderRadius: 8,
                fontWeight: 'bold',
                outline: 'none',
                background: theme.palette.background.paper,
                fontSize: isMobile ? 14 : 16,
                boxShadow: hovered === idx ? theme.shadows[6] : theme.shadows[2],
                transform: hovered === idx ? 'scale(1.03)' : 'scale(1)',
                transition: 'box-shadow 0.3s, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
              }}
              tabIndex={0}
              role="alert"
              aria-label={`Alerta de tipo ${alert.severity}: ${alert.message}`}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(-1)}
              icon={iconMap[alert.severity]}
            >
              {iconMap[alert.severity]} {alert.message}
            </Alert>
          </Tooltip>
        </Slide>
      ))}
    </div>
  );
};

export default AlertsPanel; 