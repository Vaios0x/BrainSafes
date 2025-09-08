import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Componente de tarjeta con glassmorphism avanzado
export const AdvancedGlassCard = ({ 
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

// Componente de botón con glassmorphism
export const GlassButton = ({ 
  children, 
  className = "", 
  variant = "primary",
  size = "medium",
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: "bg-gradient-to-r from-primary-600 to-brain-600 text-white",
    secondary: "bg-white/10 backdrop-blur-sm border border-white/20 text-white",
    outline: "border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white",
    ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-white/10"
  };

  const sizes = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      className={`relative overflow-hidden rounded-2xl font-semibold transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: isHovered ? 
          "0 12px 40px rgba(0, 0, 0, 0.2)" : 
          "0 4px 16px rgba(0, 0, 0, 0.1)"
      }}
      {...props}
    >
      {/* Efecto de brillo animado */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Efecto de ripple */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isPressed ? 1 : 0, 
          opacity: isPressed ? 1 : 0 
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Contenido del botón */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {children}
      </span>
    </motion.button>
  );
};

// Componente de input con glassmorphism
export const GlassInput = ({ 
  className = "", 
  placeholder = "",
  type = "text",
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      whileFocus={{ scale: 1.02 }}
    >
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isFocused ? 
            "0 8px 32px rgba(59, 130, 246, 0.2)" : 
            "0 4px 16px rgba(0, 0, 0, 0.1)"
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {/* Efecto de focus */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 to-brain-500/10 opacity-0"
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// Componente de modal con glassmorphism
export const GlassModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title = "",
  className = "" 
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [0, -50]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${className}`}
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "24px",
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)"
        }}
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-xl">×</span>
            </motion.button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de navegación con glassmorphism
export const GlassNavigation = ({ 
  items = [], 
  activeItem = "",
  onItemClick = () => {},
  className = "" 
}) => {
  return (
    <nav 
      className={`flex items-center space-x-2 p-2 rounded-2xl ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}
    >
      {items.map((item, index) => (
        <motion.button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            activeItem === item.id
              ? "bg-white/20 text-white"
              : "text-gray-600 dark:text-gray-300 hover:text-white hover:bg-white/10"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {item.label}
        </motion.button>
      ))}
    </nav>
  );
};

// Componente de progreso con glassmorphism
export const GlassProgress = ({ 
  value = 0, 
  max = 100, 
  className = "",
  showLabel = true,
  label = ""
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-bold text-primary-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div 
        className="w-full h-3 rounded-full overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-brain-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default {
  AdvancedGlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  GlassNavigation,
  GlassProgress
};
