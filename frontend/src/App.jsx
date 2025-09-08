import React, { Suspense, lazy, useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './components/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import NeuralBackground from './components/NeuralBackground';
import { useTheme } from './hooks/useTheme';
import { ThemeProvider } from './context/ThemeContext';

import { ToastProvider } from './components/ToastContainer';
import Dashboard from "./components/Dashboard/Dashboard";
import EnhancedAIChatWidget from './components/EnhancedAIChatWidget';
import { AppKitProvider } from './config/reown.jsx';
import { LoadingSpinner } from './components/Spinner';
import ContractStatus from './components/ContractStatus';

const Profile = lazy(() => import('./components/Profile'));
const Certificates = lazy(() => import('./components/Certificates'));
const Courses = lazy(() => import('./components/Courses'));
const BadgeGallery = lazy(() => import('./components/BadgeGallery'));
const CommunityRewardsPanel = lazy(() => import('./components/CommunityRewardsPanel'));
const MentorshipPanel = lazy(() => import('./components/MentorshipPanel'));
const LoanManagerDashboard = lazy(() => import('./components/LoanManagerDashboard'));
const GovernancePanel = lazy(() => import('./components/Governance').then(m => ({ default: m.GovernancePanel })));
const MarketplacePanel = lazy(() => import('./components/Marketplace/MarketplacePanel'));

// Nuevos componentes del Marketplace
const JobPostingManager = lazy(() => import('./components/Marketplace/JobPostingManager'));
const AIMatchingSystem = lazy(() => import('./components/Marketplace/AIMatchingSystem'));
const ReputationSystem = lazy(() => import('./components/Marketplace/ReputationSystem'));

const AIChatPanel = lazy(() => import('./components/AIChatPanel'));
const LearningPanel = lazy(() => import('./components/Learning/LearningPanel'));
const SupportPanel = lazy(() => import('./components/SupportPanel'));

// Nuevos componentes educativos
const CourseManagement = lazy(() => import('./components/Learning/CourseManagement'));
const AutomatedAssessment = lazy(() => import('./components/Learning/AutomatedAssessment'));
const CertificateNFTManager = lazy(() => import('./components/Learning/CertificateNFTManager'));
const ProgressTracker = lazy(() => import('./components/Learning/ProgressTracker'));
const ScholarshipManager = lazy(() => import('./components/Learning/ScholarshipManager'));
const AIPerformancePredictor = lazy(() => import('./components/Learning/AIPerformancePredictor'));
const ContractLearningPanel = lazy(() => import('./components/Learning/ContractLearningPanel'));

function CommunityPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="community" particleCount={50} waveCount={7} intensity="medium" />
      <div className="relative z-10 w-full mt-8">
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setTab(0)}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              tab === 0
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Recompensas
          </button>
          <button
            onClick={() => setTab(1)}
            className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              tab === 1
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Gobernanza
          </button>
        </div>
      </div>
      <div className="mt-8">
        {tab === 0 && (
          <Suspense fallback={<LoadingSpinner text="Cargando recompensas..." className="h-64" />}>
            <CommunityRewardsPanel />
          </Suspense>
        )}
        {tab === 1 && (
          <Suspense fallback={<LoadingSpinner text="Cargando gobernanza..." className="h-64" />}>
            <GovernancePanel />
          </Suspense>
        )}
      </div>
      </div>
    </div>
  );
}

export default function App() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <ThemeProvider>
      <AppKitProvider>
        <div className={`min-h-screen transition-colors duration-300 ${
          themeMode === 'dark' 
            ? 'dark bg-gray-900 text-white' 
            : 'bg-white text-gray-900'
        }`}>
          <ToastProvider>
            <Router>
              <div className="flex flex-col min-h-screen">
                <Navbar themeMode={themeMode} setThemeMode={setThemeMode} />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando dashboard..." className="h-64" />}>
                        <Dashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/certificates" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando certificados..." className="h-64" />}>
                        <Certificates />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/courses" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando cursos..." className="h-64" />}>
                        <Courses />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/badges" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando badges..." className="h-64" />}>
                        <BadgeGallery />
                      </Suspense>
                    } 
                  />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route 
                    path="/mentoring" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando mentoría..." className="h-64" />}>
                        <MentorshipPanel />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/loans" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando préstamos..." className="h-64" />}>
                        <LoanManagerDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/marketplace" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando marketplace..." className="h-64" />}>
                        <MarketplacePanel />
                      </Suspense>
                    } 
                  />
                  
                  {/* Nuevas rutas del Marketplace de Empleos */}
                  <Route 
                    path="/marketplace/jobs" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando gestión de empleos..." className="h-64" />}>
                        <JobPostingManager />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/marketplace/matching" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando matching con IA..." className="h-64" />}>
                        <AIMatchingSystem />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/marketplace/reputation" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando sistema de reputación..." className="h-64" />}>
                        <ReputationSystem />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando perfil..." className="h-64" />}>
                        <Profile />
                      </Suspense>
                    } 
                  />

                  <Route 
                    path="/learning" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando aprendizaje..." className="h-64" />}>
                        <LearningPanel />
                      </Suspense>
                    } 
                  />
                  
                  {/* Nuevas rutas educativas */}
                  <Route 
                    path="/learning/courses" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando gestión de cursos..." className="h-64" />}>
                        <CourseManagement />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/learning/assessment" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando evaluación automatizada..." className="h-64" />}>
                        <AutomatedAssessment />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/learning/certificates" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando certificados NFT..." className="h-64" />}>
                        <CertificateNFTManager />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/learning/progress" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando seguimiento de progreso..." className="h-64" />}>
                        <ProgressTracker />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/learning/scholarships" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando gestión de becas..." className="h-64" />}>
                        <ScholarshipManager />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/learning/predictions" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando predictor de rendimiento..." className="h-64" />}>
                        <AIPerformancePredictor />
                      </Suspense>
                    } 
                  />
                  
                  {/* Contract Learning Panel */}
                  <Route 
                    path="/learning/contracts" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando interacción con contratos..." className="h-64" />}>
                        <ContractLearningPanel />
                      </Suspense>
                    } 
                  />
                  
                  <Route 
                    path="/support" 
                    element={
                      <Suspense fallback={<LoadingSpinner text="Cargando soporte..." className="h-64" />}>
                        <SupportPanel />
                      </Suspense>
                    } 
                  />
                  
                  {/* Contract Status Route */}
                  <Route 
                    path="/contracts" 
                    element={
                      <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold mb-6">Contract Status</h1>
                        <ContractStatus />
                      </div>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
              <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
                <div className="pointer-events-auto">
                  <EnhancedAIChatWidget />
                </div>
              </div>
              </div>
            </Router>
          </ToastProvider>
        </div>
      </AppKitProvider>
    </ThemeProvider>
  );
}