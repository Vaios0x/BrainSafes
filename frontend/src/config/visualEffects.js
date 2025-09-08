// Configuración de efectos visuales para BrainSafes

export const NEURAL_NETWORK_CONFIG = {
  // Configuración de la red neuronal
  nodes: {
    count: 80,
    minSize: 2,
    maxSize: 6,
    minOpacity: 0.2,
    maxOpacity: 0.8,
    minSpeed: 0.1,
    maxSpeed: 0.5,
    colors: {
      primary: 200,
      secondary: 240,
      accent: 280
    }
  },
  
  connections: {
    maxDistance: 200,
    minDistance: 50,
    maxOpacity: 0.4,
    minWidth: 1,
    maxWidth: 3,
    updateFrequency: 60 // frames
  },
  
  animation: {
    speed: 0.01,
    pulseSpeed: 0.02,
    rotationSpeed: 0.005
  }
};

export const PARTICLE_CONFIG = {
  // Configuración de partículas
  count: 150,
  size: {
    min: 1,
    max: 4
  },
  speed: {
    min: 0.2,
    max: 1.0
  },
  opacity: {
    min: 0.3,
    max: 1.0
  },
  colors: {
    primary: 200,
    secondary: 240,
    accent: 280
  },
  animation: {
    duration: {
      min: 12,
      max: 18
    },
    amplitude: {
      min: 10,
      max: 40
    },
    frequency: {
      min: 0.01,
      max: 0.03
    }
  }
};

export const WAVE_CONFIG = {
  // Configuración de ondas de energía
  count: 5,
  amplitude: {
    min: 50,
    max: 150
  },
  frequency: {
    min: 0.01,
    max: 0.03
  },
  speed: {
    min: 0.01,
    max: 0.03
  },
  opacity: {
    min: 0.1,
    max: 0.4
  },
  colors: {
    primary: 200,
    secondary: 240,
    accent: 280
  }
};

export const FORCE_FIELD_CONFIG = {
  // Configuración del campo de fuerza
  points: {
    count: 20,
    strength: {
      min: 25,
      max: 75
    }
  },
  field: {
    resolution: 20,
    lineLength: 15,
    maxOpacity: 0.3
  },
  colors: {
    primary: 200,
    secondary: 240,
    accent: 280
  }
};

export const GLASSMORPHISM_CONFIG = {
  // Configuración de glassmorphism
  intensities: {
    low: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.1)",
      shadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
      blur: "blur(8px)"
    },
    medium: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      blur: "blur(12px)"
    },
    high: {
      background: "rgba(255, 255, 255, 0.15)",
      border: "rgba(255, 255, 255, 0.3)",
      shadow: "0 12px 48px rgba(0, 0, 0, 0.2)",
      blur: "blur(16px)"
    }
  },
  
  variants: {
    default: "bg-white/10 dark:bg-gray-800/10",
    primary: "bg-primary-500/10 dark:bg-primary-500/5",
    secondary: "bg-brain-500/10 dark:bg-brain-500/5",
    accent: "bg-purple-500/10 dark:bg-purple-500/5"
  },
  
  animations: {
    hover: {
      scale: 1.02,
      y: -5,
      duration: 0.3
    },
    border: {
      duration: 3,
      ease: "linear"
    },
    glow: {
      duration: 0.5
    }
  }
};

export const CURSOR_CONFIG = {
  // Configuración del cursor personalizado
  main: {
    size: 20,
    color: "linear-gradient(45deg, #3b82f6, #0ea5e9)",
    blendMode: "difference",
    transition: "transform 0.1s ease"
  },
  
  trail: {
    size: 40,
    color: "linear-gradient(45deg, #3b82f6, #0ea5e9)",
    opacity: 0.3,
    transition: "transform 0.2s ease"
  },
  
  hover: {
    scale: 1.5,
    clickScale: 0.8
  }
};

