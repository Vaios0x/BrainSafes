import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useScroll } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from './NeuralBackground';
import '../styles/neural-effects.css';
import '../styles/loans-neural-effects.css';

// Componente de partículas neurales avanzadas para loans
const NeuralLoansParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
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
      {particles.slice(0, 20).map((particle, i) => (
        <motion.div
          key={`connection-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: '100px',
            transformOrigin: 'left center',
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
    </div>
  );
};

// Componente de ondas neurales
const NeuralWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${200 + Math.random() * 300}px`,
          height: `${200 + Math.random() * 300}px`,
          background: `radial-gradient(circle, rgba(59, 130, 246, ${0.05 + Math.random() * 0.1}) 0%, transparent 70%)`,
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
  </div>
);

// Componente de tarjeta de glassmorphism avanzada
const AdvancedGlassCard = ({ children, className = "", delay = 0, intensity = "medium", variant = "default", ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const getIntensityClasses = () => {
    switch (intensity) {
      case "low":
        return {
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        };
      case "high":
        return {
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        };
      default:
        return {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        };
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "loans":
        return "neural-loans-card";
      case "stats":
        return "neural-stats-card";
      case "details":
        return "neural-details-card";
      default:
        return "neural-card";
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group cursor-pointer neural-card neural-hover ${getVariantClasses()} ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))`
          : getIntensityClasses().background,
        backdropFilter: getIntensityClasses().backdropFilter,
        WebkitBackdropFilter: getIntensityClasses().backdropFilter,
        border: getIntensityClasses().border,
        boxShadow: isHovered
          ? '0 20px 80px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '24px',
      }}
      {...props}
    >
      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent" />
      
      {/* Brillo neural */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Componente de estadísticas animadas con spring physics
const AnimatedLoansStats = ({ label, value, icon, delay = 0, color = "blue" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  
  // Transformaciones para diferentes tipos de valores
  const formattedValue = useTransform(motionValue, (val) => {
    if (typeof value === 'string' && value.includes('$')) {
      return `$${Math.floor(val).toLocaleString()}`;
    } else if (typeof value === 'string' && value.includes('%')) {
      return `${val.toFixed(1)}%`;
    } else {
      return Math.floor(val).toString();
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      let numericValue = 0;
      if (typeof value === 'string' && value.includes('$')) {
        numericValue = parseFloat(value.replace(/[$,]/g, ''));
      } else if (typeof value === 'string' && value.includes('%')) {
        numericValue = parseFloat(value.replace('%', ''));
      } else if (typeof value === 'number') {
        numericValue = value;
      }
      
      setDisplayValue(numericValue);
      motionValue.set(numericValue);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, delay, motionValue]);

  const getColorClasses = () => {
    switch (color) {
      case "green": return "from-green-500 to-emerald-500";
      case "purple": return "from-purple-500 to-violet-500";
      case "orange": return "from-orange-500 to-amber-500";
      case "cyan": return "from-cyan-500 to-blue-500";
      default: return "from-blue-500 to-indigo-500";
    }
  };

  const getColorValues = () => {
    switch (color) {
      case "green": return { from: "#10b981", to: "#059669" };
      case "purple": return { from: "#8b5cf6", to: "#7c3aed" };
      case "orange": return { from: "#f59e0b", to: "#d97706" };
      case "cyan": return { from: "#06b6d4", to: "#0891b2" };
      default: return { from: "#3b82f6", to: "#1d4ed8" };
    }
  };

  return (
    <AdvancedGlassCard 
      variant="stats" 
      delay={delay}
      className="p-6 text-center neural-breathe"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring", stiffness: 200 }}
        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${getColorClasses()} flex items-center justify-center text-white text-2xl shadow-lg`}
      >
        {icon}
      </motion.div>
      
      <motion.div
        className="text-3xl font-bold mb-2"
        style={{
          background: `linear-gradient(135deg, ${getColorValues().from}, ${getColorValues().to})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        <motion.span>
          {formattedValue}
        </motion.span>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.4 }}
        className="text-sm font-medium text-gray-600 dark:text-gray-300 neural-text"
      >
        {label}
      </motion.div>
    </AdvancedGlassCard>
  );
};

// Componente de tarjeta de préstamo con glassmorphism avanzado
const LoanCard = ({ loan, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return 'from-green-500 to-emerald-500';
      case 'Pendiente': return 'from-yellow-500 to-orange-500';
      case 'Rechazado': return 'from-red-500 to-pink-500';
      case 'Completado': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Activo': return '✅';
      case 'Pendiente': return '⏳';
      case 'Rechazado': return '❌';
      case 'Completado': return '🎉';
      default: return '📋';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Educativo': return '📚';
      case 'Desarrollo': return '💻';
      case 'Emprendimiento': return '🚀';
      case 'Investigación': return '🔬';
      case 'Certificación': return '🎓';
      default: return '💰';
    }
  };

  const calculateProgress = () => {
    const total = loan.amount;
    const paid = loan.amount - loan.remaining;
    return total > 0 ? (paid / total) * 100 : 0;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(loan)}
      className={`relative group cursor-pointer neural-card neural-hover ${isSelected ? 'ring-2 ring-primary-500 shadow-2xl' : ''}`}
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))`
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered
          ? '0 20px 80px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '24px',
      }}
    >
      {/* Brillo neural de fondo */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent" />
      
      {/* Contenido principal */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={`text-3xl ${isHovered ? 'animate-bounce' : ''}`}
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {getTypeIcon(loan.type)}
            </motion.div>
            <div>
              <motion.h3
                className="text-lg font-bold text-gray-900 dark:text-white mb-1"
                whileHover={{ scale: 1.02 }}
              >
                {loan.title}
              </motion.h3>
              <div className="flex items-center gap-2">
                <motion.span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(loan.status)} text-white shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                >
                  <span>{getStatusIcon(loan.status)}</span>
                  <span>{loan.status}</span>
                </motion.span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {loan.type}
                </span>
              </div>
            </div>
          </div>
          
          <motion.div
            className="text-right"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tasa
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white neural-text">
              {loan.interestRate}%
            </div>
          </motion.div>
        </div>

        {/* Description */}
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2"
          whileHover={{ scale: 1.01 }}
        >
          {loan.description}
        </motion.p>

        {/* Amount Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div
            className="bg-white/20 dark:bg-gray-700/20 rounded-xl p-3 backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Monto
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white neural-text">
              ${loan.amount.toLocaleString()}
            </div>
          </motion.div>
          <motion.div
            className="bg-white/20 dark:bg-gray-700/20 rounded-xl p-3 backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Restante
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white neural-text">
              ${loan.remaining.toLocaleString()}
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Progreso de pago</span>
            <span className="font-medium">{Math.round(calculateProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-loans-500 via-purple-500 to-cyan-500 h-3 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <motion.div
            className="bg-white/10 dark:bg-gray-700/10 rounded-lg p-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-gray-500 dark:text-gray-400">Inicio</div>
            <div className="text-gray-900 dark:text-white font-medium">
              {new Date(loan.startDate).toLocaleDateString()}
            </div>
          </motion.div>
          <motion.div
            className="bg-white/10 dark:bg-gray-700/10 rounded-lg p-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-gray-500 dark:text-gray-400">Vencimiento</div>
            <div className="text-gray-900 dark:text-white font-medium">
              {new Date(loan.dueDate).toLocaleDateString()}
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 neural-shine relative overflow-hidden ${
            loan.status === 'Activo'
              ? 'bg-gradient-to-r from-loans-500 to-loans-600 text-white hover:from-loans-600 hover:to-loans-700 shadow-lg'
              : loan.status === 'Pendiente'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          disabled={loan.status === 'Rechazado' || loan.status === 'Completado'}
        >
          <span className="relative z-10">
            {loan.status === 'Activo' ? 'Realizar Pago' : 
             loan.status === 'Pendiente' ? 'Ver Detalles' : 
             loan.status === 'Completado' ? 'Completado' : 'Rechazado'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Componente de detalles de préstamo con glassmorphism avanzado
const LoanDetails = ({ loan, onClose, onMakePayment }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [makingPayment, setMakingPayment] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return;
    }

    setMakingPayment(true);
    
    // Simular pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onMakePayment(loan.id, parseFloat(paymentAmount));
    
    setMakingPayment(false);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return 'from-green-500 to-emerald-500';
      case 'Pendiente': return 'from-yellow-500 to-orange-500';
      case 'Rechazado': return 'from-red-500 to-pink-500';
      case 'Completado': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Activo': return '✅';
      case 'Pendiente': return '⏳';
      case 'Rechazado': return '❌';
      case 'Completado': return '🎉';
      default: return '📋';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Educativo': return '📚';
      case 'Desarrollo': return '💻';
      case 'Emprendimiento': return '🚀';
      case 'Investigación': return '🔬';
      case 'Certificación': return '🎓';
      default: return '💰';
    }
  };

  const calculateProgress = () => {
    const total = loan.amount;
    const paid = loan.amount - loan.remaining;
    return total > 0 ? (paid / total) * 100 : 0;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group neural-card neural-hover"
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))`
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered
          ? '0 20px 80px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        borderRadius: '24px',
      }}
    >
      {/* Brillo neural de fondo */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/10 to-transparent" />
      
      {/* Contenido principal */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="text-2xl font-bold text-gray-900 dark:text-white neural-text-glow"
            whileHover={{ scale: 1.02 }}
          >
            Detalles del Préstamo
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 neural-hover"
          >
            ✕
          </motion.button>
        </div>

        {/* Loan Info */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            className={`w-20 h-20 rounded-full bg-gradient-to-r ${getStatusColor(loan.status)} flex items-center justify-center text-white text-3xl shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {getTypeIcon(loan.type)}
          </motion.div>
          <div>
            <motion.h3
              className="text-xl font-bold text-gray-900 dark:text-white mb-1"
              whileHover={{ scale: 1.02 }}
            >
              {loan.title}
            </motion.h3>
            <div className="flex items-center gap-2 mb-2">
              <motion.span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(loan.status)} text-white shadow-lg`}
                whileHover={{ scale: 1.05 }}
              >
                <span>{getStatusIcon(loan.status)}</span>
                <span>{loan.status}</span>
              </motion.span>
              <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {loan.type}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm neural-text">
              Tasa: {loan.interestRate}% • Duración: {loan.duration} meses
            </p>
          </div>
        </div>

        {/* Description */}
        <motion.div
          className="mb-6"
          whileHover={{ scale: 1.01 }}
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Descripción
          </h4>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {loan.description}
          </p>
        </motion.div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Monto Original', value: `$${loan.amount.toLocaleString()}`, color: 'blue' },
            { label: 'Saldo Restante', value: `$${loan.remaining.toLocaleString()}`, color: 'orange' },
            { label: 'Pagado', value: `$${(loan.amount - loan.remaining).toLocaleString()}`, color: 'green' },
            { label: 'Próximo Pago', value: `$${loan.nextPayment?.toLocaleString() || 'N/A'}`, color: 'purple' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="bg-white/20 dark:bg-gray-700/20 rounded-xl p-4 backdrop-blur-sm border border-white/10"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {item.label}
              </div>
              <div className={`text-xl font-bold ${
                item.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                'text-gray-900 dark:text-white neural-text'
              }`}>
                {item.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progreso de Pago</span>
            <span className="font-medium">{Math.round(calculateProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-loans-500 via-purple-500 to-cyan-500 h-4 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Payment Form */}
        {loan.status === 'Activo' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Realizar Pago
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto a Pagar
              </label>
              <motion.input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ingresa el monto"
                min="0"
                max={loan.remaining}
                className="w-full px-4 py-3 bg-white/20 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-loans-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                whileFocus={{ scale: 1.02 }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={makingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 neural-shine relative overflow-hidden ${
                makingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-loans-500 to-loans-600 text-white hover:from-loans-600 hover:to-loans-700 shadow-lg'
              }`}
            >
              <span className="relative z-10">
                {makingPayment ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando pago...
                  </div>
                ) : (
                  'Realizar Pago'
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Componente de filtros con glassmorphism avanzado
const LoansFilters = ({ filter, setFilter }) => {
  const filters = [
    { id: 'todos', label: 'Todos', icon: '📋', color: 'gray' },
    { id: 'Activo', label: 'Activos', icon: '✅', color: 'green' },
    { id: 'Pendiente', label: 'Pendientes', icon: '⏳', color: 'yellow' },
    { id: 'Completado', label: 'Completados', icon: '🎉', color: 'blue' },
    { id: 'Rechazado', label: 'Rechazados', icon: '❌', color: 'red' },
  ];

  const types = [
    { id: 'todos', label: 'Todos los tipos', icon: '💰', color: 'gray' },
    { id: 'Educativo', label: 'Educativo', icon: '📚', color: 'blue' },
    { id: 'Desarrollo', label: 'Desarrollo', icon: '💻', color: 'purple' },
    { id: 'Emprendimiento', label: 'Emprendimiento', icon: '🚀', color: 'orange' },
    { id: 'Investigación', label: 'Investigación', icon: '🔬', color: 'cyan' },
    { id: 'Certificación', label: 'Certificación', icon: '🎓', color: 'green' },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'green': return 'from-green-500 to-emerald-500';
      case 'yellow': return 'from-yellow-500 to-orange-500';
      case 'blue': return 'from-blue-500 to-indigo-500';
      case 'red': return 'from-red-500 to-pink-500';
      case 'purple': return 'from-purple-500 to-violet-500';
      case 'orange': return 'from-orange-500 to-amber-500';
      case 'cyan': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <AdvancedGlassCard variant="default" className="p-6">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <motion.input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="Buscar préstamos..."
            className="w-full px-4 py-3 pl-12 bg-white/20 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-loans-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            whileFocus={{ scale: 1.02 }}
          />
          <motion.span
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔍
          </motion.span>
        </div>

        {/* Status Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 neural-text">
            Estado
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.map((f, index) => (
              <motion.button
                key={f.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter({ ...filter, status: f.id })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 neural-hover ${
                  filter.status === f.id
                    ? `bg-gradient-to-r ${getColorClasses(f.color)} text-white shadow-lg`
                    : 'bg-white/20 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-gray-600/30 backdrop-blur-sm'
                }`}
              >
                <motion.span
                  animate={filter.status === f.id ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {f.icon}
                </motion.span>
                <span>{f.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 neural-text">
            Tipo de Préstamo
          </h4>
          <div className="flex flex-wrap gap-2">
            {types.map((t, index) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter({ ...filter, type: t.id })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 5) * 0.1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 neural-hover ${
                  filter.type === t.id
                    ? `bg-gradient-to-r ${getColorClasses(t.color)} text-white shadow-lg`
                    : 'bg-white/20 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-gray-600/30 backdrop-blur-sm'
                }`}
              >
                <motion.span
                  animate={filter.type === t.id ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {t.icon}
                </motion.span>
                <span>{t.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </AdvancedGlassCard>
  );
};

export default function LoanManagerDashboard() {
  const { t } = useTranslation();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filter, setFilter] = useState({ status: 'todos', type: 'todos', search: '' });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Datos simulados
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoans([
        {
          id: 1,
          title: 'Préstamo para Certificación Blockchain',
          type: 'Educativo',
          status: 'Activo',
          amount: 5000,
          remaining: 3200,
          interestRate: 8.5,
          duration: 12,
          startDate: '2024-01-15',
          dueDate: '2024-12-15',
          nextPayment: 450,
          description: 'Préstamo para obtener certificación en desarrollo de smart contracts y dApps en Ethereum.'
        },
        {
          id: 2,
          title: 'Financiamiento para Proyecto DeFi',
          type: 'Emprendimiento',
          status: 'Pendiente',
          amount: 15000,
          remaining: 15000,
          interestRate: 12.0,
          duration: 18,
          startDate: '2024-03-01',
          dueDate: '2025-08-01',
          nextPayment: null,
          description: 'Financiamiento para desarrollar un protocolo DeFi innovador con yield farming y staking.'
        },
        {
          id: 3,
          title: 'Préstamo para Investigación en IA',
          type: 'Investigación',
          status: 'Activo',
          amount: 8000,
          remaining: 1200,
          interestRate: 6.5,
          duration: 24,
          startDate: '2023-09-01',
          dueDate: '2025-08-01',
          nextPayment: 300,
          description: 'Financiamiento para investigación en inteligencia artificial aplicada a oráculos blockchain.'
        },
        {
          id: 4,
          title: 'Desarrollo de Plataforma Educativa',
          type: 'Desarrollo',
          status: 'Completado',
          amount: 3000,
          remaining: 0,
          interestRate: 7.0,
          duration: 6,
          startDate: '2023-12-01',
          dueDate: '2024-05-01',
          nextPayment: null,
          description: 'Préstamo para desarrollar una plataforma educativa de blockchain con cursos interactivos.'
        },
        {
          id: 5,
          title: 'Certificación en Seguridad Web3',
          type: 'Certificación',
          status: 'Activo',
          amount: 2500,
          remaining: 1800,
          interestRate: 9.0,
          duration: 8,
          startDate: '2024-02-01',
          dueDate: '2024-09-01',
          nextPayment: 250,
          description: 'Financiamiento para certificación en auditoría de seguridad de smart contracts.'
        },
        {
          id: 6,
          title: 'Proyecto de NFT Marketplace',
          type: 'Emprendimiento',
          status: 'Rechazado',
          amount: 20000,
          remaining: 20000,
          interestRate: 15.0,
          duration: 36,
          startDate: '2024-01-01',
          dueDate: '2026-12-01',
          nextPayment: null,
          description: 'Financiamiento para crear un marketplace de NFTs con funcionalidades avanzadas.'
        }
      ]);
      setLoading(false);
    }, 1500);

    // Mostrar alerta después de 4 segundos
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filteredLoans = loans.filter(loan =>
    (filter.status === 'todos' || loan.status === filter.status) &&
    (filter.type === 'todos' || loan.type === filter.type) &&
    (loan.title.toLowerCase().includes(filter.search.toLowerCase()) || 
     loan.description.toLowerCase().includes(filter.search.toLowerCase()))
  );

  const handleMakePayment = (loanId, amount) => {
    // Simular pago
    setLoans(loans.map(loan => 
      loan.id === loanId 
        ? { ...loan, remaining: Math.max(0, loan.remaining - amount) }
        : loan
    ));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="loans" particleCount={60} waveCount={10} intensity="high" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-white/20 dark:border-gray-700/20 mb-6 neural-hover"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="mr-2"
              >
                💰
              </motion.span>
              Préstamos Neurales
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="neural-text neural-text-glow">
                Loans
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
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0 leading-relaxed"
            >
              Gestiona tus préstamos DeFi de manera inteligente con tecnología blockchain avanzada. 
              Accede a financiamiento para educación, desarrollo y emprendimiento con las mejores tasas del mercado.
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatedLoansStats 
              label="Préstamos Activos" 
              value={loans.filter(l => l.status === 'Activo').length} 
              icon="✅" 
              delay={1.0}
              color="green"
            />
            <AnimatedLoansStats 
              label="Total Prestado" 
              value={`$${loans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}`} 
              icon="💰" 
              delay={1.1}
              color="blue"
            />
            <AnimatedLoansStats 
              label="Saldo Restante" 
              value={`$${loans.reduce((sum, l) => sum + l.remaining, 0).toLocaleString()}`} 
              icon="📊" 
              delay={1.2}
              color="orange"
            />
            <AnimatedLoansStats 
              label="Tasa Promedio" 
              value={`${(loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length).toFixed(1)}%`} 
              icon="📈" 
              delay={1.3}
              color="purple"
            />
          </div>
        </motion.div>

        {/* Alert */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <AdvancedGlassCard variant="default" className="p-4">
                <div className="flex items-center gap-4">
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💰
                  </motion.span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white neural-text">
                      Nuevo préstamo disponible
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Préstamo para desarrollo de dApps con tasa preferencial del 5.5%.
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
          <LoansFilters filter={filter} setFilter={setFilter} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loans List */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="neural-loading"
                      >
                        <AdvancedGlassCard variant="loans" className="p-6">
                          <div className="animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        </AdvancedGlassCard>
                      </motion.div>
                    ))}
                  </div>
                ) : filteredLoans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <AdvancedGlassCard variant="default" className="p-12">
                      <motion.div
                        className="text-8xl mb-6"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        💰
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-3 neural-text">
                        No se encontraron préstamos
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 text-lg">
                        Intenta ajustar los filtros o solicita un nuevo préstamo.
                      </p>
                    </AdvancedGlassCard>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredLoans.map((loan, index) => (
                      <motion.div
                        key={loan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <LoanCard
                          loan={loan}
                          onSelect={setSelectedLoan}
                          isSelected={selectedLoan?.id === loan.id}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Loan Details */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {selectedLoan ? (
                  <LoanDetails
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                    onMakePayment={handleMakePayment}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdvancedGlassCard variant="details" className="p-8 text-center">
                      <motion.div
                        className="text-6xl mb-6"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatDelay: 2
                        }}
                      >
                        💰
                      </motion.div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 neural-text">
                        Selecciona un préstamo
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Haz clic en un préstamo para ver sus detalles completos, 
                        realizar pagos y gestionar tu financiamiento.
                      </p>
                      <motion.div
                        className="mt-6 flex justify-center"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mx-1"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full mx-1"></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mx-1"></div>
                      </motion.div>
                    </AdvancedGlassCard>
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