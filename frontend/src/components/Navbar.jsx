import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.svg?react';
import { Switch, FormControlLabel, MenuItem, Select, IconButton, Drawer, List, ListItem, ListItemText, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ReownWalletConnectLazy from './ReownWalletConnectLazy';

export default function Navbar({ themeMode, setThemeMode }) {
  const { user, login, loginWallet, logout, error, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleThemeChange = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/dashboard', label: t('dashboard') },
    { to: '/marketplace', label: 'marketplace' },
    { to: '/security', label: 'security' },
    { to: '/learning', label: 'learning' },
    { to: '/support', label: 'support' },
    { to: '/community', label: t('community') },
    { to: '/mentoring', label: t('mentoring') },
    { to: '/loans', label: t('loans') },
    { to: '/profile', label: t('profile') },
    { to: '/admin', label: t('admin') },
  ];

  return (
    <header style={{
      background: themeMode === 'dark' ? '#222' : '#fff',
      color: themeMode === 'dark' ? '#fff' : '#222',
      borderBottom: '1px solid #e0e0e0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
      padding: isMobile ? '0.5rem 0.5rem' : '0.5rem 2rem',
    }}>
      <nav
        role="navigation"
        aria-label="Barra de navegación principal"
        style={{
          maxWidth: '100vw',
          width: '100%',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 160 }} aria-label="Ir a inicio">
          <Logo width={36} height={36} style={{ display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: 22, color: theme.palette.primary.main, letterSpacing: 1 }}>BrainSafes</span>
        </Link>
        {isMobile ? (
          <>
            <IconButton onClick={() => setShowMenu(true)} color="inherit" aria-label="Abrir menú">
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={showMenu} onClose={() => setShowMenu(false)}>
              <List style={{ width: 220 }}>
                {navLinks.map(({ to, label }) => (
                  <ListItem button key={to} component={Link} to={to} onClick={() => setShowMenu(false)} selected={location.pathname === to}>
                    <ListItemText primary={label} />
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </>
        ) : (
          <ul
            id="navbar-menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 0,
              listStyle: 'none',
              margin: 0,
              padding: 0,
              transition: 'none',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {navLinks.map(({ to, label }) => (
              <li key={to} style={{ flex: 1, textAlign: 'center', minWidth: 90 }}>
                <Link
                  to={to}
                  aria-current={location.pathname === to ? 'page' : undefined}
                  tabIndex={0}
                  style={{
                    fontWeight: 500,
                    position: 'relative',
                    padding: isMobile ? '4px 8px' : '4px 16px',
                    borderBottom: location.pathname === to ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    transition: 'none',
                    fontSize: 16,
                    width: '100%',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ReownWalletConnectLazy />
          <Select
            value={i18n.language}
            onChange={e => i18n.changeLanguage(e.target.value)}
            aria-label="Selector de idioma"
            size="small"
            style={{ background: themeMode === 'dark' ? '#333' : '#f3f3f3', color: themeMode === 'dark' ? '#fff' : '#222', borderRadius: 4, fontWeight: 500 }}
          >
            <MenuItem value="es">ES</MenuItem>
            <MenuItem value="en">EN</MenuItem>
          </Select>
          <FormControlLabel
            control={<Switch checked={themeMode === 'dark'} onChange={handleThemeChange} color="primary" inputProps={{ 'aria-label': 'Cambiar tema claro/oscuro' }} />}
            label={themeMode === 'dark' ? '🌙' : '☀️'}
            style={{ marginLeft: 8, color: themeMode === 'dark' ? '#fff' : '#222' }}
          />
        </div>
      </nav>
    </header>
  );
} 