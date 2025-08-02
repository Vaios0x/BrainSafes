import React from 'react';
import { useTheme, useMediaQuery, Box, Typography, Fade } from '@mui/material';

// Hook personalizado para optimizaciones mobile
export const useMobileOptimizations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Spacing optimizations
    spacing: {
      xs: isMobile ? 1 : 2,
      sm: isMobile ? 2 : 3,
      md: isMobile ? 3 : 4,
      lg: isMobile ? 4 : 6
    },
    // Typography optimizations
    typography: {
      h1: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
      h2: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
      h3: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
      body1: { xs: '0.875rem', sm: '1rem' },
      body2: { xs: '0.8125rem', sm: '0.875rem' }
    },
    // Layout optimizations
    layout: {
      containerPadding: { xs: 2, sm: 3, md: 4 },
      cardPadding: { xs: 2, sm: 3, md: 4 },
      buttonHeight: { xs: 40, sm: 48, md: 56 },
      borderRadius: { xs: 2, sm: 3, md: 4 }
    }
  };
};

// Componente para mostrar mensajes de optimización mobile
export const MobileOptimizationMessage = ({ message, type = 'info' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) return null;

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          p: 2,
          boxShadow: theme.shadows[4],
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            color: theme.palette.text.secondary,
            fontSize: '0.875rem'
          }}
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

// Componente para optimizar imágenes en mobile
export const MobileOptimizedImage = ({ src, alt, width, height, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const getOptimizedSize = () => {
    if (isMobile) {
      return { width: width * 0.8, height: height * 0.8 };
    } else if (isTablet) {
      return { width: width * 0.9, height: height * 0.9 };
    }
    return { width, height };
  };

  const { width: optimizedWidth, height: optimizedHeight } = getOptimizedSize();

  return (
    <img
      src={src}
      alt={alt}
      width={optimizedWidth}
      height={optimizedHeight}
      style={{
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 8,
        ...props.style
      }}
      loading="lazy"
      {...props}
    />
  );
};

// Componente para optimizar botones en mobile
export const MobileOptimizedButton = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="button"
      sx={{
        minHeight: isMobile ? 44 : 48,
        minWidth: isMobile ? 44 : 48,
        fontSize: isMobile ? '0.875rem' : '1rem',
        padding: isMobile ? '8px 16px' : '10px 20px',
        borderRadius: isMobile ? 2 : 3,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[4]
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: theme.shadows[2]
        },
        ...props.sx
      }}
      className="touch-button"
      {...props}
    >
      {children}
    </Box>
  );
};

// Componente para optimizar cards en mobile
export const MobileOptimizedCard = ({ children, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: isMobile ? 2 : 3,
        padding: isMobile ? 2 : 3,
        margin: isMobile ? 1 : 2,
        boxShadow: theme.shadows[2],
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)'
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Hook para detectar orientación del dispositivo
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState('portrait');

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook para detectar si el dispositivo tiene touch
export const useTouchDevice = () => {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
};

export default {
  useMobileOptimizations,
  MobileOptimizationMessage,
  MobileOptimizedImage,
  MobileOptimizedButton,
  MobileOptimizedCard,
  useOrientation,
  useTouchDevice
}; 