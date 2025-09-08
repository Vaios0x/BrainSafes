import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedGlassCard, GlassButton } from '../GlassmorphismEffects';

// Componente de alerta individual mejorado
const AlertItem = ({ alert, index, onDismiss, onAction }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: -50, scale: 0.9 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    whileHover={{ 
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2 }
    }}
    className="group relative"
  >
    <AdvancedGlassCard 
      intensity="medium" 
      variant="default" 
      className={`p-4 border-l-4 ${
        alert.type === 'error' 
          ? 'border-red-500' 
          : alert.type === 'warning' 
          ? 'border-yellow-500'
          : alert.type === 'success'
          ? 'border-green-500'
          : 'border-blue-500'
      }`}
    >
      <div className={`absolute inset-0 ${
        alert.type === 'error' 
          ? 'bg-red-50/80 dark:bg-red-900/20' 
          : alert.type === 'warning' 
          ? 'bg-yellow-50/80 dark:bg-yellow-900/20'
          : alert.type === 'success'
          ? 'bg-green-50/80 dark:bg-green-900/20'
          : 'bg-blue-50/80 dark:bg-blue-900/20'
      } rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <motion.div
              className={`text-2xl ${
                alert.type === 'error' 
                  ? 'text-red-500' 
                  : alert.type === 'warning' 
                  ? 'text-yellow-500'
                  : alert.type === 'success'
                  ? 'text-green-500'
                  : 'text-blue-500'
              }`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {alert.icon}
            </motion.div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {alert.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                {alert.message}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {alert.time}
                </p>
                {alert.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAction(alert.id)}
                    className="text-xs px-2 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md hover:bg-primary-500/20 transition-colors duration-200"
                  >
                    {alert.action}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDismiss(alert.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200 ml-2"
          >
            ×
          </motion.button>
        </div>
      </div>
    </AdvancedGlassCard>
  </motion.div>
);

// Componente de filtro de alertas mejorado
const AlertFilter = ({ filter, setFilter, alertTypes }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.8 }}
    className="mb-6"
  >
    <div className="flex flex-wrap gap-2">
      {alertTypes.map((type, index) => (
        <motion.button
          key={type.key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter(type.key)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            filter === type.key
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-lg'
              : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80'
          }`}
        >
          <span className="text-lg">{type.icon}</span>
          <span>{type.label}</span>
          <motion.span 
            className={`rounded-full px-2 py-0.5 text-xs ${
              filter === type.key 
                ? 'bg-primary-200 dark:bg-primary-800' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            animate={{ scale: filter === type.key ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {type.count}
          </motion.span>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

// Componente de estadísticas de alertas
const AlertStats = ({ alerts }) => {
  const stats = [
    { label: 'Total', value: alerts.length, color: 'text-gray-600' },
    { label: 'Críticas', value: alerts.filter(a => a.type === 'error').length, color: 'text-red-600' },
    { label: 'Advertencias', value: alerts.filter(a => a.type === 'warning').length, color: 'text-yellow-600' },
    { label: 'Éxitos', value: alerts.filter(a => a.type === 'success').length, color: 'text-green-600' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.4 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
          className="text-center"
        >
          <AdvancedGlassCard intensity="low" variant="default" className="p-3">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </AdvancedGlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
};

const AlertsPanel = ({ filtros }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Certificado Emitido',
      message: 'Se ha emitido exitosamente el certificado de Blockchain Development',
      time: 'Hace 2 minutos',
      action: 'Ver'
    },
    {
      id: 2,
      type: 'warning',
      icon: '⚠️',
      title: 'Gas Elevado',
      message: 'Los precios del gas están por encima del promedio recomendado',
      time: 'Hace 5 minutos',
      action: 'Optimizar'
    },
    {
      id: 3,
      type: 'info',
      icon: 'ℹ️',
      title: 'Nueva Actualización',
      message: 'BrainSafes ha sido actualizado a la versión 2.1.0',
      time: 'Hace 10 minutos',
      action: 'Actualizar'
    },
    {
      id: 4,
      type: 'error',
      icon: '❌',
      title: 'Error de Conexión',
      message: 'Problema temporal con el oráculo de datos',
      time: 'Hace 15 minutos',
      action: 'Reintentar'
    },
    {
      id: 5,
      type: 'success',
      icon: '🎓',
      title: 'Curso Completado',
      message: 'Has completado exitosamente el curso de Smart Contracts',
      time: 'Hace 20 minutos',
      action: 'Certificar'
    },
    {
      id: 6,
      type: 'info',
      icon: '💰',
      title: 'Préstamo Disponible',
      message: 'Tienes una nueva oferta de préstamo disponible',
      time: 'Hace 25 minutos',
      action: 'Revisar'
    }
  ]);

  const [filter, setFilter] = useState('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleAction = (id) => {
    console.log(`Acción ejecutada para alerta ${id}`);
    // Aquí se ejecutaría la acción específica
  };

  const alertTypes = [
    { key: 'all', label: 'Todas', icon: '📋', count: alerts.length },
    { key: 'error', label: 'Errores', icon: '❌', count: alerts.filter(a => a.type === 'error').length },
    { key: 'warning', label: 'Advertencias', icon: '⚠️', count: alerts.filter(a => a.type === 'warning').length },
    { key: 'success', label: 'Éxitos', icon: '✅', count: alerts.filter(a => a.type === 'success').length },
    { key: 'info', label: 'Info', icon: 'ℹ️', count: alerts.filter(a => a.type === 'info').length }
  ];

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Alertas y Notificaciones
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl"
          >
            🔔
          </motion.div>
        </div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          Mantente informado sobre las últimas actividades y eventos
        </motion.p>
      </motion.div>

      {/* Estadísticas */}
      <AlertStats alerts={alerts} />

      {/* Filter Tabs */}
      <AlertFilter filter={filter} setFilter={setFilter} alertTypes={alertTypes} />

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="flex-1 overflow-y-auto space-y-3"
      >
        <AnimatePresence>
          {filteredAlerts.map((alert, index) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              index={index}
              onDismiss={dismissAlert}
              onAction={handleAction}
            />
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AdvancedGlassCard intensity="low" variant="default" className="p-8">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No hay alertas para mostrar
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                ¡Todo está funcionando perfectamente!
              </p>
            </AdvancedGlassCard>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
};

export default AlertsPanel;