import { createTheme } from '@mui/material/styles';

const common = {
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    fontWeightBold: 700,
    fontWeightRegular: 400,
    h1: { 
      fontWeight: 700,
      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
      lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 }
    },
    h2: { 
      fontWeight: 700,
      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
    },
    h3: { 
      fontWeight: 700,
      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
    },
    h4: { 
      fontWeight: 700,
      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
    },
    h5: { 
      fontWeight: 700,
      fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
    },
    h6: { 
      fontWeight: 700,
      fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
    },
    body1: {
      fontSize: { xs: '0.875rem', sm: '1rem' },
      lineHeight: { xs: 1.5, sm: 1.6 }
    },
    body2: {
      fontSize: { xs: '0.8125rem', sm: '0.875rem' }
    }
  },
  shape: {
    borderRadius: 8,
  },
  spacing: (factor) => `${8 * factor}px`,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: { xs: 6, sm: 8 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          padding: { xs: '8px 16px', sm: '10px 20px' },
          minHeight: { xs: 36, sm: 40 }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: { xs: 8, sm: 12 },
          boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.1)', sm: '0 4px 12px rgba(0,0,0,0.15)' }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: { xs: 16, sm: 24 },
          paddingRight: { xs: 16, sm: 24 }
        }
      }
    }
  }
};

export const lightTheme = createTheme({
  ...common,
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#ff9800' },
    background: { default: '#f5f6fa', paper: '#fff' },
    success: { main: '#43a047' },
    error: { main: '#d32f2f' },
    info: { main: '#1976d2' },
    warning: { main: '#fbc02d' },
    text: { primary: '#181c32', secondary: '#555' },
  },
});

export const darkTheme = createTheme({
  ...common,
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#ffb74d' },
    background: { default: '#181c32', paper: '#232946' },
    success: { main: '#43a047' },
    error: { main: '#ef5350' },
    info: { main: '#90caf9' },
    warning: { main: '#ffd600' },
    text: { primary: '#fff', secondary: '#bdbdbd' },
  },
}); 