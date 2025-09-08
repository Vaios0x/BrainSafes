import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.svg?react';
import ReownWalletConnect from './ReownWalletConnect';

// Componente de partículas neurales avanzadas para el navbar
const AdvancedNavbarParticles = ({ themeMode }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      color: themeMode === 'dark' 
        ? ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
        : ['#1e40af', '#7c3aed', '#0891b2', '#059669', '#d97706'][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);
  }, [themeMode]);

  return (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Partículas principales */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Líneas de conexión neural */}
      {particles.slice(0, 8).map((particle, i) => (
        <motion.div
          key={`connection-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-current to-transparent"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: '60px',
            transformOrigin: 'left center',
            color: particle.color,
            opacity: 0.4,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      {/* Ondas de energía */}
      {[...Array(3)].map((_, i) => (
      <motion.div
          key={`wave-${i}`}
          className="absolute rounded-full"
        style={{
            left: `${20 + i * 30}%`,
            top: '50%',
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            background: `radial-gradient(circle, ${
              themeMode === 'dark' 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(30, 64, 175, 0.1)'
            } 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
        }}
        animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
            duration: 8 + i * 2,
          repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut",
        }}
      />
    ))}
  </div>
);
};

// Componente de gradiente dinámico
const DynamicGradient = ({ themeMode, scrollY }) => {
  const gradientOpacity = useTransform(scrollY, [0, 100], [0.1, 0.3]);
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: gradientOpacity }}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${
        themeMode === 'dark'
          ? 'from-blue-500/10 via-purple-500/10 to-cyan-500/10'
          : 'from-blue-600/10 via-purple-600/10 to-cyan-600/10'
      }`} />
      <div className={`absolute inset-0 bg-gradient-to-l ${
        themeMode === 'dark'
          ? 'from-emerald-500/5 via-teal-500/5 to-blue-500/5'
          : 'from-emerald-600/5 via-teal-600/5 to-blue-600/5'
      }`} />
    </motion.div>
  );
};

// Componente de menú desplegable con submenú
const DropdownNavLink = ({ link, isActive, onClick, themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasActiveSubmenu = link.submenu?.some(subLink => location.pathname === subLink.to);
  
  // Debug: Log cuando se abre/cierra el dropdown
  useEffect(() => {
    if (isOpen) {
      console.log('Dropdown abierto para:', link.label);
    }
  }, [isOpen, link.label]);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="flex-shrink-0"
      >
        <button
          className={`relative flex items-center space-x-2 px-5 py-4 rounded-xl text-sm font-medium transition-all duration-500 overflow-hidden group ${
            hasActiveSubmenu || isOpen
              ? 'text-white shadow-2xl font-bold'
              : themeMode === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => {
            console.log('Click en Services, estado actual:', isOpen);
            console.log('Cambiando a:', !isOpen);
            setIsOpen(!isOpen);
          }}
          style={{
            background: hasActiveSubmenu || isOpen
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(139, 92, 246, 1) 100%)'
              : themeMode === 'dark'
                ? 'rgba(17, 24, 39, 0.4)'
                : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(20px)',
            border: hasActiveSubmenu || isOpen
              ? '1px solid rgba(59, 130, 246, 0.3)'
              : themeMode === 'dark'
                ? '1px solid rgba(75, 85, 99, 0.3)'
                : '1px solid rgba(229, 231, 235, 0.3)',
            boxShadow: hasActiveSubmenu || isOpen
              ? '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : themeMode === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* Efecto de brillo en hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />

          <motion.span
            animate={{ 
              rotate: isHovered ? [0, 15, -15, 0] : 0,
              scale: isHovered ? 1.2 : 1,
              filter: isHovered ? 'brightness(1.2)' : 'brightness(1)'
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="text-sm relative z-10"
          >
            {link.icon}
          </motion.span>
          
          <span className="font-medium relative z-10 hidden xl:block">
            {link.label}
          </span>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs relative z-10"
          >
            {isOpen ? '▲' : '▼'}
          </motion.span>
        </button>
      </motion.div>

      {/* Submenú desplegable */}
      <AnimatePresence>
        {isOpen && (
          console.log('Renderizando dropdown para:', link.label) || (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute top-full mt-3 left-0 min-w-[280px] rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              zIndex: 99999,
              background: themeMode === 'dark'
                ? 'rgba(17, 24, 39, 1)'
                : 'rgba(255, 255, 255, 1)',
              backdropFilter: 'blur(20px)',
              border: themeMode === 'dark'
                ? '2px solid rgba(59, 130, 246, 0.8)'
                : '2px solid rgba(59, 130, 246, 0.8)',
              boxShadow: themeMode === 'dark'
                ? '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 25px 50px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            {link.submenu.map((subLink, index) => (
              <motion.div
                key={subLink.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={subLink.to}
                  onClick={() => {
                    onClick(subLink.to);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 px-6 py-5 text-left text-base font-medium transition-all duration-300 relative overflow-hidden ${
                    location.pathname === subLink.to
                      ? themeMode === 'dark'
                        ? 'text-blue-400 bg-blue-500/20'
                        : 'text-blue-600 bg-blue-50'
                      : themeMode === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                  }`}
                >
                  {/* Efecto de brillo para opción activa */}
                  {location.pathname === subLink.to && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  
                  <motion.span 
                    className="text-xl relative z-10"
                    animate={{ 
                      scale: location.pathname === subLink.to ? 1.1 : 1,
                      rotate: location.pathname === subLink.to ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.5, repeat: location.pathname === subLink.to ? Infinity : 0 }}
                  >
                    {subLink.icon}
                  </motion.span>
                  
                  <span className="relative z-10">{subLink.label}</span>
                  
                  {/* Indicador de selección */}
                  {location.pathname === subLink.to && (
                    <motion.div
                      className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de enlace de navegación con glassmorphism avanzado
const AnimatedNavLink = ({ link, isActive, onClick, isMobile = false, themeMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex-shrink-0"
    >
      <Link
        to={link.to}
        className={`relative flex items-center space-x-2 px-5 py-4 rounded-xl text-sm font-medium transition-all duration-500 overflow-hidden group ${
          isActive
            ? 'text-white shadow-2xl'
            : isMobile 
              ? 'text-white hover:text-white/90'
              : themeMode === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={onClick}
        style={{
          background: isActive 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)'
            : isMobile
              ? 'rgba(255, 255, 255, 0.1)'
              : themeMode === 'dark'
                ? 'rgba(17, 24, 39, 0.4)'
                : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          border: isActive 
            ? '1px solid rgba(59, 130, 246, 0.3)'
            : isMobile
              ? '1px solid rgba(255, 255, 255, 0.2)'
              : themeMode === 'dark'
                ? '1px solid rgba(75, 85, 99, 0.3)'
                : '1px solid rgba(229, 231, 235, 0.3)',
          boxShadow: isActive 
            ? '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : isMobile
              ? '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : themeMode === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* Efecto de brillo en hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        {/* Efecto de partículas en hover */}
        {isHovered && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: '50%',
                }}
                animate={{
                  y: [-10, -20, -10],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        )}

        <motion.span
          animate={{ 
            rotate: isHovered ? [0, 15, -15, 0] : 0,
            scale: isHovered ? 1.2 : 1,
            filter: isHovered ? 'brightness(1.2)' : 'brightness(1)'
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-sm relative z-10"
        >
          {link.icon}
        </motion.span>
        
        <motion.span 
          className={`font-medium relative z-10 ${
            isMobile ? 'block' : 'hidden xl:block'
          }`}
          animate={{
            x: isHovered ? 2 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {link.label}
        </motion.span>
        
        {/* Indicador activo con efecto neural */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 rounded-2xl -z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}

        {/* Efecto de pulso para enlaces activos */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </Link>
    </motion.div>
  );
};

// Componente de selector de idioma con glassmorphism avanzado
const LanguageSelectorV2 = ({ i18n, themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);

  // Verificar que i18n esté disponible
  if (!i18n) {
    return null;
  }

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = i18n.language || 'es';
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center space-x-2 px-5 py-4 rounded-xl text-sm font-medium transition-all duration-500 overflow-hidden"
        style={{
          background: themeMode === 'dark'
            ? 'rgba(17, 24, 39, 0.6)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          border: themeMode === 'dark'
            ? '1px solid rgba(75, 85, 99, 0.4)'
            : '1px solid rgba(229, 231, 235, 0.4)',
          boxShadow: themeMode === 'dark'
            ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          color: themeMode === 'dark' ? 'white' : 'rgb(17, 24, 39)'
        }}
      >
        {/* Efecto de brillo en hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        <motion.span 
          className="text-lg relative z-10"
          animate={{ 
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? [0, 5, -5, 0] : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {currentLang.flag}
        </motion.span>
        
        <span className="hidden sm:block text-xs font-bold relative z-10">
          {currentLang.code.toUpperCase()}
        </span>
        
        <motion.span
          animate={{ 
            rotate: isOpen ? 180 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
          className="text-xs relative z-10"
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute top-full mt-3 right-0 min-w-[160px] rounded-2xl shadow-2xl border z-50 overflow-hidden"
            style={{
              background: themeMode === 'dark'
                ? 'rgba(17, 24, 39, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: themeMode === 'dark'
                ? '1px solid rgba(75, 85, 99, 0.5)'
                : '1px solid rgba(229, 231, 235, 0.5)',
              boxShadow: themeMode === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            {languages.map((lang, index) => (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-4 text-left text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                  currentLanguage === lang.code
                    ? themeMode === 'dark'
                      ? 'text-blue-400 bg-blue-500/20'
                      : 'text-blue-600 bg-blue-50'
                    : themeMode === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
              >
                {/* Efecto de brillo para opción activa */}
                {currentLanguage === lang.code && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                
                <motion.span 
                  className="text-lg relative z-10"
                  animate={{ 
                    scale: currentLanguage === lang.code ? 1.1 : 1,
                    rotate: currentLanguage === lang.code ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ duration: 0.5, repeat: currentLanguage === lang.code ? Infinity : 0 }}
                >
                  {lang.flag}
                </motion.span>
                
                <span className="relative z-10">{lang.name}</span>
                
                {/* Indicador de selección */}
                {currentLanguage === lang.code && (
                  <motion.div
                    className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de toggle de tema con glassmorphism avanzado
const ThemeToggle = ({ themeMode, setThemeMode }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleThemeChange = () => {
    setIsAnimating(true);
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleThemeChange}
      className="relative p-4 rounded-xl transition-all duration-500 overflow-hidden"
      style={{
        background: themeMode === 'dark'
          ? 'rgba(17, 24, 39, 0.6)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)',
        border: themeMode === 'dark'
          ? '1px solid rgba(75, 85, 99, 0.4)'
          : '1px solid rgba(229, 231, 235, 0.4)',
        boxShadow: themeMode === 'dark'
          ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        color: themeMode === 'dark' ? '#fbbf24' : '#f59e0b'
      }}
      aria-label="Toggle theme"
    >
      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Efecto de partículas durante la animación */}
      {isAnimating && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400/60 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 100],
                y: [0, (Math.random() - 0.5) * 100],
                opacity: [1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        animate={{ 
          rotate: isAnimating ? 360 : 0,
          scale: isAnimating ? 1.3 : (isHovered ? 1.1 : 1),
          filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 8px currentColor)' : 'brightness(1)'
        }}
        transition={{ 
          duration: isAnimating ? 0.8 : 0.3, 
          ease: "easeInOut" 
        }}
        className="text-xl relative z-10"
      >
        {themeMode === 'dark' ? '🌙' : '☀️'}
      </motion.div>
      
      {/* Efecto de aura durante la animación */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: themeMode === 'dark'
            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
        }}
        animate={{ 
          opacity: isAnimating ? [0, 0.8, 0] : 0,
          scale: isAnimating ? [1, 1.5, 1] : 1
        }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Efecto de pulso para tema oscuro */}
      {themeMode === 'dark' && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)'
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.button>
  );
};

export default function Navbar({ themeMode, setThemeMode }) {
  const { user, login, loginWallet, logout, error, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const navbarBackground = useTransform(
    scrollY,
    [0, 100],
    [0, 0.8]
  );

  const navLinks = [
    { to: '/', label: t('home'), icon: '🏠' },
    { to: '/dashboard', label: t('dashboard'), icon: '📊' },
    { to: '/marketplace', label: 'marketplace', icon: '🛒' },
    { 
      label: 'Services', 
      icon: '⚙️', 
      hasSubmenu: true,
      submenu: [
        { to: '/community', label: t('community'), icon: '👥' },
    { to: '/learning', label: 'learning', icon: '📚' },
    { to: '/support', label: 'support', icon: '💬' },
      ]
    },
    { to: '/mentoring', label: t('mentoring'), icon: '🎓' },
    { to: '/loans', label: t('loans'), icon: '💰' },
    { to: '/profile', label: t('profile'), icon: '👤' },
  ];

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleNavClick = (to) => {
    setShowMenu(false);
  };

  return (
    <motion.nav
      style={{
        background: useTransform(
          scrollY,
          [0, 100],
          themeMode === 'dark' 
            ? [
                'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.6) 100%)',
                'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)'
              ]
            : [
                'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 252, 0.6) 100%)',
                'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
              ]
        ),
        backdropFilter: useTransform(
          scrollY,
          [0, 100],
          ['blur(20px)', 'blur(30px)']
        ),
        border: useTransform(
          scrollY,
          [0, 100],
          themeMode === 'dark'
            ? ['1px solid rgba(75, 85, 99, 0.2)', '1px solid rgba(75, 85, 99, 0.4)']
            : ['1px solid rgba(229, 231, 235, 0.3)', '1px solid rgba(229, 231, 235, 0.5)']
        ),
        boxShadow: useTransform(
          scrollY,
          [0, 100],
          themeMode === 'dark'
            ? [
                '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                '0 8px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              ]
            : [
                '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                '0 8px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
              ]
        )
      }}
      className="sticky top-0 z-50 w-full"
    >
      {/* Efectos neurales avanzados */}
      <AdvancedNavbarParticles themeMode={themeMode} />
      
      {/* Gradiente dinámico */}
      <DynamicGradient themeMode={themeMode} scrollY={scrollY} />
      
      <div className="max-w-[1600px] mx-auto px-8 sm:px-10 lg:px-20 relative z-10 navbar-container">
        <div className="flex justify-between items-center h-20 min-w-0">
          {/* Logo con glassmorphism */}
          <motion.div 
            className="flex-shrink-0 flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center space-x-4 group">
              <motion.div
                className="relative p-3 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{
                  background: themeMode === 'dark'
                    ? 'rgba(17, 24, 39, 0.4)'
                    : 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(20px)',
                  border: themeMode === 'dark'
                    ? '1px solid rgba(75, 85, 99, 0.3)'
                    : '1px solid rgba(229, 231, 235, 0.3)',
                  boxShadow: themeMode === 'dark'
                    ? '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                {/* Efecto de brillo en hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                
                <Logo className="h-8 w-8 relative z-10" />
              </motion.div>
              
              <motion.span 
                className="font-bold text-xl hidden sm:block relative"
                whileHover={{ scale: 1.02 }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                }}
              >
            BrainSafes
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Centrado con glassmorphism mejorado */}
          <motion.div 
            className="hidden lg:flex items-center justify-center flex-1 px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="flex items-center space-x-6 max-w-7xl py-5 px-4 rounded-2xl"
              style={{
                background: themeMode === 'dark'
                  ? 'rgba(17, 24, 39, 0.4)'
                  : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                border: themeMode === 'dark'
                  ? '1px solid rgba(75, 85, 99, 0.3)'
                  : '1px solid rgba(229, 231, 235, 0.3)',
                boxShadow: themeMode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.to || link.label}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  {link.hasSubmenu ? (
                    <DropdownNavLink
                      link={link}
                      onClick={handleNavClick}
                      themeMode={themeMode}
                    />
                  ) : (
                  <AnimatedNavLink
                    link={link}
                    isActive={location.pathname === link.to}
                    onClick={() => handleNavClick(link.to)}
                      themeMode={themeMode}
                  />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side controls con glassmorphism mejorado */}
          <motion.div 
            className="flex items-center space-x-4 flex-shrink-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Language Selector */}
            {i18n && <LanguageSelectorV2 key={`lang-${i18n.language || 'es'}`} i18n={i18n} themeMode={themeMode} />}

            {/* Theme Toggle */}
            <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />

            {/* Wallet Connect */}
            <div className="hidden md:block">
              <ReownWalletConnect />
            </div>

            {/* Mobile menu button con glassmorphism */}
            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className="lg:hidden relative p-4 rounded-xl transition-all duration-500 overflow-hidden"
              style={{
                background: themeMode === 'dark'
                  ? 'rgba(17, 24, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                border: themeMode === 'dark'
                  ? '1px solid rgba(75, 85, 99, 0.4)'
                  : '1px solid rgba(229, 231, 235, 0.4)',
                boxShadow: themeMode === 'dark'
                  ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                color: themeMode === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(75, 85, 99)'
              }}
              aria-label="Toggle menu"
            >
              {/* Efecto de brillo en hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              
              <motion.div
                animate={{ 
                  rotate: showMenu ? 180 : 0,
                  scale: showMenu ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
                className="text-xl relative z-10"
              >
                {showMenu ? '✕' : '☰'}
              </motion.div>
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Navigation con glassmorphism avanzado */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden"
            >
              <motion.div 
                className="px-4 pt-4 pb-6 space-y-3 mt-2 rounded-2xl mx-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  background: themeMode === 'dark'
                    ? 'rgba(17, 24, 39, 0.8)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(30px)',
                  border: themeMode === 'dark'
                    ? '1px solid rgba(75, 85, 99, 0.3)'
                    : '1px solid rgba(229, 231, 235, 0.3)',
                  boxShadow: themeMode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                {/* Efectos neurales para el menú móvil */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        backgroundColor: themeMode === 'dark' ? '#3b82f6' : '#1e40af',
                        opacity: 0.6
                      }}
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                </div>

                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.to || link.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  >
                    {link.hasSubmenu ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-400 px-3 py-2">
                          {link.label}
                        </div>
                        {link.submenu.map((subLink, subIndex) => (
                          <motion.div
                            key={subLink.to}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + subIndex * 0.1 }}
                            className="ml-4"
                          >
                            <AnimatedNavLink
                              link={subLink}
                              isActive={location.pathname === subLink.to}
                              onClick={() => handleNavClick(subLink.to)}
                              isMobile={true}
                              themeMode={themeMode}
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                    <AnimatedNavLink
                      link={link}
                      isActive={location.pathname === link.to}
                      onClick={() => handleNavClick(link.to)}
                      isMobile={true}
                        themeMode={themeMode}
                    />
                    )}
                  </motion.div>
                ))}
                
                {/* Mobile Wallet Connect con glassmorphism */}
                <motion.div 
                  className="pt-4 mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  style={{
                    borderTop: themeMode === 'dark'
                      ? '1px solid rgba(75, 85, 99, 0.3)'
                      : '1px solid rgba(229, 231, 235, 0.3)'
                  }}
                >
                  <div className="relative">
                    {/* Efecto de brillo para el wallet connect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="relative z-10">
                  <ReownWalletConnect />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
} 