import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para profile
const ProfileParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-profile-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -25, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 6 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 6,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas
const AnimatedProfileStats = ({ label, value, icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="text-center"
  >
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {label}
    </div>
  </motion.div>
);

// Componente de información del perfil
const ProfileInfo = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarLoading(true);
      
      // Simular carga de avatar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const url = URL.createObjectURL(file);
      onEdit({ avatarNFT: url });
      setAvatarLoading(false);
    }
  };

  const handleSave = () => {
    onEdit(formData);
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Moderator': return 'from-purple-500 to-indigo-500';
      case 'Developer': return 'from-blue-500 to-cyan-500';
      case 'Student': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Moderator': return '🛡️';
      case 'Developer': return '💻';
      case 'Student': return '🎓';
      default: return '👤';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getRoleColor(user?.roles?.[0] || 'User')} flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden`}>
              {avatarLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user?.avatarNFT ? (
                <img 
                  src={user.avatarNFT} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            {/* Avatar Upload Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => document.getElementById('avatar-input').click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-profile-600 dark:hover:text-profile-400 transition-colors duration-300 shadow-medium"
            >
              📷
            </motion.button>
            
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </motion.div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.name || user?.email || 'Usuario'}
            </h2>
            <div className="flex gap-1">
              {user?.roles?.map((role, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(role)} text-white`}
                >
                  <span>{getRoleIcon(role)}</span>
                  <span>{role}</span>
                </span>
              ))}
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {user?.bio || 'Sin descripción'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.stats?.courses || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Cursos
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.stats?.certificates || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Certificados
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.stats?.points || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Puntos
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gradient-to-r from-profile-500 to-profile-600 text-white rounded-lg font-medium transition-all duration-300 hover:from-profile-600 hover:to-profile-700"
            >
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </motion.button>
            
            {isEditing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium transition-all duration-300 hover:from-green-600 hover:to-emerald-600"
              >
                Guardar
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-profile-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-profile-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-profile-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-profile-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Biografía
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-profile-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Componente de badges
const ProfileBadges = ({ badges = [] }) => {
  const getBadgeColor = (type) => {
    switch (type) {
      case 'achievement': return 'from-yellow-500 to-orange-500';
      case 'certification': return 'from-blue-500 to-indigo-500';
      case 'participation': return 'from-green-500 to-emerald-500';
      case 'special': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 mb-6"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🏆 Badges y Logros
      </h3>
      
      {badges.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-gray-500 dark:text-gray-400">
            Aún no tienes badges. ¡Completa cursos para ganar logros!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${getBadgeColor(badge.type)} flex items-center justify-center text-white text-2xl mb-2`}>
                {badge.icon}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {badge.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {badge.description}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Componente de actividad reciente
const ProfileActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'course': return '📚';
      case 'certificate': return '🎓';
      case 'badge': return '🏆';
      case 'payment': return '💰';
      default: return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'course': return 'text-blue-600 dark:text-blue-400';
      case 'certificate': return 'text-green-600 dark:text-green-400';
      case 'badge': return 'text-yellow-600 dark:text-yellow-400';
      case 'payment': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 mb-6"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        📊 Actividad Reciente
      </h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400">
            No hay actividad reciente. ¡Comienza a aprender!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className={`text-xl ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.date).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Componente de configuración
const ProfileSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'es'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        ⚙️ Configuración
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Notificaciones
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Recibir notificaciones de la plataforma
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSettingChange('notifications', !settings.notifications)}
            className={`w-12 h-6 rounded-full transition-colors duration-300 ${
              settings.notifications 
                ? 'bg-profile-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <motion.div
              animate={{ x: settings.notifications ? 24 : 0 }}
              className="w-5 h-5 bg-white rounded-full shadow-md"
            />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Actualizaciones por Email
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Recibir novedades por correo electrónico
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSettingChange('emailUpdates', !settings.emailUpdates)}
            className={`w-12 h-6 rounded-full transition-colors duration-300 ${
              settings.emailUpdates 
                ? 'bg-profile-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <motion.div
              animate={{ x: settings.emailUpdates ? 24 : 0 }}
              className="w-5 h-5 bg-white rounded-full shadow-md"
            />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Modo Oscuro
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Cambiar entre tema claro y oscuro
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
            className={`w-12 h-6 rounded-full transition-colors duration-300 ${
              settings.darkMode 
                ? 'bg-profile-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <motion.div
              animate={{ x: settings.darkMode ? 24 : 0 }}
              className="w-5 h-5 bg-white rounded-full shadow-md"
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos de usuario
    setTimeout(() => {
      setUser({
        id: 1,
        name: 'Vaios0x',
        email: 'vaios0x@example.com',
        bio: 'Desarrollador blockchain apasionado por la educación descentralizada. Especializado en Solidity y DeFi.',
        location: 'Madrid, España',
        website: 'https://vaios0x.dev',
        avatarNFT: null,
        roles: ['Student', 'Developer'],
        stats: {
          courses: 12,
          certificates: 8,
          points: 2450
        },
        badges: [
          { id: 1, name: 'Primer Curso', description: 'Completaste tu primer curso', icon: '🎯', type: 'achievement' },
          { id: 2, name: 'Certificado Solidity', description: 'Certificación en Solidity', icon: '📜', type: 'certification' },
          { id: 3, name: 'Participante Activo', description: 'Participación en la comunidad', icon: '👥', type: 'participation' },
          { id: 4, name: 'Beta Tester', description: 'Probador de nuevas funciones', icon: '🧪', type: 'special' }
        ],
        activities: [
          { id: 1, type: 'course', title: 'Completaste "Smart Contracts Avanzados"', date: '2024-01-15' },
          { id: 2, type: 'certificate', title: 'Obtuviste certificado en "DeFi Fundamentals"', date: '2024-01-10' },
          { id: 3, type: 'badge', title: 'Ganaste badge "Participante Activo"', date: '2024-01-08' },
          { id: 4, type: 'payment', title: 'Realizaste pago de préstamo', date: '2024-01-05' }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const handleEdit = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        <ProfileParticles />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-profile-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <ProfileParticles />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
              className="inline-flex items-center px-4 py-2 bg-profile-100/80 dark:bg-profile-900/30 backdrop-blur-sm text-profile-700 dark:text-profile-300 rounded-full text-sm font-medium border border-profile-200/50 dark:border-profile-700/50 mb-4"
            >
              👤 Perfil
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-profile-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Profile
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Gestiona tu perfil, badges, actividad y configuración. Personaliza tu experiencia en BrainSafes.
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatedProfileStats 
              label="Cursos Completados" 
              value={user?.stats?.courses || 0} 
              icon="📚" 
              delay={1.0}
            />
            <AnimatedProfileStats 
              label="Certificados" 
              value={user?.stats?.certificates || 0} 
              icon="🎓" 
              delay={1.1}
            />
            <AnimatedProfileStats 
              label="Puntos Ganados" 
              value={user?.stats?.points || 0} 
              icon="⭐" 
              delay={1.2}
            />
            <AnimatedProfileStats 
              label="Badges" 
              value={user?.badges?.length || 0} 
              icon="🏆" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <ProfileInfo user={user} onEdit={handleEdit} />
              <ProfileBadges badges={user?.badges} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ProfileActivity activities={user?.activities} />
              <ProfileSettings user={user} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 