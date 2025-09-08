import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon, 
  TrashIcon,
  ArchiveBoxIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const NotificationCenter = ({ wallet }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tipos de notificación
  const notificationTypes = [
    { value: '', label: 'Todas' },
    { value: 'welcome', label: 'Bienvenida' },
    { value: 'course_enrolled', label: 'Inscripción a Curso' },
    { value: 'course_completed', label: 'Curso Completado' },
    { value: 'certificate_issued', label: 'Certificado Emitido' },
    { value: 'badge_earned', label: 'Badge Ganado' },
    { value: 'achievement_unlocked', label: 'Logro Desbloqueado' },
    { value: 'payment_received', label: 'Pago Recibido' },
    { value: 'payment_failed', label: 'Pago Fallido' },
    { value: 'scholarship_awarded', label: 'Beca Otorgada' },
    { value: 'job_application', label: 'Solicitud de Trabajo' },
    { value: 'job_offer', label: 'Oferta de Trabajo' },
    { value: 'mentorship_request', label: 'Solicitud de Mentoría' },
    { value: 'mentorship_accepted', label: 'Mentoría Aceptada' },
    { value: 'governance_proposal', label: 'Propuesta de Gobierno' },
    { value: 'governance_vote', label: 'Voto de Gobierno' },
    { value: 'security_alert', label: 'Alerta de Seguridad' },
    { value: 'system_maintenance', label: 'Mantenimiento del Sistema' },
    { value: 'general', label: 'General' }
  ];

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!wallet) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        wallet,
        limit: '50'
      });

      if (showUnreadOnly) {
        params.append('unreadOnly', 'true');
      }

      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Error cargando notificaciones');
      }

      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(result.data.filter(n => !n.read).length);
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet, showUnreadOnly, selectedType]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: wallet,
          notificationId
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId 
              ? { ...n, read: true, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  }, [wallet]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: wallet
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  }, [wallet]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: wallet
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n._id === notificationId);
          return notification && !notification.read ? prev - 1 : prev;
        });
      }
    } catch (err) {
      console.error('Error eliminando notificación:', err);
    }
  }, [wallet, notifications]);

  // Obtener icono por tipo
  const getNotificationIcon = (type, priority) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'security_alert':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />;
      case 'course_completed':
      case 'certificate_issued':
      case 'badge_earned':
      case 'achievement_unlocked':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'payment_failed':
        return <XCircleIcon className={`${iconClass} text-red-500`} />;
      case 'system_maintenance':
        return <InformationCircleIcon className={`${iconClass} text-yellow-500`} />;
      default:
        return <BellIcon className={`${iconClass} text-blue-500`} />;
    }
  };

  // Obtener color por prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Cargar notificaciones al montar y cuando cambien los filtros
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="px-4 py-3 border-b border-gray-200 space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded"
                  />
                  Solo no leídas
                </label>
              </div>

              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Cargando notificaciones...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  <XCircleIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BellIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{formatDate(notification.createdAt)}</span>
                                {notification.priority !== 'medium' && (
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                    notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {notification.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Marcar como leída"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification._id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {notification.link && (
                            <div className="mt-2">
                              <a
                                href={notification.link}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                Ver más
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
