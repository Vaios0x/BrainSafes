// Configuración avanzada del chatbot BrainSafes
export const chatbotConfig = {
  // Configuración de efectos visuales
  visual: {
    // Glassmorphism
    glassmorphism: {
      intensity: 'high', // 'low', 'medium', 'high'
      variant: 'primary', // 'default', 'primary', 'secondary', 'accent'
      blur: 20, // px
      opacity: 0.1, // 0-1
      borderWidth: 1, // px
      borderRadius: 24 // px
    },
    
    // Efectos neurales
    neural: {
      showNetwork: true,
      showParticles: true,
      showWaves: true,
      showForceField: false,
      particleCount: 50,
      nodeCount: 15,
      waveCount: 3,
      opacity: 0.3
    },
    
    // Animaciones
    animations: {
      duration: 0.8, // segundos
      easing: 'spring', // 'spring', 'ease', 'linear'
      stiffness: 100,
      damping: 20,
      mass: 1
    }
  },

  // Configuración de sonidos
  audio: {
    enabled: true,
    volume: 0.3, // 0-1
    sounds: {
      messageSent: { frequency: 800, duration: 0.1, type: 'sine' },
      messageReceived: { frequency: 600, duration: 0.15, type: 'triangle' },
      typing: { frequency: 400, duration: 0.05, type: 'square' },
      notification: { frequencies: [1000, 1200], duration: 0.1, type: 'sine' },
      error: { frequency: 200, duration: 0.3, type: 'sawtooth' },
      success: { frequencies: [523, 659, 784], duration: 0.1, type: 'sine' }
    }
  },

  // Configuración de vibración
  vibration: {
    enabled: true,
    patterns: {
      messageSent: [50],
      messageReceived: [100, 50, 100],
      typing: [30],
      notification: [200, 100, 200],
      error: [100, 50, 100, 50, 100],
      success: [50, 50, 50]
    }
  },

  // Configuración de IA
  ai: {
    responseDelay: {
      min: 1000, // ms
      max: 3000 // ms
    },
    suggestions: [
      '¿Cómo funciona la seguridad en blockchain?',
      'Explícame los contratos inteligentes',
      '¿Qué es Web3?',
      'Ayúdame con DeFi',
      'Análisis de mercado crypto',
      '¿Cómo optimizar gas fees?',
      'Explicación de NFTs',
      'Gobernanza descentralizada'
    ],
    predictions: [
      'Posible congestión de red detectada para mañana',
      'Se recomienda optimizar el contrato BrainSafes.sol',
      'Nuevas oportunidades de yield farming disponibles',
      'Análisis de riesgo: Mercado estable',
      'Recomendación: Diversificar portfolio'
    ]
  },

  // Configuración de interfaz
  ui: {
    // Tamaños
    sizes: {
      widget: {
        width: 384, // px (w-96)
        height: 600, // px
        maxWidth: 'calc(100vw - 2rem)'
      },
      button: {
        size: 64, // px (w-16 h-16)
        borderRadius: 50 // %
      }
    },
    
    // Posicionamiento
    position: {
      bottom: 32, // px (bottom-8)
      right: 32, // px (right-8)
      zIndex: 50
    },
    
    // Colores
    colors: {
      primary: '#3b82f6', // primary-500
      secondary: '#0ea5e9', // brain-500
      accent: '#8b5cf6', // purple-500
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db', // gray-300
        muted: '#9ca3af' // gray-400
      }
    },
    
    // Tipografía
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem'
      },
      weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    }
  },

  // Configuración de rendimiento
  performance: {
    // Optimizaciones
    optimizations: {
      lazyLoading: true,
      debounceInput: 300, // ms
      animationFrame: true,
      memoryCleanup: true
    },
    
    // Límites
    limits: {
      maxMessages: 100,
      maxParticles: 200,
      maxNodes: 20,
      maxWaves: 5
    },
    
    // FPS
    fps: {
      target: 60,
      adaptive: true,
      fallback: 30
    }
  },

  // Configuración de accesibilidad
  accessibility: {
    // ARIA
    aria: {
      labels: {
        openChat: 'Abrir chat IA',
        closeChat: 'Cerrar chat IA',
        sendMessage: 'Enviar mensaje',
        input: 'Escribir mensaje'
      }
    },
    
    // Navegación por teclado
    keyboard: {
      openChat: 'Enter',
      closeChat: 'Escape',
      sendMessage: 'Enter',
      focusInput: 'Tab'
    },
    
    // Contraste
    contrast: {
      minimum: 4.5, // WCAG AA
      enhanced: 7.0 // WCAG AAA
    }
  },

  // Configuración de temas
  themes: {
    light: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(0, 0, 0, 0.1)',
      text: {
        primary: '#1f2937',
        secondary: '#4b5563',
        muted: '#6b7280'
      }
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
        muted: '#9ca3af'
      }
    }
  },

  // Configuración de desarrollo
  development: {
    debug: false,
    showFPS: false,
    showPerformance: false,
    logLevel: 'warn' // 'debug', 'info', 'warn', 'error'
  }
};

// Configuraciones predefinidas
export const presets = {
  // Preset minimalista
  minimal: {
    ...chatbotConfig,
    visual: {
      ...chatbotConfig.visual,
      neural: {
        showNetwork: false,
        showParticles: false,
        showWaves: false,
        showForceField: false
      },
      glassmorphism: {
        ...chatbotConfig.visual.glassmorphism,
        intensity: 'low'
      }
    },
    audio: {
      ...chatbotConfig.audio,
      enabled: false
    },
    vibration: {
      ...chatbotConfig.vibration,
      enabled: false
    }
  },

  // Preset máximo rendimiento
  performance: {
    ...chatbotConfig,
    visual: {
      ...chatbotConfig.visual,
      neural: {
        ...chatbotConfig.visual.neural,
        particleCount: 30,
        nodeCount: 10,
        waveCount: 2
      }
    },
    performance: {
      ...chatbotConfig.performance,
      fps: {
        target: 30,
        adaptive: false,
        fallback: 15
      }
    }
  },

  // Preset inmersivo
  immersive: {
    ...chatbotConfig,
    visual: {
      ...chatbotConfig.visual,
      neural: {
        showNetwork: true,
        showParticles: true,
        showWaves: true,
        showForceField: true,
        particleCount: 100,
        nodeCount: 25,
        waveCount: 5
      },
      glassmorphism: {
        ...chatbotConfig.visual.glassmorphism,
        intensity: 'high'
      }
    },
    audio: {
      ...chatbotConfig.audio,
      enabled: true,
      volume: 0.5
    },
    vibration: {
      ...chatbotConfig.vibration,
      enabled: true
    }
  }
};

// Función para obtener configuración
export const getChatbotConfig = (preset = 'default') => {
  if (preset === 'default') {
    return chatbotConfig;
  }
  
  if (presets[preset]) {
    return presets[preset];
  }
  
  console.warn(`Preset "${preset}" no encontrado, usando configuración por defecto`);
  return chatbotConfig;
};

// Función para actualizar configuración
export const updateChatbotConfig = (updates) => {
  return {
    ...chatbotConfig,
    ...updates
  };
};

export default chatbotConfig;
