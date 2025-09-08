import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from './NeuralBackground';

// Componente de partículas neurales avanzadas para la comunidad
const NeuralCommunityParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${Math.random() * 60 + 280}, 80%, 60%)`, // Púrpura a rosa
      connections: [],
      pulse: Math.random() * Math.PI * 2,
    };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Actualizar y dibujar partículas
    particlesRef.current.forEach((particle, i) => {
      // Actualizar posición
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Rebote en bordes
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      // Mantener en canvas
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));

      // Efecto de pulso
      particle.pulse += 0.03;
      const pulseSize = particle.size + Math.sin(particle.pulse) * 1;

      // Dibujar partícula con glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, pulseSize * 4
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = particle.opacity;
      ctx.fillRect(particle.x - pulseSize * 4, particle.y - pulseSize * 4, pulseSize * 8, pulseSize * 8);

      // Dibujar conexiones neurales
      particlesRef.current.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (150 - distance) / 150 * 0.5;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Crear partículas
    particlesRef.current = Array.from({ length: 40 }, createParticle);
    
    // Iniciar animación
    animate();

    // Limpiar al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de estadísticas con glassmorphism 3D avanzado
const NeuralAnimatedCommunityStats = ({ label, value, icon, delay = 0, color = "purple" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
    whileHover={{ 
      scale: 1.05, 
      rotateY: 5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
    }}
    className="relative group"
  >
    <div className="relative p-6 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <motion.div 
          className="text-5xl mb-3"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            delay: delay * 0.5
          }}
        >
          {icon}
        </motion.div>
        <motion.div 
          className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2"
          style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-white/80 font-medium">
          {label}
        </div>
      </div>

      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden group transition-all duration-300 p-8 ${
        reward.claimed ? 'opacity-75' : ''
      }`}
    >
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      {/* Badge de estado */}
      {reward.claimed && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white/30 shadow-lg"
        >
          ✅
        </motion.div>
      )}

      {/* Icono de recompensa */}
      <div className="text-center mb-6 relative z-10">
        <motion.div
          animate={{ 
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.2 : 1
          }}
          transition={{ duration: 0.6 }}
          className={`text-6xl mb-4 ${reward.claimed ? 'opacity-50' : ''}`}
        >
          {getRewardIcon(reward.type)}
        </motion.div>
        <h3 className={`text-2xl font-bold mb-3 text-white ${reward.claimed ? 'opacity-50' : ''}`} style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
          {reward.name}
        </h3>
        <p className="text-base text-white/80 mb-6 leading-relaxed">
          {reward.description}
        </p>
      </div>

      {/* Puntos */}
      {reward.points && (
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl text-base font-bold border border-white/30 shadow-lg">
            <span>💎</span>
            <span>{reward.points} pts</span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col gap-3 relative z-10">
        {!reward.claimed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClaim(reward.id)}
            disabled={claimingId === reward.id}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
              claimingId === reward.id
                ? 'bg-gray-300/20 backdrop-blur-xl text-gray-400 cursor-not-allowed border-gray-500/30'
                : 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white border-purple-400/50 hover:from-purple-700/90 hover:to-pink-700/90 shadow-lg'
            }`}
          >
            {claimingId === reward.id ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDetails(reward.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-xl text-white/80 rounded-2xl font-bold border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300"
          >
            <span>ℹ️</span>
            Detalles
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onShare(reward.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-xl text-white/80 rounded-2xl font-bold border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300"
          >
            <span>📤</span>
            Compartir
          </motion.button>
        </div>
      </div>

      {/* Progreso de recompensa */}
      {reward.progress && (
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-base text-white/80 mb-3 font-medium">
            <span>Progreso</span>
            <span>{reward.progress.current}/{reward.progress.total}</span>
          </div>
          <div className="w-full bg-white/20 backdrop-blur-xl rounded-full h-4 border border-white/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(reward.progress.current / reward.progress.total) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full shadow-lg"
              style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
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
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="community" particleCount={50} waveCount={7} intensity="medium" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section con Glassmorphism 3D */}
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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
            >
              <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
              👥 Comunidad
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Community
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-white/90 max-w-3xl mx-auto lg:mx-0 font-medium"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}
            >
              Conecta, colabora y crece con nuestra comunidad. Gana recompensas, compite en rankings y participa en actividades.
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <NeuralAnimatedCommunityStats 
              label="Miembros Activos" 
              value="1,247" 
              icon="👥" 
              delay={1.0}
              color="purple"
            />
            <NeuralAnimatedCommunityStats 
              label="Recompensas" 
              value="156" 
              icon="🎁" 
              delay={1.1}
              color="pink"
            />
            <NeuralAnimatedCommunityStats 
              label="Mentores" 
              value="23" 
              icon="🎓" 
              delay={1.2}
              color="blue"
            />
            <NeuralAnimatedCommunityStats 
              label="Actividades" 
              value="89" 
              icon="📊" 
              delay={1.3}
              color="green"
            />
          </div>
        </motion.div>

        {/* Tabs con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden p-4">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <div className="flex flex-wrap gap-3 relative z-10">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl text-white border-purple-400/50 shadow-lg'
                      : 'bg-white/10 backdrop-blur-xl text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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