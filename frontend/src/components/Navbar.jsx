import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.svg?react';
import ReownWalletConnect from './ReownWalletConnect';

// Componente de menú desplegable simple
const DropdownNavLink = ({ link, isActive, onClick, themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
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

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + (rect.width / 2)
      });
    }
  }, [isOpen]);

  const hasActiveSubmenu = link.submenu?.some(subLink => location.pathname === subLink.to);

  return (
    <>
      <button
        ref={buttonRef}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          hasActiveSubmenu || isOpen
            ? themeMode === 'dark'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-600 text-white'
            : themeMode === 'dark'
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm">{link.icon}</span>
        <span className="hidden lg:block">{link.label}</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`fixed min-w-[200px] rounded-lg shadow-xl border z-[9999] overflow-hidden ${
            themeMode === 'dark'
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          {link.submenu.map((subLink) => (
            <Link
              key={subLink.to}
              to={subLink.to}
              onClick={() => {
                onClick(subLink.to);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                location.pathname === subLink.to
                  ? themeMode === 'dark'
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-blue-600 bg-blue-50'
                  : themeMode === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{subLink.icon}</span>
              <span>{subLink.label}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

// Componente de enlace de navegación simple
const NavLink = ({ link, isActive, onClick, isMobile = false, themeMode }) => {
  return (
    <Link
      to={link.to}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActive
          ? themeMode === 'dark'
            ? 'bg-blue-600 text-white'
            : 'bg-blue-600 text-white'
          : themeMode === 'dark'
            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className="text-sm">{link.icon}</span>
      <span className={isMobile ? 'block' : 'hidden lg:block'}>
        {link.label}
      </span>
    </Link>
  );
};

// Componente de selector de idioma simple
const LanguageSelector = ({ i18n, themeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!i18n) {
    return null;
  }

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          themeMode === 'dark'
            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:block text-xs font-bold">
          {currentLang.code.toUpperCase()}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 right-0 min-w-[140px] rounded-lg shadow-lg border z-50 overflow-hidden ${
          themeMode === 'dark'
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ${
                currentLanguage === lang.code
                  ? themeMode === 'dark'
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-blue-600 bg-blue-50'
                  : themeMode === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de toggle de tema simple
const ThemeToggle = ({ themeMode, setThemeMode }) => {
  const handleThemeChange = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={handleThemeChange}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        themeMode === 'dark'
          ? 'text-yellow-400 hover:bg-gray-700'
          : 'text-yellow-600 hover:bg-gray-100'
      }`}
      aria-label="Toggle theme"
    >
      <span className="text-lg">
        {themeMode === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default function Navbar({ themeMode, setThemeMode }) {
  const { user, login, loginWallet, logout, error, loading } = useAuthContext();
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

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

  const handleNavClick = (to) => {
    setShowMenu(false);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 w-full border-b ${
        themeMode === 'dark'
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          {/* All elements centered as one block */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <Logo className="h-8 w-8" />
              <span className={`font-bold text-xl ${
                themeMode === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                BrainSafes
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => (
                <div key={link.to || link.label}>
                  {link.hasSubmenu ? (
                    <DropdownNavLink
                      link={link}
                      onClick={handleNavClick}
                      themeMode={themeMode}
                    />
                  ) : (
                    <NavLink
                      link={link}
                      isActive={location.pathname === link.to}
                      onClick={() => handleNavClick(link.to)}
                      themeMode={themeMode}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              {i18n && <LanguageSelector i18n={i18n} themeMode={themeMode} />}

              {/* Theme Toggle */}
              <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />

              {/* Wallet Connect - Desktop */}
              <div className="hidden md:block">
                <ReownWalletConnect />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${
                  themeMode === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Toggle menu"
              >
                <span className="text-xl">
                  {showMenu ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMenu && (
          <div className={`lg:hidden fixed top-16 left-0 right-0 z-30 border-t ${
            themeMode === 'dark' 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <div key={link.to || link.label}>
                  {link.hasSubmenu ? (
                    <div className="space-y-1">
                      <div className={`text-sm font-semibold px-3 py-2 ${
                        themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {link.label}
                      </div>
                      {link.submenu.map((subLink) => (
                        <div key={subLink.to} className="ml-4">
                          <NavLink
                            link={subLink}
                            isActive={location.pathname === subLink.to}
                            onClick={() => handleNavClick(subLink.to)}
                            isMobile={true}
                            themeMode={themeMode}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NavLink
                      link={link}
                      isActive={location.pathname === link.to}
                      onClick={() => handleNavClick(link.to)}
                      isMobile={true}
                      themeMode={themeMode}
                    />
                  )}
                </div>
              ))}
              
              {/* Mobile Wallet Connect */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-center">
                  <ReownWalletConnect />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    
    {/* Spacer to compensate for fixed navbar */}
    <div className="h-16"></div>
    </>
  );
} 