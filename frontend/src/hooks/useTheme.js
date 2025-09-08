import { useState, useEffect } from 'react';
import { THEME_CONFIG, getCurrentTheme, setTheme, applyTheme } from '../config/theme';

/**
 * Hook personalizado para manejar el tema de la aplicación
 * Garantiza que el modo oscuro sea el predeterminado
 */
export const useTheme = () => {
  const [themeMode, setThemeMode] = useState(() => {
    // Siempre usar modo oscuro por defecto
    return getCurrentTheme();
  });

  useEffect(() => {
    // Aplicar tema al documento usando la configuración centralizada
    setTheme(themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setDarkTheme = () => {
    setThemeMode(THEME_CONFIG.DEFAULT_THEME);
  };

  const setLightTheme = () => {
    setThemeMode('light');
  };

  return {
    themeMode,
    setThemeMode,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light'
  };
};
