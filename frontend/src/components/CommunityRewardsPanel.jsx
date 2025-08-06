import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para la comunidad
const CommunityParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-community-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 8 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 8,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas
const AnimatedCommunityStats = ({ label, value, icon, delay = 0 }) => (
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

// Componente de recompensa individual
const RewardCard = ({ reward, onClaim, onShare, onDetails, claimingId }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getRewardIcon = (type) => {
    switch (type) {
      case 'gift': return '🎁';
      case 'star': return '⭐';
      case 'trophy': return '🏆';
      case 'medal': return '🥇';
      case 'badge': return '🏅';
      default: return '🎉';
    }
  };

  const getRewardColor = (type) => {
    switch (type) {
      case 'gift': return 'from-purple-500 to-pink-500';
      case 'star': return 'from-yellow-500 to-orange-500';
      case 'trophy': return 'from-blue-500 to-indigo-500';
      case 'medal': return 'from-green-500 to-emerald-500';
      case 'badge': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 transition-all duration-300 ${
        reward.claimed ? 'opacity-75' : ''
      }`}
    >
      {/* Badge de estado */}
      {reward.claimed && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full"
        >
          ✅
        </motion.div>
      )}

      {/* Icono de recompensa */}
      <div className="text-center mb-4">
        <motion.div
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 0.6 }}
          className={`text-4xl mb-2 ${reward.claimed ? 'opacity-50' : ''}`}
        >
          {getRewardIcon(reward.type)}
        </motion.div>
        <h3 className={`text-lg font-bold mb-2 ${reward.claimed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {reward.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {reward.description}
        </p>
      </div>

      {/* Puntos */}
      {reward.points && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-community-500 to-community-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            <span>💎</span>
            <span>{reward.points} pts</span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-center gap-2">
        {!reward.claimed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClaim(reward.id)}
            disabled={claimingId === reward.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              claimingId === reward.id
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-community-500 to-community-600 text-white hover:from-community-600 hover:to-community-700'
            }`}
          >
            {claimingId === reward.id ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Reclamando...
              </>
            ) : (
              <>
                <span>🎁</span>
                Reclamar
              </>
            )}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDetails(reward.id)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
        >
          <span>ℹ️</span>
          Detalles
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onShare(reward.id)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
        >
          <span>📤</span>
          Compartir
        </motion.button>
      </div>

      {/* Progreso de recompensa */}
      {reward.progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{reward.progress.current}/{reward.progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(reward.progress.current / reward.progress.total) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-gradient-to-r from-community-500 to-community-600 h-2 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Componente de ranking de comunidad
const CommunityRanking = ({ users }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Todos', icon: '👥' },
    { id: 'mentors', label: 'Mentores', icon: '🎓' },
    { id: 'contributors', label: 'Contribuidores', icon: '⭐' },
    { id: 'newcomers', label: 'Nuevos', icon: '🆕' },
  ];

  const filteredUsers = users.filter(user => {
    if (selectedFilter === 'all') return true;
    return user.category === selectedFilter;
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Ranking de Comunidad
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Los miembros más activos de nuestra comunidad
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              selectedFilter === filter.id
                ? 'bg-gradient-to-r from-community-500 to-community-600 text-white shadow-medium'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Lista de usuarios */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-white/20 dark:border-gray-700/20 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Posición */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-community-500 to-community-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Avatar y nombre */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-community-400 to-community-500 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.category === 'mentors' && '🎓 Mentor'}
                        {user.category === 'contributors' && '⭐ Contribuidor'}
                        {user.category === 'newcomers' && '🆕 Nuevo'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Puntos y badges */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {user.points} pts
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.rewards} recompensas
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {user.badges?.map((badge, i) => (
                      <span key={i} className="text-lg" title={badge.name}>
                        {badge.icon}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No hay usuarios en esta categoría
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Intenta con otro filtro o espera a que se unan más miembros.
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Componente de actividades de comunidad
const CommunityActivities = ({ activities }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Actividades Recientes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Últimas actividades de la comunidad
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-white/20 dark:border-gray-700/20 p-4 cursor-pointer"
              onClick={() => setSelectedActivity(activity)}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {activity.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-community-600 dark:text-community-400">
                    +{activity.points} pts
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal de actividad detallada */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{selectedActivity.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedActivity.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedActivity.description}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Puntos ganados:</span>
                  <span className="font-bold text-community-600 dark:text-community-400">
                    +{selectedActivity.points} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tiempo:</span>
                  <span className="text-gray-900 dark:text-white">{selectedActivity.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Usuario:</span>
                  <span className="text-gray-900 dark:text-white">{selectedActivity.user}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedActivity(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  Cerrar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2 bg-gradient-to-r from-community-500 to-community-600 text-white rounded-xl font-medium hover:from-community-600 hover:to-community-700 transition-all duration-300"
                >
                  Compartir
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CommunityRewardsPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rewards');
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, type: '', msg: '' });

  // Datos simulados
  const [rewards, setRewards] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setRewards([
        {
          id: 1,
          name: 'Premio Colaborador',
          description: 'Por colaborar activamente en la comunidad y ayudar a otros usuarios.',
          claimed: false,
          type: 'star',
          points: 150,
          progress: { current: 3, total: 5 }
        },
        {
          id: 2,
          name: 'Premio Mentor',
          description: 'Por proporcionar mentoría y guía a nuevos miembros de la comunidad.',
          claimed: true,
          type: 'trophy',
          points: 300
        },
        {
          id: 3,
          name: 'Premio Innovador',
          description: 'Por contribuir con ideas innovadoras y mejoras al proyecto.',
          claimed: false,
          type: 'badge',
          points: 200,
          progress: { current: 1, total: 3 }
        },
        {
          id: 4,
          name: 'Premio Comunidad',
          description: 'Por ser un miembro activo y participativo en la comunidad.',
          claimed: false,
          type: 'medal',
          points: 100,
          progress: { current: 8, total: 10 }
        },
        {
          id: 5,
          name: 'Premio Contribuidor',
          description: 'Por contribuir con código, documentación o recursos al proyecto.',
          claimed: false,
          type: 'gift',
          points: 250
        },
        {
          id: 6,
          name: 'Premio Líder',
          description: 'Por liderar iniciativas y proyectos dentro de la comunidad.',
          claimed: true,
          type: 'trophy',
          points: 500
        }
      ]);

      setUsers([
        {
          id: 1,
          name: 'Ana García',
          points: 1250,
          rewards: 8,
          category: 'mentors',
          badges: [{ icon: '🎓', name: 'Mentor' }, { icon: '⭐', name: 'Contribuidor' }]
        },
        {
          id: 2,
          name: 'Carlos López',
          points: 980,
          rewards: 6,
          category: 'contributors',
          badges: [{ icon: '⭐', name: 'Contribuidor' }]
        },
        {
          id: 3,
          name: 'María Rodríguez',
          points: 750,
          rewards: 4,
          category: 'newcomers',
          badges: [{ icon: '🆕', name: 'Nuevo' }]
        },
        {
          id: 4,
          name: 'David Martínez',
          points: 650,
          rewards: 3,
          category: 'contributors',
          badges: [{ icon: '⭐', name: 'Contribuidor' }]
        },
        {
          id: 5,
          name: 'Laura Sánchez',
          points: 450,
          rewards: 2,
          category: 'newcomers',
          badges: [{ icon: '🆕', name: 'Nuevo' }]
        }
      ]);

      setActivities([
        {
          id: 1,
          title: 'Ana completó un curso',
          description: 'Completó el curso de Smart Contracts',
          icon: '📚',
          points: 50,
          time: 'Hace 2 horas',
          user: 'Ana García'
        },
        {
          id: 2,
          title: 'Carlos ayudó a un nuevo usuario',
          description: 'Proporcionó mentoría sobre NFTs',
          icon: '🎓',
          points: 30,
          time: 'Hace 4 horas',
          user: 'Carlos López'
        },
        {
          id: 3,
          title: 'María contribuyó con código',
          description: 'Mejoró el sistema de recompensas',
          icon: '💻',
          points: 100,
          time: 'Hace 6 horas',
          user: 'María Rodríguez'
        },
        {
          id: 4,
          title: 'David compartió conocimiento',
          description: 'Publicó un tutorial sobre Arbitrum',
          icon: '📖',
          points: 75,
          time: 'Hace 8 horas',
          user: 'David Martínez'
        },
        {
          id: 5,
          title: 'Laura ganó su primera recompensa',
          description: 'Completó su primer milestone',
          icon: '🎉',
          points: 25,
          time: 'Hace 12 horas',
          user: 'Laura Sánchez'
        }
      ]);

      setLoading(false);
    }, 1500);
  }, []);

  const handleClaim = (id) => {
    setClaimingId(id);
    setTimeout(() => {
      setRewards(rewards => rewards.map(r => 
        r.id === id ? { ...r, claimed: true } : r
      ));
      setSnackbar({ open: true, type: 'success', msg: '¡Recompensa reclamada exitosamente!' });
      setClaimingId(null);
    }, 2000);
  };

  const handleShare = (id) => {
    setSnackbar({ open: true, type: 'info', msg: '¡Compartiendo en redes sociales!' });
  };

  const handleDetails = (id) => {
    setSnackbar({ open: true, type: 'info', msg: 'Mostrando detalles de la recompensa.' });
  };

  const tabs = [
    { id: 'rewards', label: 'Recompensas', icon: '🎁' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    { id: 'activities', label: 'Actividades', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <CommunityParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-community-100/80 dark:bg-community-900/30 backdrop-blur-sm text-community-700 dark:text-community-300 rounded-full text-sm font-medium border border-community-200/50 dark:border-community-700/50 mb-4"
            >
              👥 Comunidad
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-community-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Community
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Conecta, colabora y crece con nuestra comunidad. Gana recompensas, compite en rankings y participa en actividades.
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
            <AnimatedCommunityStats 
              label="Miembros Activos" 
              value="1,247" 
              icon="👥" 
              delay={1.0}
            />
            <AnimatedCommunityStats 
              label="Recompensas" 
              value="156" 
              icon="🎁" 
              delay={1.1}
            />
            <AnimatedCommunityStats 
              label="Mentores" 
              value="23" 
              icon="🎓" 
              delay={1.2}
            />
            <AnimatedCommunityStats 
              label="Actividades" 
              value="89" 
              icon="📊" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-community-500 to-community-600 text-white shadow-medium'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Recompensas de Comunidad
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Gana puntos y recompensas por participar activamente
                    </p>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
                        >
                          <div className="animate-pulse">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : rewards.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="text-6xl mb-4">🎁</div>
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        No hay recompensas disponibles
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500">
                        Participa en la comunidad para desbloquear recompensas.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {rewards.map((reward, index) => (
                        <RewardCard
                          key={reward.id}
                          reward={reward}
                          onClaim={handleClaim}
                          onShare={handleShare}
                          onDetails={handleDetails}
                          claimingId={claimingId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'ranking' && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CommunityRanking users={users} />
              </motion.div>
            )}
            
            {activeTab === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CommunityActivities activities={activities} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`px-6 py-3 rounded-xl text-white font-medium ${
              snackbar.type === 'success' ? 'bg-green-500' :
              snackbar.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`}>
              {snackbar.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 