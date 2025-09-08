import React, { createContext, useContext, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeContext = createContext();

/**
 * Provider de contexto para el tema de la aplicación
 * Garantiza que el modo oscuro sea el predeterminado
 */
export const ThemeProvider = ({ children }) => {
  const theme = useTheme();

  // Asegurar que el tema se aplique inmediatamente
  useEffect(() => {
    // Forzar modo oscuro si no hay preferencia guardada
    if (!localStorage.getItem('themeMode')) {
      theme.setDarkTheme();
    }
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para usar el contexto del tema
 */
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext debe ser usado dentro de ThemeProvider');
  }
  return context;
};
