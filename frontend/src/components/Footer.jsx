import React from 'react';
import { Box, Typography, Container, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f8f9fa',
        color: theme.palette.text.secondary,
        borderTop: `1px solid ${theme.palette.divider}`,
        py: isMobile ? 3 : 4,
        mt: 'auto',
        position: 'relative',
        bottom: 0,
        width: '100%'
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: isMobile ? 2 : 0
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              textAlign: isMobile ? 'center' : 'left',
              opacity: 0.8
            }}
          >
            © 2025 BrainSafes. {t('footer.rights') || 'Todos los derechos reservados.'}
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: isMobile ? 2 : 3,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                opacity: 0.7,
                textAlign: 'center'
              }}
            >
              {t('footer.version') || 'Versión 1.0.0'}
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                opacity: 0.7,
                textAlign: 'center'
              }}
            >
              {t('footer.built') || 'Construido con React & Material-UI'}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 