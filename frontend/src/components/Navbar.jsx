import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Logo.svg?react';
import { 
  Switch, 
  FormControlLabel, 
  MenuItem, 
  Select, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  useTheme, 
  useMediaQuery,
  Box,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import SecurityIcon from '@mui/icons-material/Security';
import SchoolIcon from '@mui/icons-material/School';
import SupportIcon from '@mui/icons-material/Support';
import GroupIcon from '@mui/icons-material/Group';
import MentorIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReownWalletConnect from './ReownWalletConnect';

export default function Navbar({ themeMode, setThemeMode }) {
  const { user, login, loginWallet, logout, error, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleThemeChange = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { to: '/', label: t('home'), icon: null },
    { to: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { to: '/marketplace', label: 'marketplace', icon: <StoreIcon /> },
    { to: '/security', label: 'security', icon: <SecurityIcon /> },
    { to: '/learning', label: 'learning', icon: <SchoolIcon /> },
    { to: '/support', label: 'support', icon: <SupportIcon /> },
    { to: '/community', label: t('community'), icon: <GroupIcon /> },
    { to: '/mentoring', label: t('mentoring'), icon: <MentorIcon /> },
    { to: '/loans', label: t('loans'), icon: <AccountBalanceIcon /> },
    { to: '/profile', label: t('profile'), icon: <PersonIcon /> },
    { to: '/admin', label: t('admin'), icon: <AdminPanelSettingsIcon /> },
  ];

  // Agregar wallet como elemento especial en mobile
  const mobileNavLinks = isMobile ? [
    ...navLinks,
    { to: 'wallet', label: 'Connect Wallet', icon: <AccountBalanceWalletIcon />, isWallet: true }
  ] : navLinks;

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleNavClick = (to) => {
    setShowMenu(false);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: themeMode === 'dark' ? '#222' : '#fff',
        color: themeMode === 'dark' ? '#fff' : '#222',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 100,
      }}
    >
      <Toolbar 
        sx={{
          padding: isSmallMobile ? '8px 16px' : '8px 24px',
          minHeight: { xs: 56, sm: 64 },
          justifyContent: 'space-between',
        }}
      >
        {/* Logo and Brand */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            textDecoration: 'none',
            minWidth: isSmallMobile ? 120 : 160 
          }} 
          aria-label="Ir a inicio"
        >
          <Logo width={isSmallMobile ? 28 : 36} height={isSmallMobile ? 28 : 36} style={{ display: 'block' }} />
          <Typography 
            variant={isSmallMobile ? "h6" : "h5"}
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main, 
              letterSpacing: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            BrainSafes
          </Typography>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box 
            component="nav"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 0,
              mx: 2,
            }}
          >
            <Box
              component="ul"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                width: '100%',
              }}
            >
              {navLinks.slice(1, 7).map(({ to, label }) => (
                <Box component="li" key={to} sx={{ flex: 1, textAlign: 'center', minWidth: 90 }}>
                  <Link
                    to={to}
                    aria-current={location.pathname === to ? 'page' : undefined}
                    tabIndex={0}
                    style={{
                      fontWeight: 500,
                      position: 'relative',
                      padding: '8px 12px',
                      borderBottom: location.pathname === to ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      fontSize: 14,
                      width: '100%',
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {label}
                  </Link>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Right side controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Wallet Connect - Solo visible en desktop */}
          {!isMobile && <ReownWalletConnect onConnect={() => {}} />}
          
          {!isSmallMobile && (
            <>
              <Select
                value={i18n.language}
                onChange={e => i18n.changeLanguage(e.target.value)}
                aria-label="Selector de idioma"
                size="small"
                sx={{
                  background: themeMode === 'dark' ? '#333' : '#f3f3f3',
                  color: themeMode === 'dark' ? '#fff' : '#222',
                  borderRadius: 1,
                  fontWeight: 500,
                  minWidth: 60,
                }}
              >
                <MenuItem value="es">ES</MenuItem>
                <MenuItem value="en">EN</MenuItem>
              </Select>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={themeMode === 'dark'} 
                    onChange={handleThemeChange} 
                    color="primary" 
                    inputProps={{ 'aria-label': 'Cambiar tema claro/oscuro' }} 
                  />
                }
                label={themeMode === 'dark' ? '🌙' : '☀️'}
                sx={{ 
                  marginLeft: 1,
                  color: themeMode === 'dark' ? '#fff' : '#222',
                  '& .MuiFormControlLabel-label': {
                    fontSize: 16,
                  }
                }}
              />
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton 
              onClick={() => setShowMenu(true)} 
              color="inherit" 
              aria-label="Abrir menú"
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>

        {/* Mobile Drawer - Fixed positioning */}
        <Drawer 
          anchor="right" 
          open={showMenu} 
          onClose={handleMenuClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          PaperProps={{
            sx: {
              width: { xs: '100vw', sm: 320 },
              backgroundColor: themeMode === 'dark' ? '#232946' : '#fff',
              color: themeMode === 'dark' ? '#fff' : '#222',
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              zIndex: 1200,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
            },
            zIndex: 1200
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: themeMode === 'dark' ? '#1a1a2e' : '#f8f9fa'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Menú
            </Typography>
            <IconButton 
              onClick={handleMenuClose} 
              color="inherit"
              sx={{ 
                p: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Navigation List */}
          <Box sx={{ flex: 1 }}>
            <List sx={{ pt: 1, pb: 1 }}>
              {mobileNavLinks.map(({ to, label, icon, isWallet }) => (
                <ListItem 
                  button 
                  key={to} 
                  component={isWallet ? 'div' : Link} 
                  to={isWallet ? undefined : to} 
                  onClick={isWallet ? undefined : () => handleNavClick(to)} 
                  selected={!isWallet && location.pathname === to}
                  sx={{
                    py: 1.5,
                    px: 2,
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light + '20',
                      borderLeft: `3px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light + '30',
                      }
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    '&:active': {
                      backgroundColor: theme.palette.action.selected,
                    }
                  }}
                >
                  {icon && (
                    <ListItemIcon sx={{ 
                      minWidth: 40, 
                      color: 'inherit',
                      opacity: (!isWallet && location.pathname === to) ? 1 : 0.7
                    }}>
                      {icon}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={isWallet ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ReownWalletConnect onConnect={handleMenuClose} />
                      </Box>
                    ) : label} 
                    primaryTypographyProps={{
                      fontSize: 16,
                      fontWeight: (!isWallet && location.pathname === to) ? 600 : 400,
                      color: (!isWallet && location.pathname === to) ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          
          

          {/* Settings Section */}
          <Box 
            sx={{ 
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: themeMode === 'dark' ? '#1a1a2e' : '#f8f9fa'
            }}
          >
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7, fontWeight: 500 }}>
              Configuración
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Idioma</Typography>
              <Select
                value={i18n.language}
                onChange={e => i18n.changeLanguage(e.target.value)}
                size="small"
                sx={{
                  minWidth: 80,
                  '& .MuiSelect-select': {
                    py: 0.5
                  }
                }}
              >
                <MenuItem value="es">ES</MenuItem>
                <MenuItem value="en">EN</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Tema</Typography>
              <Switch
                checked={themeMode === 'dark'}
                onChange={handleThemeChange}
                color="primary"
              />
            </Box>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
} 