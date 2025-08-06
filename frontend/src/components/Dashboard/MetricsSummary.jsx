import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// Componente de métrica animada mejorado
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
      className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {count}{suffix}
    </motion.span>
  );
};

// Componente de tarjeta de métrica con glassmorphism
const MetricCard = ({ metric, index, isHovered, onHover }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    whileHover={{ 
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }}
    onHoverStart={() => onHover(index)}
    onHoverEnd={() => onHover(-1)}
    className={`group relative p-6 rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 transition-all duration-500 ${
      isHovered === index ? 'shadow-large' : 'shadow-soft'
    } ${metric.bgColor} backdrop-blur-sm`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          className={`text-4xl group-hover:scale-110 transition-transform duration-300 ${metric.textColor}`}
          whileHover={{ rotate: 5 }}
        >
          {metric.icon}
        </motion.div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{metric.label}</p>
          <AnimatedMetric value={metric.value} />
        </div>
      </div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(metric.value / 10000) * 100}%` }}
        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
        className={`h-2 bg-gradient-to-r ${metric.color} rounded-full`}
      />
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {metric.tooltip}
      </p>
    </div>
  </motion.div>
);

const MetricsSummary = () => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(-1);
  const [metrics, setMetrics] = useState([
    { 
      label: t('dashboard.metrics.users') || 'Usuarios', 
      value: 0, 
      tooltip: t('dashboard.metrics.users') || 'Usuarios registrados en la plataforma',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: t('dashboard.metrics.transactions') || 'Transacciones', 
      value: 0, 
      tooltip: t('dashboard.metrics.transactions') || 'Total de transacciones procesadas',
      icon: '🔄',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50/80 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    { 
      label: t('dashboard.metrics.activeContracts') || 'Contratos Activos', 
      value: 0, 
      tooltip: t('dashboard.metrics.activeContracts') || 'Contratos inteligentes activos actualmente',
      icon: '📋',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50/80 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    { 
      label: t('dashboard.metrics.balance') || 'Balance', 
      value: 0, 
      tooltip: t('dashboard.metrics.balance') || 'Balance total en la plataforma (ETH)',
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50/80 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics([
        { 
          label: t('dashboard.metrics.users') || 'Usuarios', 
          value: 1200 + Math.floor(Math.random() * 50), 
          tooltip: t('dashboard.metrics.users') || 'Usuarios registrados en la plataforma',
          icon: '👥',
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          label: t('dashboard.metrics.transactions') || 'Transacciones', 
          value: 50000 + Math.floor(Math.random() * 1000), 
          tooltip: t('dashboard.metrics.transactions') || 'Total de transacciones procesadas',
          icon: '🔄',
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50/80 dark:bg-green-900/20',
          textColor: 'text-green-600 dark:text-green-400'
        },
        { 
          label: t('dashboard.metrics.activeContracts') || 'Contratos Activos', 
          value: 35 + Math.floor(Math.random() * 5), 
          tooltip: t('dashboard.metrics.activeContracts') || 'Contratos inteligentes activos actualmente',
          icon: '📋',
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50/80 dark:bg-purple-900/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        },
        { 
          label: t('dashboard.metrics.balance') || 'Balance', 
          value: (1000 + Math.random() * 100).toFixed(2), 
          tooltip: t('dashboard.metrics.balance') || 'Balance total en la plataforma (ETH)',
          icon: '💰',
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-50/80 dark:bg-yellow-900/20',
          textColor: 'text-yellow-600 dark:text-yellow-400'
        },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          <span className="bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
            Métricas en Tiempo Real
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-gray-600 dark:text-gray-300 text-lg"
        >
          Estadísticas actualizadas de la plataforma BrainSafes
        </motion.p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              metric={metric}
              index={index}
              isHovered={hovered}
              onHover={setHovered}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Crecimiento Mensual</p>
              <p className="text-xl font-bold text-green-600">+12.5%</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo Promedio</p>
              <p className="text-xl font-bold text-blue-600">2.3s</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-gray-700/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
              <p className="text-xl font-bold text-purple-600">99.9%</p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MetricsSummary; 