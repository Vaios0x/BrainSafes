import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.svg?react';
import ReownWalletConnect from './ReownWalletConnect';

// Componente de partículas para el navbar
const NavbarParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-0.5 h-0.5 bg-primary-400/30 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -15, 0],
          opacity: [0.1, 0.4, 0.1],
        }}
        transition={{
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 4,
        }}
      />
    ))}
  </div>
);

// Componente de enlace de navegación animado
const AnimatedNavLink = ({ link, isActive, onClick, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex-shrink-0"
    >
      <Link
        to={link.to}
        className={`relative flex items-center space-x-1 px-2 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
            : isMobile 
              ? 'text-white hover:text-white/80 hover:bg-white/20 backdrop-blur-sm'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm'
        }`}
        onClick={onClick}
      >
        <motion.span
          animate={{ 
            rotate: isHovered ? [0, 10, -10, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
          className="text-sm"
        >
          {link.icon}
        </motion.span>
        <span className={`font-medium ${isMobile ? 'block text-white' : 'hidden xl:block'}`}>{link.label}</span>
        
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Link>
    </motion.div>
  );
};

// Componente de selector de idioma moderno
const LanguageSelectorV2 = ({ i18n, themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  console.log('LanguageSelectorV2 render:', { currentLanguage, currentLang });

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
          themeMode === 'dark'
            ? 'bg-gray-800/80 border border-gray-700/50 text-white hover:bg-gray-700/80 backdrop-blur-sm'
            : 'bg-white/80 border border-gray-300/50 text-gray-900 hover:bg-gray-50/80 backdrop-blur-sm'
        }`}
      >
        <span className="text-lg">
          {currentLang.flag}
        </span>
        <span style={{ 
          display: 'none', 
          '@media (min-width: 640px)': { display: 'block' },
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          ES
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs"
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
            transition={{ duration: 0.2 }}
            className={`absolute top-full mt-2 right-0 min-w-[140px] rounded-xl shadow-xl border z-50 ${
              themeMode === 'dark'
                ? 'bg-gray-800/95 border-gray-700/50 backdrop-blur-md'
                : 'bg-white/95 border-gray-300/50 backdrop-blur-md'
            }`}
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                  currentLanguage === lang.code
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de toggle de tema moderno
const ThemeToggle = ({ themeMode, setThemeMode }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleThemeChange = () => {
    setIsAnimating(true);
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9, rotate: -5 }}
      onClick={handleThemeChange}
      className={`relative p-2 rounded-xl transition-all duration-300 ${
        themeMode === 'dark'
          ? 'text-yellow-400 hover:bg-gray-800/80 backdrop-blur-sm'
          : 'text-gray-600 hover:bg-gray-100/80 backdrop-blur-sm'
      }`}
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ 
          rotate: isAnimating ? 360 : 0,
          scale: isAnimating ? 1.2 : 1
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="text-xl"
      >
        {themeMode === 'dark' ? '🌙' : '☀️'}
      </motion.div>
      
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20"
        animate={{ opacity: isAnimating ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
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
    { to: '/learning', label: 'learning', icon: '📚' },
    { to: '/support', label: 'support', icon: '💬' },
    { to: '/community', label: t('community'), icon: '👥' },
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
        backgroundColor: useTransform(
          scrollY,
          [0, 100],
          themeMode === 'dark' 
            ? ['rgba(17, 24, 39, 0.8)', 'rgba(17, 24, 39, 0.95)']
            : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.95)']
        ),
        backdropFilter: useTransform(
          scrollY,
          [0, 100],
          ['blur(8px)', 'blur(16px)']
        ),
      }}
      className="sticky top-0 z-50 border-b border-white/20 dark:border-gray-700/20 shadow-lg w-full"
    >
      <NavbarParticles />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 navbar-container">
        <div className="flex justify-between items-center h-16 min-w-0">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0 flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Logo className="h-8 w-8" />
              </motion.div>
              <motion.span 
                className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent hidden sm:block"
                whileHover={{ scale: 1.02 }}
              >
                BrainSafes
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Centrado */}
          <motion.div 
            className="hidden lg:flex items-center justify-center flex-1 px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center space-x-1 max-w-2xl">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <AnimatedNavLink
                    link={link}
                    isActive={location.pathname === link.to}
                    onClick={() => handleNavClick(link.to)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side controls */}
          <motion.div 
            className="flex items-center space-x-2 flex-shrink-0"
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

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className={`lg:hidden p-3 rounded-xl transition-all duration-300 ${
                themeMode === 'dark'
                  ? 'text-gray-300 hover:bg-gray-800/80 backdrop-blur-sm'
                  : 'text-gray-600 hover:bg-gray-100/80 backdrop-blur-sm'
              }`}
              aria-label="Toggle menu"
            >
              <motion.div
                animate={{ rotate: showMenu ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl"
              >
                {showMenu ? '✕' : '☰'}
              </motion.div>
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <motion.div 
                className={`px-2 pt-2 pb-3 space-y-2 border-t ${
                  themeMode === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
                }`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    <AnimatedNavLink
                      link={link}
                      isActive={location.pathname === link.to}
                      onClick={() => handleNavClick(link.to)}
                      isMobile={true}
                    />
                  </motion.div>
                ))}
                
                {/* Mobile Wallet Connect */}
                <motion.div 
                  className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <ReownWalletConnect />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
} 