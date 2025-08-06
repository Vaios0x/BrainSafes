import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import MetricsSummary from "./MetricsSummary";

import AlertsPanel from "./AlertsPanel";
import QuickLinks from "./QuickLinks";
import FiltersBar from "./FiltersBar";

// Componente de partículas para el dashboard
const DashboardParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -15, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
      />
    ))}
  </div>
);

// Componente de métrica animada
const AnimatedMetric = ({ value, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(value * progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <motion.span 
      className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {count}{suffix}
    </motion.span>
  );
};

// Componente de tarjeta de estadística con glassmorphism
const StatCard = ({ icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ 
      scale: 1.05,
      y: -5,
      transition: { duration: 0.3 }
    }}
    className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-soft border border-white/20 dark:border-gray-700/20 hover:shadow-large transition-all duration-500"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          className="text-3xl group-hover:scale-110 transition-transform duration-300"
          whileHover={{ rotate: 5 }}
        >
          {icon}
        </motion.div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedMetric value={value} />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Componente de indicador de scroll
const ScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-brain-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

const filtrosIniciales = {
  fecha: "",
  tipoEvento: "all",
  usuario: "all",
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Total Transacciones', value: 1234, icon: '📊', color: 'from-blue-500 to-cyan-500' },
    { label: 'Certificados Emitidos', value: 567, icon: '🎓', color: 'from-green-500 to-emerald-500' },
    { label: 'Usuarios Activos', value: 89, icon: '👥', color: 'from-purple-500 to-pink-500' },
    { label: 'Recompensas', value: 2500, icon: '🏆', color: 'from-orange-500 to-red-500' }
  ];

  const quickActions = [
    { icon: '🎓', label: 'Emitir Certificado', action: () => console.log('Emitir certificado') },
    { icon: '💰', label: 'Solicitar Préstamo', action: () => console.log('Solicitar préstamo') },
    { icon: '🤝', label: 'Buscar Mentor', action: () => console.log('Buscar mentor') },
    { icon: '🏆', label: 'Ver Logros', action: () => console.log('Ver logros') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <ScrollIndicator />
      <DashboardParticles />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
              className="inline-flex items-center px-4 py-2 bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200/50 dark:border-primary-700/50 mb-4"
            >
              🚀 Dashboard Interactivo
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent">
                Panel Principal
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Bienvenido a tu dashboard personalizado de BrainSafes
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-soft border border-white/20 dark:border-gray-700/20 hover:shadow-large transition-all duration-300"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {action.icon}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.label}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
            <FiltersBar filtros={filtros} setFiltros={setFiltros} />
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Metrics Summary - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="lg:col-span-12"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden">
              <MetricsSummary />
            </div>
          </motion.div>

          {/* Charts Section - 8 columns on large screens */}


          {/* Alerts Panel - Full width since charts were removed */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="lg:col-span-12"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden h-full min-h-[400px] lg:min-h-[600px]">
              <AlertsPanel filtros={filtros} />
            </div>
          </motion.div>

          {/* Quick Links - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
            className="lg:col-span-12"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden">
              <QuickLinks />
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="mt-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                delay={2.4 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>

        {/* Mobile Optimized Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4 mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="aspect-square bg-gradient-to-br from-primary-500 to-brain-500 rounded-xl p-6 text-white shadow-large"
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-semibold mb-2">Actividad Reciente</h3>
                <p className="text-sm opacity-90">Últimas transacciones y eventos</p>
              </div>
              <div className="text-3xl font-bold">
                <AnimatedMetric value={24} />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="aspect-square bg-gradient-to-br from-success-500 to-green-500 rounded-xl p-6 text-white shadow-large"
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <h3 className="text-lg font-semibold mb-2">Certificados</h3>
                <p className="text-sm opacity-90">Credenciales verificadas</p>
              </div>
              <div className="text-3xl font-bold">
                <AnimatedMetric value={12} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.8 }}
          className="lg:hidden mt-8 text-center"
        >
          <div className="flex justify-center items-center space-x-2 text-gray-500 dark:text-gray-400">
            <motion.div
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Desliza para ver más contenido
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 