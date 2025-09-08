import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from './NeuralBackground';
import '../styles/neural-effects.css';

// Componente de partículas neurales avanzadas
const NeuralParticles = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5,
      delay: Math.random() * 10,
      color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.8, 0.1],
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
      {particles.slice(0, 20).map((particle, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: '2px',
            height: '2px',
            background: `linear-gradient(45deg, ${particle.color}, transparent)`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.5, 1.5, 0.5],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: particle.delay + 2,
          }}
        />
      ))}
    </div>
  );
};

// Componente de ondas neurales
const NeuralWaves = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${20 + i * 30}% ${30 + i * 20}%, rgba(59, 130, 246, 0.1), transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
};

// Componente de tarjeta con glassmorphism avanzado
const AdvancedGlassCard = ({ 
  children, 
  className = "", 
  delay = 0, 
  intensity = "medium",
  variant = "default",
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const intensities = {
    low: {
      bg: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.1)",
      shadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
      blur: "blur(8px)"
    },
    medium: {
      bg: "rgba(255, 255, 255, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      blur: "blur(12px)"
    },
    high: {
      bg: "rgba(255, 255, 255, 0.15)",
      border: "rgba(255, 255, 255, 0.3)",
      shadow: "0 12px 48px rgba(0, 0, 0, 0.2)",
      blur: "blur(16px)"
    }
  };

  const variants = {
    default: "bg-white/10 dark:bg-gray-800/10",
    primary: "bg-primary-500/10 dark:bg-primary-500/5",
    secondary: "bg-brain-500/10 dark:bg-brain-500/5",
    accent: "bg-purple-500/10 dark:bg-purple-500/5"
  };

  const currentIntensity = intensities[intensity];

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
      viewport={{ once: true }}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group ${className}`}
      style={{
        background: isHovered ? 
          `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.2), ${currentIntensity.bg})` :
          currentIntensity.bg,
        backdropFilter: currentIntensity.blur,
        WebkitBackdropFilter: currentIntensity.blur,
        border: `1px solid ${currentIntensity.border}`,
        boxShadow: isHovered ? 
          "0 16px 64px rgba(0, 0, 0, 0.25)" : 
          currentIntensity.shadow,
        borderRadius: "24px"
      }}
      {...props}
    >
      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-brain-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.5 }}
      />
      
      {/* Efecto de borde animado */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.3), transparent, rgba(14, 165, 233, 0.3), transparent)`,
          padding: "1px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor"
        }}
        animate={{
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          duration: 3,
          ease: "linear",
          repeat: isHovered ? Infinity : 0
        }}
      />
      
      {/* Contenido */}
      <div className="relative z-10 p-8">
        {children}
      </div>
    </motion.div>
  );
};

// Componente de estadísticas animadas mejorado
const AnimatedMentoringStats = ({ label, value, icon, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const springValue = useSpring(count, { stiffness: 100, damping: 30 });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof value === 'number') {
        setCount(value);
      }
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <AdvancedGlassCard delay={delay} intensity="medium" className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
        className="text-4xl mb-3"
      >
        {icon}
      </motion.div>
      <motion.div 
        className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
      >
        {typeof value === 'number' ? Math.round(springValue) : value}
      </motion.div>
      <motion.div 
        className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.6 }}
      >
        {label}
      </motion.div>
    </AdvancedGlassCard>
  );
};

