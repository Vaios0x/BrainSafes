import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import NeuralBackground from "../NeuralBackground";
import MetricsSummary from "./MetricsSummary";
import AlertsPanel from "./AlertsPanel";
import QuickLinks from "./QuickLinks";
import FiltersBar from "./FiltersBar";

// Componente de fondo simplificado
const SimpleBackground = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
    </div>
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

  // Estadísticas orientadas al usuario final
  const userStats = [
    { label: 'Cursos Completados', value: 8, icon: '📚', color: 'from-blue-500 to-cyan-500', trend: 25 },
    { label: 'Certificados Obtenidos', value: 5, icon: '🎓', color: 'from-green-500 to-emerald-500', trend: 40 },
    { label: 'Horas de Estudio', value: 120, icon: '⏰', color: 'from-purple-500 to-pink-500', trend: 15 },
    { label: 'Puntos de Experiencia', value: 2500, icon: '⭐', color: 'from-yellow-500 to-orange-500', trend: 30 }
  ];

  // Acciones rápidas para el usuario
  const userQuickActions = [
    { icon: '📖', label: 'Continuar Curso', action: () => console.log('Continuar curso'), color: 'from-blue-500 to-cyan-500' },
    { icon: '🎯', label: 'Nuevo Objetivo', action: () => console.log('Nuevo objetivo'), color: 'from-green-500 to-emerald-500' },
    { icon: '🤝', label: 'Buscar Mentor', action: () => console.log('Buscar mentor'), color: 'from-purple-500 to-pink-500' },
    { icon: '💰', label: 'Solicitar Préstamo', action: () => console.log('Solicitar préstamo'), color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="dashboard" particleCount={45} waveCount={6} intensity="medium" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
        {/* Header Section simplificado */}
        <div className="mb-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/40 mb-4 shadow-2xl">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse shadow-lg shadow-green-500/50"></span>
              🚀 Arbitrum Sepolia
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4" style={{ textShadow: '0 0 40px rgba(255, 255, 255, 0.8)' }}>
              <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
                ¡Bienvenido de vuelta!
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto lg:mx-0 font-medium" style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}>
              Continúa tu viaje de aprendizaje y descubre nuevas oportunidades
            </p>
          </div>
        </div>

        {/* Quick Actions simplificadas */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userQuickActions.map((action, index) => (
              <div key={index} className="group">
                <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-2xl p-4 hover:scale-105 transition-transform duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {action.icon}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {action.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Metrics Summary - Full Width */}
          <div className="lg:col-span-12">
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
              <MetricsSummary />
            </div>
          </div>

          {/* Alerts Panel - Full width */}
          <div className="lg:col-span-12">
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden h-full min-h-[400px] lg:min-h-[600px]">
              <AlertsPanel filtros={filtros} />
            </div>
          </div>

          {/* Quick Links - Full Width */}
          <div className="lg:col-span-12">
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
              <QuickLinks />
            </div>
          </div>
        </div>

        {/* Stats Grid simplificado */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {userStats.map((stat, index) => (
              <div key={index} className="group">
                <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-2xl p-6 hover:scale-105 transition-transform duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        {stat.icon}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/80 mb-1">{stat.label}</p>
                        <div className="text-3xl font-bold text-white">
                          {stat.value}
                        </div>
                        {stat.trend && (
                          <div className={`text-xs font-medium ${
                            stat.trend > 0 ? 'text-green-400' : stat.trend < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {stat.trend > 0 ? '↗' : stat.trend < 0 ? '↘' : '→'} {Math.abs(stat.trend)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;