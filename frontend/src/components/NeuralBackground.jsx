import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Componente de fondo neural reutilizable
const NeuralBackground = ({ 
  theme = "default", 
  particleCount = 50, 
  waveCount = 8,
  intensity = "medium" 
}) => {
  const [particles, setParticles] = useState([]);

  // Configuración de temas
  const getThemeConfig = () => {
    switch (theme) {
      case "loans":
        return {
          colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
          gradients: {
            primary: 'from-blue-500/5 via-purple-500/5 to-cyan-500/5',
            secondary: 'from-blue-500/10 via-purple-500/10 to-cyan-500/10',
            accent: 'from-blue-500/5 via-transparent to-purple-500/5'
          },
          waveColors: ['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']
        };
      case "mentoring":
        return {
          colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'],
          gradients: {
            primary: 'from-green-500/5 via-emerald-500/5 to-teal-500/5',
            secondary: 'from-green-500/10 via-emerald-500/10 to-teal-500/10',
            accent: 'from-green-500/5 via-transparent to-emerald-500/5'
          },
          waveColors: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)', 'rgba(52, 211, 153, 0.1)']
        };
      case "learning":
        return {
          colors: ['#8b5cf6', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff'],
          gradients: {
            primary: 'from-purple-500/5 via-violet-500/5 to-indigo-500/5',
            secondary: 'from-purple-500/10 via-violet-500/10 to-indigo-500/10',
            accent: 'from-purple-500/5 via-transparent to-violet-500/5'
          },
          waveColors: ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)', 'rgba(168, 85, 247, 0.1)']
        };
      case "marketplace":
        return {
          colors: ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#fef3c7'],
          gradients: {
            primary: 'from-orange-500/5 via-amber-500/5 to-yellow-500/5',
            secondary: 'from-orange-500/10 via-amber-500/10 to-yellow-500/10',
            accent: 'from-orange-500/5 via-transparent to-amber-500/5'
          },
          waveColors: ['rgba(245, 158, 11, 0.1)', 'rgba(217, 119, 6, 0.1)', 'rgba(251, 191, 36, 0.1)']
        };
      case "community":
        return {
          colors: ['#ec4899', '#db2777', '#f472b6', '#f9a8d4', '#fce7f3'],
          gradients: {
            primary: 'from-pink-500/5 via-rose-500/5 to-red-500/5',
            secondary: 'from-pink-500/10 via-rose-500/10 to-red-500/10',
            accent: 'from-pink-500/5 via-transparent to-rose-500/5'
          },
          waveColors: ['rgba(236, 72, 153, 0.1)', 'rgba(219, 39, 119, 0.1)', 'rgba(244, 114, 182, 0.1)']
        };
      case "dashboard":
        return {
          colors: ['#06b6d4', '#0891b2', '#22d3ee', '#67e8f9', '#a5f3fc'],
          gradients: {
            primary: 'from-cyan-500/5 via-sky-500/5 to-blue-500/5',
            secondary: 'from-cyan-500/10 via-sky-500/10 to-blue-500/10',
            accent: 'from-cyan-500/5 via-transparent to-sky-500/5'
          },
          waveColors: ['rgba(6, 182, 212, 0.1)', 'rgba(8, 145, 178, 0.1)', 'rgba(34, 211, 238, 0.1)']
        };
      case "support":
        return {
          colors: ['#6366f1', '#4f46e5', '#7c3aed', '#a855f7', '#c084fc'],
          gradients: {
            primary: 'from-indigo-500/5 via-purple-500/5 to-violet-500/5',
            secondary: 'from-indigo-500/10 via-purple-500/10 to-violet-500/10',
            accent: 'from-indigo-500/5 via-transparent to-purple-500/5'
          },
          waveColors: ['rgba(99, 102, 241, 0.1)', 'rgba(79, 70, 229, 0.1)', 'rgba(124, 58, 237, 0.1)']
        };
      case "governance":
        return {
          colors: ['#059669', '#047857', '#10b981', '#34d399', '#6ee7b7'],
          gradients: {
            primary: 'from-emerald-600/5 via-green-500/5 to-teal-500/5',
            secondary: 'from-emerald-600/10 via-green-500/10 to-teal-500/10',
            accent: 'from-emerald-600/5 via-transparent to-green-500/5'
          },
          waveColors: ['rgba(5, 150, 105, 0.1)', 'rgba(4, 120, 87, 0.1)', 'rgba(16, 185, 129, 0.1)']
        };
      case "profile":
        return {
          colors: ['#8b5cf6', '#7c3aed', '#a855f7', '#c084fc', '#e9d5ff'],
          gradients: {
            primary: 'from-purple-500/5 via-violet-500/5 to-indigo-500/5',
            secondary: 'from-purple-500/10 via-violet-500/10 to-indigo-500/10',
            accent: 'from-purple-500/5 via-transparent to-violet-500/5'
          },
          waveColors: ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)', 'rgba(168, 85, 247, 0.1)']
        };
      default:
        return {
          colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
          gradients: {
            primary: 'from-blue-500/5 via-purple-500/5 to-cyan-500/5',
            secondary: 'from-blue-500/10 via-purple-500/10 to-cyan-500/10',
            accent: 'from-blue-500/5 via-transparent to-purple-500/5'
          },
          waveColors: ['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']
        };
    }
  };

  const themeConfig = getThemeConfig();

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      color: themeConfig.colors[Math.floor(Math.random() * themeConfig.colors.length)]
    }));
    setParticles(newParticles);
  }, [particleCount, theme]);

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case "low": return 0.5;
      case "high": return 1.5;
      default: return 1;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Partículas neurales */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size * getIntensityMultiplier()}px`,
            height: `${particle.size * getIntensityMultiplier()}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2 * getIntensityMultiplier()}px ${particle.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Líneas de conexión neural */}
      {particles.slice(0, Math.floor(particleCount * 0.4)).map((particle, i) => (
        <motion.div
          key={`connection-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-current to-transparent"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: '100px',
            transformOrigin: 'left center',
            color: particle.color,
            opacity: 0.3,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      {/* Ondas neurales */}
      {[...Array(waveCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${200 + Math.random() * 300}px`,
            height: `${200 + Math.random() * 300}px`,
            background: `radial-gradient(circle, ${themeConfig.waveColors[i % themeConfig.waveColors.length]} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradientes de fondo */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themeConfig.gradients.primary}`} />
      <div className={`absolute inset-0 bg-gradient-to-tl ${themeConfig.gradients.accent}`} />
      
      {/* Efecto de respiración del fondo */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${themeConfig.gradients.secondary}`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default NeuralBackground;
