import React, { Suspense, lazy, useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './components/AdminPanel';
import { ToastProvider } from './components/ToastContainer';
import Dashboard from "./components/Dashboard/Dashboard";
import { Tabs, Tab, Box, Button, Fade, ThemeProvider, CssBaseline } from '@mui/material';
import AIChatWidget from './components/AIChatWidget';
import { lightTheme, darkTheme } from './theme';
import { AppKitProvider } from './config/reown.jsx';

const Profile = lazy(() => import('./components/Profile'));
const Certificates = lazy(() => import('./components/Certificates'));
const Courses = lazy(() => import('./components/Courses'));
const BadgeGallery = lazy(() => import('./components/BadgeGallery'));
const CommunityRewardsPanel = lazy(() => import('./components/CommunityRewardsPanel'));
const MentorshipPanel = lazy(() => import('./components/MentorshipPanel'));
const LoanManagerDashboard = lazy(() => import('./components/LoanManagerDashboard'));
const GovernancePanel = lazy(() => import('./components/Governance').then(m => ({ default: m.GovernancePanel })));
const MarketplacePanel = lazy(() => import('./components/Marketplace/MarketplacePanel'));
const SecurityPanel = lazy(() => import('./components/Security/SecurityPanel'));
const AIChatPanel = lazy(() => import('./components/AIChatPanel'));
const LearningPanel = lazy(() => import('./components/Learning/LearningPanel'));
const SupportPanel = lazy(() => import('./components/SupportPanel'));

function CommunityPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Recompensas" />
        <Tab label="Gobernanza" />
      </Tabs>
      <Box mt={3}>
        {tab === 0 && <Suspense fallback={<div>Cargando...</div>}><CommunityRewardsPanel /></Suspense>}
        {tab === 1 && <Suspense fallback={<div>Cargando...</div>}><GovernancePanel /></Suspense>}
      </Box>
    </Box>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
  const theme = useMemo(() => (themeMode === 'dark' ? darkTheme : lightTheme), [themeMode]);
  return (
    <AppKitProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Router>
            <Navbar themeMode={themeMode} setThemeMode={setThemeMode} />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Suspense fallback={<div>Cargando...</div>}><Dashboard /></Suspense>} />
              <Route path="/certificates" element={<Suspense fallback={<div>Cargando...</div>}><Certificates /></Suspense>} />
              <Route path="/courses" element={<Suspense fallback={<div>Cargando...</div>}><Courses /></Suspense>} />
              <Route path="/badges" element={<Suspense fallback={<div>Cargando...</div>}><BadgeGallery /></Suspense>} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/mentoring" element={<Suspense fallback={<div>Cargando...</div>}><MentorshipPanel /></Suspense>} />
              <Route path="/loans" element={<Suspense fallback={<div>Cargando...</div>}><LoanManagerDashboard /></Suspense>} />
              <Route path="/marketplace" element={<Suspense fallback={<div>Cargando...</div>}><MarketplacePanel /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<div>Cargando...</div>}><Profile /></Suspense>} />
              <Route path="/security" element={<Suspense fallback={<div>Cargando...</div>}><SecurityPanel /></Suspense>} />
              <Route path="/learning" element={<Suspense fallback={<div>Cargando...</div>}><LearningPanel /></Suspense>} />
              <Route path="/support" element={<Suspense fallback={<div>Cargando...</div>}><SupportPanel /></Suspense>} />
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                  <AdminPanel />
                </ProtectedRoute>
              } />
            </Routes>
            <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000 }}>
              <AIChatWidget />
            </div>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </AppKitProvider>
  );
}