export const SCROLL_CONFIG = {
  // Configuración del indicador de scroll
  height: 4,
  colors: "linear-gradient(90deg, #3b82f6, #0ea5e9, #8b5cf6)",
  opacity: {
    min: 0,
    max: 1,
    fadeIn: [0, 0.1],
    fadeOut: [0.9, 1]
  }
};

export const ANIMATION_CONFIG = {
  // Configuración general de animaciones
  durations: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    verySlow: 0.8
  },
  
  easings: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    spring: "spring"
  },
  
  spring: {
    stiffness: 100,
    damping: 20,
    mass: 1
  }
};

export const PERFORMANCE_CONFIG = {
  // Configuración de rendimiento
  throttling: {
    mouseMove: 16, // ~60fps
    scroll: 16,
    resize: 100
  },
  
  debouncing: {
    search: 300,
    resize: 250,
    scroll: 100
  },
  
  limits: {
    maxParticles: 200,
    maxNodes: 100,
    maxConnections: 500
  },
  
  cleanup: {
    interval: 30000, // 30 seconds
    maxMemoryUsage: 100 * 1024 * 1024 // 100MB
  }
};

export const RESPONSIVE_CONFIG = {
  // Configuración responsive
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  },
  
  effects: {
    mobile: {
      particles: 50,
      nodes: 30,
      waves: 3,
      forceField: false
    },
    tablet: {
      particles: 100,
      nodes: 50,
      waves: 4,
      forceField: false
    },
    desktop: {
      particles: 150,
      nodes: 80,
      waves: 5,
      forceField: true
    }
  }
};

export const THEME_CONFIG = {
  // Configuración de temas
  light: {
    primary: "#3b82f6",
    secondary: "#0ea5e9",
    accent: "#8b5cf6",
    background: "linear-gradient(135deg, #f8fafc, #e2e8f0, #cbd5e1)",
    text: "#1e293b",
    glass: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)"
    }
  },
  
  dark: {
    primary: "#60a5fa",
    secondary: "#38bdf8",
    accent: "#a78bfa",
    background: "linear-gradient(135deg, #0f172a, #1e293b, #334155)",
    text: "#f1f5f9",
    glass: {
      background: "rgba(0, 0, 0, 0.1)",
      border: "rgba(255, 255, 255, 0.1)"
    }
  }
};

// Función para obtener configuración basada en el dispositivo
export const getDeviceConfig = () => {
  const width = window.innerWidth;
  
  if (width < RESPONSIVE_CONFIG.breakpoints.mobile) {
    return RESPONSIVE_CONFIG.effects.mobile;
  } else if (width < RESPONSIVE_CONFIG.breakpoints.tablet) {
    return RESPONSIVE_CONFIG.effects.tablet;
  } else {
    return RESPONSIVE_CONFIG.effects.desktop;
  }
};

// Función para obtener configuración de tema
export const getThemeConfig = (isDark = false) => {
  return isDark ? THEME_CONFIG.dark : THEME_CONFIG.light;
};

// Función para optimizar configuración basada en rendimiento
export const optimizeConfig = (config, performanceLevel = 'high') => {
  const optimizations = {
    low: {
      particles: Math.floor(config.particles * 0.5),
      nodes: Math.floor(config.nodes * 0.5),
      waves: Math.floor(config.waves * 0.5),
      forceField: false
    },
    medium: {
      particles: Math.floor(config.particles * 0.75),
      nodes: Math.floor(config.nodes * 0.75),
      waves: Math.floor(config.waves * 0.75),
      forceField: false
    },
    high: {
      ...config
    }
  };
  
  return optimizations[performanceLevel] || optimizations.high;
};

export default {
  NEURAL_NETWORK_CONFIG,
  PARTICLE_CONFIG,
  WAVE_CONFIG,
  FORCE_FIELD_CONFIG,
  GLASSMORPHISM_CONFIG,
  CURSOR_CONFIG,
  SCROLL_CONFIG,
  ANIMATION_CONFIG,
  PERFORMANCE_CONFIG,
  RESPONSIVE_CONFIG,
  THEME_CONFIG,
  getDeviceConfig,
  getThemeConfig,
  optimizeConfig
};
