/**
 * Configuración del tema para BrainSafes
 * Garantiza que el modo oscuro sea el predeterminado
 */

export const THEME_CONFIG = {
  // Tema predeterminado
  DEFAULT_THEME: 'dark',
  
  // Claves de localStorage
  STORAGE_KEY: 'themeMode',
  
  // Clases CSS
  DARK_CLASS: 'dark',
  LIGHT_CLASS: 'light',
  
  // Configuración de colores
  COLORS: {
    dark: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    light: {
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#0891b2',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    }
  },
  
  // Configuración de transiciones
  TRANSITIONS: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Configuración de glassmorphism
  GLASS: {
    dark: {
      background: 'rgba(17, 24, 39, 0.4)',
      border: 'rgba(75, 85, 99, 0.3)',
      backdrop: 'blur(20px)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(229, 231, 235, 0.3)',
      backdrop: 'blur(20px)',
    }
  }
};

/**
 * Función para obtener el tema actual
 */
export const getCurrentTheme = () => {
  return localStorage.getItem(THEME_CONFIG.STORAGE_KEY) || THEME_CONFIG.DEFAULT_THEME;
};

/**
 * Función para establecer el tema
 */
export const setTheme = (theme) => {
  localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
  applyTheme(theme);
};

/**
 * Función para aplicar el tema al documento
 */
export const applyTheme = (theme) => {
  const html = document.documentElement;
  
  // Remover clases existentes
  html.classList.remove(THEME_CONFIG.DARK_CLASS, THEME_CONFIG.LIGHT_CLASS);
  
  // Aplicar nueva clase
  html.classList.add(theme === 'dark' ? THEME_CONFIG.DARK_CLASS : THEME_CONFIG.LIGHT_CLASS);
  
  // Aplicar color-scheme
  html.style.colorScheme = theme;
  
  // Aplicar meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = THEME_CONFIG.COLORS[theme].primary;
  }
};

/**
 * Función para inicializar el tema
 */
export const initializeTheme = () => {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
};

/**
 * Función para alternar el tema
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
};