// Componente de tarjeta de mentor mejorado
const MentorCard = ({ mentor, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const getExpertiseColor = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return 'from-blue-500 to-indigo-500';
      case 'Smart Contracts': return 'from-purple-500 to-pink-500';
      case 'DeFi': return 'from-green-500 to-emerald-500';
      case 'Security': return 'from-red-500 to-pink-500';
      case 'AI/ML': return 'from-orange-500 to-yellow-500';
      case 'Frontend': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getExpertiseIcon = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return '⛓️';
      case 'Smart Contracts': return '📜';
      case 'DeFi': return '💰';
      case 'Security': return '🛡️';
      case 'AI/ML': return '🤖';
      case 'Frontend': return '🎨';
      default: return '📚';
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'Disponible': return 'text-green-600 dark:text-green-400';
      case 'Ocupado': return 'text-yellow-600 dark:text-yellow-400';
      case 'No disponible': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAvailabilityIcon = (availability) => {
    switch (availability) {
      case 'Disponible': return '🟢';
      case 'Ocupado': return '🟡';
      case 'No disponible': return '🔴';
      default: return '⚪';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.03,
        y: -8,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(mentor)}
      className={`relative group cursor-pointer neural-card neural-hover ${
        isSelected ? 'ring-2 ring-primary-500 shadow-2xl' : ''
      }`}
      style={{
        background: isHovered ? 
          `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))` :
          'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered ? 
          '0 20px 80px rgba(0, 0, 0, 0.3)' : 
          '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '24px'
      }}
    >
      {/* Efecto de brillo neural */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-brain-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.5 }}
      />
      
      {/* Efecto de borde animado */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.4), transparent, rgba(14, 165, 233, 0.4), transparent)`,
          padding: "2px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor"
        }}
        animate={{
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          duration: 4,
          ease: "linear",
          repeat: isHovered ? Infinity : 0
        }}
      />
      
      {/* Contenido */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-16 h-16 rounded-full bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {mentor.avatar || mentor.name.charAt(0)}
            </motion.div>
            <div>
              <motion.h3 
                className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {mentor.name}
              </motion.h3>
              <div className="flex items-center gap-3">
                <motion.span 
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} text-white shadow-md`}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-lg">{getExpertiseIcon(mentor.expertise)}</span>
                  <span>{mentor.expertise}</span>
                </motion.span>
                <motion.span 
                  className={`inline-flex items-center gap-2 text-sm font-medium ${getAvailabilityColor(mentor.availability)}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {getAvailabilityIcon(mentor.availability)}
                  </motion.span>
                  <span>{mentor.availability}</span>
                </motion.span>
              </div>
            </div>
          </div>
          
          <motion.div 
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Rating
            </div>
            <div className="flex items-center gap-2">
              <motion.span 
                className="text-yellow-500 text-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐
              </motion.span>
              <span className="font-bold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                {mentor.rating}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Description */}
        <motion.p 
          className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {mentor.description}
        </motion.p>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Sesiones', value: mentor.sessions, icon: '📚' },
            { label: 'Estudiantes', value: mentor.students, icon: '👥' },
            { label: 'Años Exp.', value: mentor.experience, icon: '⭐' }
          ].map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-lg font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Skills */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
            Habilidades
          </div>
          <div className="flex flex-wrap gap-2">
            {mentor.skills.slice(0, 3).map((skill, index) => (
              <motion.span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-r from-primary-500/10 to-brain-500/10 backdrop-blur-sm border border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs rounded-full font-medium"
                whileHover={{ scale: 1.05, y: -1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                {skill}
              </motion.span>
            ))}
            {mentor.skills.length > 3 && (
              <motion.span 
                className="px-3 py-1.5 bg-gradient-to-r from-gray-500/10 to-gray-600/10 backdrop-blur-sm border border-gray-500/20 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium"
                whileHover={{ scale: 1.05, y: -1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
              >
                +{mentor.skills.length - 3}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden neural-shine ${
            mentor.availability === 'Disponible'
              ? 'bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          disabled={mentor.availability !== 'Disponible'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {/* Efecto de brillo animado */}
          {mentor.availability === 'Disponible' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          )}
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            {mentor.availability === 'Disponible' ? (
              <>
                <span>🚀</span>
                Solicitar Mentoría
              </>
            ) : (
              <>
                <span>⏸️</span>
                No Disponible
              </>
            )}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Componente de detalles de mentor mejorado
const MentorDetails = ({ mentor, onClose, onRequestMentorship }) => {
  const [requesting, setRequesting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleRequest = async () => {
    if (!selectedDate || !selectedTime || !message.trim()) {
      return;
    }

    setRequesting(true);
    
    // Simular solicitud
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onRequestMentorship(mentor.id, {
      date: selectedDate,
      time: selectedTime,
      message
    });
    
    setRequesting(false);
    onClose();
  };

  const getExpertiseColor = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return 'from-blue-500 to-indigo-500';
      case 'Smart Contracts': return 'from-purple-500 to-pink-500';
      case 'DeFi': return 'from-green-500 to-emerald-500';
      case 'Security': return 'from-red-500 to-pink-500';
      case 'AI/ML': return 'from-orange-500 to-yellow-500';
      case 'Frontend': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getExpertiseIcon = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return '⛓️';
      case 'Smart Contracts': return '📜';
      case 'DeFi': return '💰';
      case 'Security': return '🛡️';
      case 'AI/ML': return '🤖';
      case 'Frontend': return '🎨';
      default: return '📚';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
      style={{
        background: isHovered ? 
          `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))` :
          'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered ? 
          '0 20px 80px rgba(0, 0, 0, 0.3)' : 
          '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '24px'
      }}
    >
      {/* Efecto de brillo neural */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-brain-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.5 }}
      />
      
      {/* Efecto de borde animado */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.4), transparent, rgba(14, 165, 233, 0.4), transparent)`,
          padding: "2px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor"
        }}
        animate={{
          rotate: isHovered ? 360 : 0
        }}
        transition={{
          duration: 4,
          ease: "linear",
          repeat: isHovered ? Infinity : 0
        }}
      />
      
      {/* Contenido */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Detalles del Mentor
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✕
          </motion.button>
        </div>

        {/* Mentor Info */}
        <motion.div 
          className="flex items-center gap-6 mb-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className={`w-20 h-20 rounded-full bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} flex items-center justify-center text-white text-3xl font-bold shadow-xl`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {mentor.avatar || mentor.name.charAt(0)}
          </motion.div>
          <div className="flex-1">
            <motion.h3 
              className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {mentor.name}
            </motion.h3>
            <div className="flex items-center gap-3 mb-3">
              <motion.span 
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} text-white shadow-md`}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-lg">{getExpertiseIcon(mentor.expertise)}</span>
                <span>{mentor.expertise}</span>
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.span 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐
                </motion.span>
                <span className="font-bold">{mentor.rating}</span>
              </motion.span>
            </div>
            <motion.p 
              className="text-gray-600 dark:text-gray-400 text-sm font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {mentor.experience} años de experiencia • {mentor.sessions} sesiones • {mentor.students} estudiantes
            </motion.p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h4 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
            Sobre {mentor.name}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
            {mentor.description}
          </p>
        </motion.div>

        {/* Skills */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h4 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
            Habilidades
          </h4>
          <div className="flex flex-wrap gap-3">
            {mentor.skills.map((skill, index) => (
              <motion.span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-primary-500/10 to-brain-500/10 backdrop-blur-sm border border-primary-500/20 text-primary-700 dark:text-primary-300 text-sm rounded-full font-medium"
                whileHover={{ scale: 1.05, y: -2 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + index * 0.1 }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Request Form */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <h4 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
            Solicitar Mentoría
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📅 Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🕐 Hora
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              >
                <option value="">Seleccionar hora</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
              </select>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              💬 Mensaje
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe lo que quieres aprender o discutir..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-300"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequest}
            disabled={requesting || !selectedDate || !selectedTime || !message.trim()}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden ${
              requesting || !selectedDate || !selectedTime || !message.trim()
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            {/* Efecto de brillo animado */}
            {!requesting && selectedDate && selectedTime && message.trim() && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            )}
            
            {requesting ? (
              <div className="flex items-center justify-center gap-3">
                <motion.div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Enviando solicitud...</span>
              </div>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>🚀</span>
                Solicitar Mentoría
              </span>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Componente de filtros mejorado
const MentoringFilters = ({ filter, setFilter }) => {
  const filters = [
    { id: 'todos', label: 'Todos', icon: '👥' },
    { id: 'Disponible', label: 'Disponibles', icon: '🟢' },
    { id: 'Ocupado', label: 'Ocupados', icon: '🟡' },
    { id: 'No disponible', label: 'No disponibles', icon: '🔴' },
  ];

  const expertise = [
    { id: 'todos', label: 'Todas las áreas', icon: '📚' },
    { id: 'Blockchain', label: 'Blockchain', icon: '⛓️' },
    { id: 'Smart Contracts', label: 'Smart Contracts', icon: '📜' },
    { id: 'DeFi', label: 'DeFi', icon: '💰' },
    { id: 'Security', label: 'Security', icon: '🛡️' },
    { id: 'AI/ML', label: 'AI/ML', icon: '🤖' },
    { id: 'Frontend', label: 'Frontend', icon: '🎨' },
  ];

  return (
    <AdvancedGlassCard intensity="medium" className="mb-8">
      <div className="space-y-6">
        {/* Search */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="🔍 Buscar mentores..."
            className="w-full px-6 py-4 pl-14 bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-lg"
          />
          <motion.span 
            className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔍
          </motion.span>
        </motion.div>

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
            📊 Disponibilidad
          </h4>
          <div className="flex flex-wrap gap-3">
            {filters.map((f, index) => (
              <motion.button
                key={f.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter({ ...filter, status: f.id })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter.status === f.id
                    ? 'bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-600/20'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <span className="text-lg">{f.icon}</span>
                <span>{f.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Expertise Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
            🎯 Área de Experiencia
          </h4>
          <div className="flex flex-wrap gap-3">
            {expertise.map((e, index) => (
              <motion.button
                key={e.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter({ ...filter, expertise: e.id })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter.expertise === e.id
                    ? 'bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 dark:bg-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-600/20'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span className="text-lg">{e.icon}</span>
                <span>{e.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AdvancedGlassCard>
  );
};

export default function MentorshipPanel() {
  const { t } = useTranslation();
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [filter, setFilter] = useState({ status: 'todos', expertise: 'todos', search: '' });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Datos simulados
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setMentors([
        {
          id: 1,
          name: 'Dr. Ana García',
          expertise: 'Blockchain',
          description: 'Experta en blockchain con 8 años de experiencia. Especializada en Ethereum, Solidity y desarrollo de dApps. Ha trabajado en proyectos DeFi y NFT.',
          rating: 4.9,
          sessions: 156,
          students: 89,
          experience: 8,
          availability: 'Disponible',
          skills: ['Ethereum', 'Solidity', 'DeFi', 'NFTs', 'Web3.js', 'Hardhat']
        },
        {
          id: 2,
          name: 'Carlos López',
          expertise: 'Smart Contracts',
          description: 'Desarrollador senior de smart contracts con experiencia en auditorías de seguridad. Especializado en optimización de gas y patrones de diseño.',
          rating: 4.8,
          sessions: 203,
          students: 124,
          experience: 6,
          availability: 'Ocupado',
          skills: ['Solidity', 'Security', 'Auditing', 'Gas Optimization', 'OpenZeppelin']
        },
        {
          id: 3,
          name: 'María Rodríguez',
          expertise: 'DeFi',
          description: 'Especialista en finanzas descentralizadas con experiencia en protocolos DeFi, yield farming y estrategias de inversión en criptomonedas.',
          rating: 4.7,
          sessions: 98,
          students: 67,
          experience: 5,
          availability: 'Disponible',
          skills: ['DeFi', 'Yield Farming', 'Liquidity Pools', 'Uniswap', 'Compound']
        },
        {
          id: 4,
          name: 'David Martínez',
          expertise: 'Security',
          description: 'Hacker ético y auditor de seguridad blockchain. Especializado en detección de vulnerabilidades y mejores prácticas de seguridad.',
          rating: 4.9,
          sessions: 134,
          students: 92,
          experience: 7,
          availability: 'Disponible',
          skills: ['Security', 'Penetration Testing', 'Auditing', 'Vulnerability Assessment']
        },
        {
          id: 5,
          name: 'Laura Sánchez',
          expertise: 'AI/ML',
          description: 'Investigadora en IA aplicada a blockchain. Experta en oráculos, predicciones on-chain y sistemas de recomendación descentralizados.',
          rating: 4.6,
          sessions: 87,
          students: 54,
          experience: 4,
          availability: 'No disponible',
          skills: ['Machine Learning', 'Oracles', 'Predictions', 'Python', 'TensorFlow']
        },
        {
          id: 6,
          name: 'Pedro González',
          expertise: 'Frontend',
          description: 'Desarrollador frontend especializado en aplicaciones Web3. Experto en React, dApps y integración con wallets.',
          rating: 4.5,
          sessions: 112,
          students: 78,
          experience: 5,
          availability: 'Disponible',
          skills: ['React', 'Web3.js', 'Ethers.js', 'Wagmi', 'Tailwind CSS']
        }
      ]);
      setLoading(false);
    }, 1500);

    // Mostrar alerta después de 4 segundos
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filteredMentors = mentors.filter(mentor =>
    (filter.status === 'todos' || mentor.availability === filter.status) &&
    (filter.expertise === 'todos' || mentor.expertise === filter.expertise) &&
    (mentor.name.toLowerCase().includes(filter.search.toLowerCase()) || 
     mentor.description.toLowerCase().includes(filter.search.toLowerCase()) ||
     mentor.skills.some(skill => skill.toLowerCase().includes(filter.search.toLowerCase())))
  );

  const handleRequestMentorship = (mentorId, requestData) => {
    // Simular solicitud de mentoría
    console.log('Solicitud de mentoría:', { mentorId, ...requestData });
    // Aquí se enviaría la solicitud al backend
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="mentoring" particleCount={55} waveCount={8} intensity="high" />
      
      {/* Gradientes animados de fondo */}
      <div className="absolute inset-0 neural-gradient" />
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/5 via-transparent to-indigo-500/5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500/10 to-brain-500/10 backdrop-blur-sm border border-primary-500/20 rounded-full text-sm font-semibold mb-6"
            >
              <motion.span 
                className="text-2xl mr-3"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎓
              </motion.span>
              <span className="bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
                Mentoría Inteligente
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="neural-text neural-text-glow">
                Mentoring
              </span>
              <br />
              <span className="text-3xl md:text-4xl lg:text-5xl neural-text">
                Neural
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto lg:mx-0 leading-relaxed"
            >
              Conecta con expertos en blockchain y tecnología. Aprende de mentores certificados que te guiarán en tu camino hacia el dominio de las tecnologías descentralizadas con inteligencia artificial.
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatedMentoringStats 
              label="Mentores Activos" 
              value={mentors.filter(m => m.availability === 'Disponible').length} 
              icon="👥" 
              delay={1.0}
            />
            <AnimatedMentoringStats 
              label="Sesiones Realizadas" 
              value={mentors.reduce((sum, m) => sum + m.sessions, 0)} 
              icon="📚" 
              delay={1.1}
            />
            <AnimatedMentoringStats 
              label="Estudiantes Satisfechos" 
              value={mentors.reduce((sum, m) => sum + m.students, 0)} 
              icon="🎓" 
              delay={1.2}
            />
            <AnimatedMentoringStats 
              label="Rating Promedio" 
              value="4.7⭐" 
              icon="⭐" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Alert */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mb-8"
            >
              <AdvancedGlassCard intensity="medium" className="border-blue-500/20">
                <div className="flex items-center gap-4">
                  <motion.span 
                    className="text-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎓
                  </motion.span>
                  <div>
                    <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Nuevo mentor disponible
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Dr. Ana García se ha unido como mentora en Blockchain.
                    </div>
                  </div>
                </div>
              </AdvancedGlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <MentoringFilters filter={filter} setFilter={setFilter} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mentors List */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/20 p-8"
                      >
                        <div className="animate-pulse">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                          </div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
                          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <AdvancedGlassCard intensity="medium" className="text-center">
                      <motion.div 
                        className="text-8xl mb-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🎓
                      </motion.div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
                        No se encontraron mentores
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Intenta ajustar los filtros o contacta con soporte.
                      </p>
                    </AdvancedGlassCard>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMentors.map((mentor, index) => (
                      <MentorCard
                        key={mentor.id}
                        mentor={mentor}
                        onSelect={setSelectedMentor}
                        isSelected={selectedMentor?.id === mentor.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mentor Details */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {selectedMentor ? (
                  <MentorDetails
                    mentor={selectedMentor}
                    onClose={() => setSelectedMentor(null)}
                    onRequestMentorship={handleRequestMentorship}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/20 p-8 text-center"
                  >
                    <motion.div 
                      className="text-6xl mb-6"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎓
                    </motion.div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent mb-4">
                      Selecciona un mentor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                      Haz clic en un mentor para ver sus detalles y solicitar una sesión de mentoría.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 