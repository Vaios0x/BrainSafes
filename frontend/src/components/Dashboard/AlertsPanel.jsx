import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// Componente de alerta individual
const AlertItem = ({ alert, index, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    whileHover={{ 
      scale: 1.02,
      transition: { duration: 0.2 }
    }}
    className={`group relative p-4 rounded-xl border-l-4 shadow-soft backdrop-blur-sm ${
      alert.type === 'error' 
        ? 'bg-red-50/80 dark:bg-red-900/20 border-red-500' 
        : alert.type === 'warning' 
        ? 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-500'
        : alert.type === 'success'
        ? 'bg-green-50/80 dark:bg-green-900/20 border-green-500'
        : 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3">
        <motion.div
          className={`text-xl ${
            alert.type === 'error' 
              ? 'text-red-500' 
              : alert.type === 'warning' 
              ? 'text-yellow-500'
              : alert.type === 'success'
              ? 'text-green-500'
              : 'text-blue-500'
          }`}
          whileHover={{ rotate: 5 }}
        >
          {alert.icon}
        </motion.div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {alert.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {alert.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {alert.time}
          </p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDismiss(alert.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
      >
        ×
      </motion.button>
    </div>
  </motion.div>
);

const AlertsPanel = ({ filtros }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Certificado Emitido',
      message: 'Se ha emitido exitosamente el certificado de Blockchain Development',
      time: 'Hace 2 minutos'
    },
    {
      id: 2,
      type: 'warning',
      icon: '⚠️',
      title: 'Gas Elevado',
      message: 'Los precios del gas están por encima del promedio recomendado',
      time: 'Hace 5 minutos'
    },
    {
      id: 3,
      type: 'info',
      icon: 'ℹ️',
      title: 'Nueva Actualización',
      message: 'BrainSafes ha sido actualizado a la versión 2.1.0',
      time: 'Hace 10 minutos'
    },
    {
      id: 4,
      type: 'error',
      icon: '❌',
      title: 'Error de Conexión',
      message: 'Problema temporal con el oráculo de datos',
      time: 'Hace 15 minutos'
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
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Alertas y Notificaciones
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl"
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

      {/* Filter Tabs */}
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
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                filter === type.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
              <span className="bg-gray-200 dark:bg-gray-700 rounded-full px-1.5 py-0.5 text-xs">
                {type.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

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
            />
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay alertas para mostrar
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Total: {alerts.length} alertas</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          >
            Ver todas
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AlertsPanel; 