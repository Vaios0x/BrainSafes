import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente de texto con efectos neurales
export const NeuralText = ({ 
  text, 
  delay = 0, 
  duration = 0.5, 
  className = "",
  variant = "default"
}) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const chars = text.split('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleChars(chars.length);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [chars.length, delay]);

  const variants = {
    default: {
      initial: { opacity: 0, y: 20, scale: 0.8 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -20, scale: 0.8 }
    },
    neural: {
      initial: { opacity: 0, y: 20, rotateX: -90 },
      animate: { opacity: 1, y: 0, rotateX: 0 },
      exit: { opacity: 0, y: -20, rotateX: 90 }
    },
    glow: {
      initial: { opacity: 0, scale: 0.5, filter: 'blur(10px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, scale: 0.5, filter: 'blur(10px)' }
    }
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <div className={`inline-block ${className}`}>
      {chars.map((char, index) => (
        <motion.span
          key={index}
          initial={currentVariant.initial}
          animate={index < visibleChars ? currentVariant.animate : currentVariant.initial}
          exit={currentVariant.exit}
          transition={{
            duration: duration,
            delay: index * 0.05,
            type: "spring",
            stiffness: 100
          }}
          className="inline-block"
          style={{
            textShadow: variant === 'glow' ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
};

// Componente de texto con efecto de máquina de escribir
export const TypewriterText = ({ 
  text, 
  speed = 100, 
  delay = 0,
  className = "",
  onComplete = () => {}
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex(0);
      setDisplayedText('');
      setIsComplete(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="ml-1"
      >
        |
      </motion.span>
    </motion.span>
  );
};

// Componente de texto con efecto de partículas
export const ParticleText = ({ 
  text, 
  particleCount = 20,
  className = ""
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 200,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * Math.PI * 2
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: `hsl(${particle.hue}, 70%, 60%)`,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px hsl(${particle.hue}, 70%, 60%)`
            }}
            animate={{
              x: [
                0,
                Math.cos(particle.direction) * 20,
                Math.cos(particle.direction + Math.PI) * 20,
                0
              ],
              y: [
                0,
                Math.sin(particle.direction) * 20,
                Math.sin(particle.direction + Math.PI) * 20,
                0
              ],
              opacity: [
                particle.opacity,
                particle.opacity * 0.3,
                particle.opacity * 0.7,
                particle.opacity
              ],
              scale: [1, 1.5, 0.8, 1]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Componente de texto con efecto de glitch
export const GlitchText = ({ 
  text, 
  glitchIntensity = 0.1,
  className = ""
}) => {
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < glitchIntensity) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        });
      } else {
        setGlitchOffset({ x: 0, y: 0 });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [glitchIntensity]);

  return (
    <motion.span
      className={`inline-block ${className}`}
      animate={{
        x: glitchOffset.x,
        y: glitchOffset.y,
        textShadow: glitchOffset.x !== 0 ? [
          '2px 0 0 #ff0000',
          '-2px 0 0 #00ffff',
          '0 2px 0 #00ff00',
          '0 -2px 0 #ffff00'
        ] : 'none'
      }}
      transition={{ duration: 0.1 }}
    >
      {text}
    </motion.span>
  );
};

// Componente de texto con efecto de holograma
export const HologramText = ({ 
  text, 
  className = ""
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.span
        className="relative z-10"
        animate={{
          textShadow: [
            '0 0 5px rgba(59, 130, 246, 0.5)',
            '0 0 10px rgba(59, 130, 246, 0.8)',
            '0 0 15px rgba(59, 130, 246, 1)',
            '0 0 10px rgba(59, 130, 246, 0.8)',
            '0 0 5px rgba(59, 130, 246, 0.5)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {text}
      </motion.span>
      
      {/* Efecto de escaneo */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Líneas de interferencia */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ height: '1px', top: `${20 + i * 30}%` }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}
    </div>
  );
};

// Componente de texto con efecto de matrix
export const MatrixText = ({ 
  text, 
  className = ""
}) => {
  const [matrixChars, setMatrixChars] = useState([]);

  useEffect(() => {
    const chars = '01';
    const newMatrixChars = text.split('').map((char, index) => ({
      id: index,
      char: char,
      matrixChar: chars[Math.floor(Math.random() * chars.length)],
      opacity: 1
    }));
    setMatrixChars(newMatrixChars);

    const interval = setInterval(() => {
      setMatrixChars(prev => prev.map(item => ({
        ...item,
        matrixChar: chars[Math.floor(Math.random() * chars.length)],
        opacity: Math.random() > 0.1 ? 1 : 0.3
      })));
    }, 100);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className={`inline-block ${className}`}>
      {matrixChars.map((item) => (
        <motion.span
          key={item.id}
          className="inline-block font-mono"
          style={{
            opacity: item.opacity,
            color: item.opacity === 1 ? '#00ff00' : '#004400'
          }}
          animate={{
            textShadow: item.opacity === 1 ? '0 0 5px #00ff00' : 'none'
          }}
        >
          {item.char}
        </motion.span>
      ))}
    </div>
  );
};

export default {
  NeuralText,
  TypewriterText,
  ParticleText,
  GlitchText,
  HologramText,
  MatrixText
};
