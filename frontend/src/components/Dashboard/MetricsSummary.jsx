import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Componente de gráfico de progreso circular simplificado
const CircularProgress = ({ percentage, color, size = 80 }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Fondo del círculo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="4"
          fill="transparent"
        />
        {/* Progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

// Componente de métrica con glassmorphism simplificado
const MetricCard = ({ icon, title, value, subtitle, color, delay = 0 }) => (
  <div className="group relative">
    <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden p-6 hover:scale-105 transition-transform duration-300">
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <CircularProgress percentage={value} color={color} size={60} />
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
          {title}
        </h3>
        <p className="text-sm text-white/80 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  </div>
);

// Componente de estadística resumen simplificado
const SummaryStat = ({ label, value, trend, icon, delay = 0 }) => (
  <div className="group">
    <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-2xl p-4 hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl mb-1">{icon}</div>
          <div className="text-sm text-white/80 font-medium">{label}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          {trend && (
            <div className={`text-xs font-medium ${
              trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function MetricsSummary() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Métricas del usuario
  const userMetrics = [
    {
      icon: '📊',
      title: 'Mi Progreso',
      value: 75,
      subtitle: 'Cursos completados',
      color: '#3B82F6'
    },
    {
      icon: '🎓',
      title: 'Certificados',
      value: 60,
      subtitle: 'Logros obtenidos',
      color: '#10B981'
    },
    {
      icon: '⭐',
      title: 'Puntos de Experiencia',
      value: 85,
      subtitle: 'Nivel de conocimiento',
      color: '#F59E0B'
    },
    {
      icon: '🎁',
      title: 'Recompensas',
      value: 40,
      subtitle: 'Beneficios activos',
      color: '#EF4444'
    }
  ];

  // Estadísticas resumen
  const summaryStats = [
    { label: 'Cursos Completados', value: '12', trend: 25, icon: '📚' },
    { label: 'Certificados Obtenidos', value: '8', trend: 40, icon: '🎓' },
    { label: 'Horas de Estudio', value: '156', trend: 15, icon: '⏰' },
    { label: 'Puntos de Experiencia', value: '2.5K', trend: 30, icon: '⭐' }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'progress', label: 'Progreso', icon: '📈' },
    { id: 'achievements', label: 'Logros', icon: '🏆' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
        >
          <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
          🚀 Arbitrum Sepolia
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            👤 Mi Dashboard Personal
          </span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-xl text-white/90 max-w-2xl mx-auto font-medium"
          style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}
        >
          Plataforma descentralizada en Arbitrum Sepolia - Rastrea tu progreso, certificados y logros
        </motion.p>
      </motion.div>

      {/* Tabs simplificados */}
      <div className="flex justify-center gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 border-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white border-blue-400/50 shadow-lg'
                : 'bg-white/10 backdrop-blur-xl text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Métricas del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                icon={metric.icon}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                color={metric.color}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Estadísticas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryStats.map((stat, index) => (
              <SummaryStat
                key={index}
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                icon={stat.icon}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-2xl font-bold text-white mb-2">Progreso Detallado</h3>
          <p className="text-white/80">Próximamente: Gráficos de progreso detallados</p>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-2">Logros y Certificados</h3>
          <p className="text-white/80">Próximamente: Sistema de logros y certificados</p>
        </div>
      )}
    </div>
  );
}