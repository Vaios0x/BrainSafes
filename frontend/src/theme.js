import { createTheme } from '@mui/material/styles';

const common = {
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    fontWeightBold: 700,
    fontWeightRegular: 400,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
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