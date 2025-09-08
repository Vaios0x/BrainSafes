import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from '../NeuralBackground';

// Componente de partículas neurales avanzadas para la gobernanza
const NeuralGovernanceParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${Math.random() * 40 + 200}, 80%, 60%)`, // Azul a verde
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
      particle.pulse += 0.025;
      const pulseSize = particle.size + Math.sin(particle.pulse) * 0.8;

      // Dibujar partícula con glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, pulseSize * 3
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = particle.opacity;
      ctx.fillRect(particle.x - pulseSize * 3, particle.y - pulseSize * 3, pulseSize * 6, pulseSize * 6);

      // Dibujar conexiones neurales
      particlesRef.current.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (100 - distance) / 100 * 0.3;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Crear partículas
    particlesRef.current = Array.from({ length: 30 }, createParticle);
    
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
const NeuralAnimatedGovernanceStats = ({ label, value, icon, delay = 0, color = "blue" }) => (
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
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -12, 0],
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
          className="text-4xl mb-3"
          animate={{ 
            rotate: [0, 8, -8, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: delay * 0.5
          }}
        >
          {icon}
        </motion.div>
        <motion.div 
          className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2"
          style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-white/80 font-medium">
          {label}
        </div>
      </div>

      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-green-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  </motion.div>
);

// Componente de propuesta individual
const ProposalCard = ({ proposal, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'abierta': return 'from-green-500 to-emerald-500';
      case 'cerrada': return 'from-gray-500 to-gray-600';
      case 'aprobada': return 'from-blue-500 to-indigo-500';
      case 'rechazada': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'abierta': return '🗳️';
      case 'cerrada': return '🔒';
      case 'aprobada': return '✅';
      case 'rechazada': return '❌';
      default: return '📋';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Economía': return '💰';
      case 'Educación': return '📚';
      case 'Gobernanza': return '⚖️';
      case 'Tecnología': return '🔧';
      case 'Comunidad': return '👥';
      default: return '📋';
    }
  };

  const calculateProgress = () => {
    const total = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
    return total > 0 ? (proposal.votes.yes / total) * 100 : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 3,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(proposal)}
      className={`relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-300 p-6 ${
        isSelected ? 'ring-2 ring-blue-400/50 shadow-large' : ''
      }`}
    >
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 25}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -8, 0],
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
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="text-3xl"
            animate={{ 
              rotate: isHovered ? 360 : 0,
              scale: isHovered ? 1.2 : 1
            }}
            transition={{ duration: 0.6 }}
          >
            {getTypeIcon(proposal.type)}
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
              {proposal.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-2xl text-sm font-bold bg-gradient-to-r ${getStatusColor(proposal.status)} text-white border border-white/30`}>
                <span>{getStatusIcon(proposal.status)}</span>
                <span className="capitalize">{proposal.status}</span>
              </span>
              <span className="text-sm text-white/70 bg-white/10 backdrop-blur-xl px-2 py-1 rounded-xl border border-white/20">
                {proposal.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-white/70">
            Cierra
          </div>
          <div className="text-sm font-bold text-white">
            {new Date(proposal.closeDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-white/80 text-base mb-4 line-clamp-2 leading-relaxed relative z-10">
        {proposal.description}
      </p>

      {/* Votes Progress */}
      <div className="mb-4 relative z-10">
        <div className="flex justify-between text-sm text-white/80 mb-2 font-medium">
          <span>Progreso de votación</span>
          <span>{Math.round(calculateProgress())}%</span>
        </div>
        <div className="w-full bg-white/20 backdrop-blur-xl rounded-full h-3 border border-white/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full shadow-lg"
            style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
          />
        </div>
      </div>

      {/* Vote Counts */}
      <div className="grid grid-cols-3 gap-3 text-center relative z-10">
        <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl p-3 border border-green-400/30">
          <div className="text-green-400 font-bold text-lg">
            {proposal.votes.yes}
          </div>
          <div className="text-xs text-green-300 font-medium">
            Sí
          </div>
        </div>
        <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-3 border border-red-400/30">
          <div className="text-red-400 font-bold text-lg">
            {proposal.votes.no}
          </div>
          <div className="text-xs text-red-300 font-medium">
            No
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
          <div className="text-white font-bold text-lg">
            {proposal.votes.abstain}
          </div>
          <div className="text-xs text-white/70 font-medium">
            Abstención
          </div>
        </div>
      </div>

      {/* Author info */}
      {proposal.author && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/30 relative z-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold border border-white/30">
            {proposal.author.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-white/80 font-medium">
            {proposal.author}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// Componente de detalles de propuesta
const ProposalDetails = ({ proposal, onClose, onVote }) => {
  const [voting, setVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);

  const handleVote = async (vote) => {
    setVoting(true);
    setSelectedVote(vote);
    
    // Simular votación
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onVote(proposal.id, vote);
    setVoting(false);
    setSelectedVote(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'abierta': return 'from-green-500 to-emerald-500';
      case 'cerrada': return 'from-gray-500 to-gray-600';
      case 'aprobada': return 'from-blue-500 to-indigo-500';
      case 'rechazada': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'abierta': return '🗳️';
      case 'cerrada': return '🔒';
      case 'aprobada': return '✅';
      case 'rechazada': return '❌';
      default: return '📋';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Detalles de Propuesta
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
        >
          ✕
        </motion.button>
      </div>

      {/* Proposal Info */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {proposal.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(proposal.status)} text-white`}>
                <span>{getStatusIcon(proposal.status)}</span>
                <span className="capitalize">{proposal.status}</span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {proposal.type}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {proposal.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Fecha de cierre</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {new Date(proposal.closeDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total de votos</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {proposal.votes.yes + proposal.votes.no + proposal.votes.abstain}
            </div>
          </div>
        </div>
      </div>

      {/* Vote Results */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resultados de Votación
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-gray-700 dark:text-gray-300">Sí</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {proposal.votes.yes}
              </span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(proposal.votes.yes / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-green-500 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <span className="text-gray-700 dark:text-gray-300">No</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {proposal.votes.no}
              </span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(proposal.votes.no / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="bg-red-500 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🤷</span>
              <span className="text-gray-700 dark:text-gray-300">Abstención</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {proposal.votes.abstain}
              </span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(proposal.votes.abstain / (proposal.votes.yes + proposal.votes.no + proposal.votes.abstain)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                  className="bg-gray-500 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Actions */}
      {proposal.status === 'abierta' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tu Voto
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('yes')}
              disabled={voting}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium transition-all duration-300 ${
                selectedVote === 'yes'
                  ? 'bg-green-500 text-white shadow-medium'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              <span className="text-2xl">✅</span>
              <span>Sí</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('no')}
              disabled={voting}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium transition-all duration-300 ${
                selectedVote === 'no'
                  ? 'bg-red-500 text-white shadow-medium'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              <span className="text-2xl">❌</span>
              <span>No</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote('abstain')}
              disabled={voting}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium transition-all duration-300 ${
                selectedVote === 'abstain'
                  ? 'bg-gray-500 text-white shadow-medium'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-2xl">🤷</span>
              <span>Abstención</span>
            </motion.button>
          </div>
          
          {voting && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-governance-600 dark:text-governance-400">
                <div className="w-5 h-5 border-2 border-governance-500 border-t-transparent rounded-full animate-spin"></div>
                Procesando voto...
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Componente de filtros
const GovernanceFilters = ({ filter, setFilter }) => {
  const filters = [
    { id: 'todas', label: 'Todas', icon: '📋' },
    { id: 'abierta', label: 'Abiertas', icon: '🗳️' },
    { id: 'cerrada', label: 'Cerradas', icon: '🔒' },
    { id: 'aprobada', label: 'Aprobadas', icon: '✅' },
    { id: 'rechazada', label: 'Rechazadas', icon: '❌' },
  ];

  const types = [
    { id: 'todas', label: 'Todos los tipos', icon: '📋' },
    { id: 'Economía', label: 'Economía', icon: '💰' },
    { id: 'Educación', label: 'Educación', icon: '📚' },
    { id: 'Gobernanza', label: 'Gobernanza', icon: '⚖️' },
    { id: 'Tecnología', label: 'Tecnología', icon: '🔧' },
    { id: 'Comunidad', label: 'Comunidad', icon: '👥' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search con Glassmorphism */}
      <div className="relative">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Buscar propuestas..."
          className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 shadow-2xl"
        />
        <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-xl">
          🔍
        </span>
      </div>

      {/* Status Filters con Glassmorphism */}
      <div>
        <h4 className="text-base font-bold text-white mb-3" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
          Estado
        </h4>
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.05, rotateY: 3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter({ ...filter, status: f.id })}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all duration-300 border-2 ${
                filter.status === f.id
                  ? 'bg-gradient-to-r from-blue-600/90 to-green-600/90 text-white border-blue-400/50 shadow-2xl'
                  : 'bg-white/10 backdrop-blur-xl text-white/80 border-white/30 hover:bg-white/20 hover:border-white/50'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Type Filters con Glassmorphism */}
      <div>
        <h4 className="text-base font-bold text-white mb-3" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
          Tipo
        </h4>
        <div className="flex flex-wrap gap-3">
          {types.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.05, rotateY: 3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter({ ...filter, type: t.id })}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all duration-300 border-2 ${
                filter.type === t.id
                  ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border-purple-400/50 shadow-2xl'
                  : 'bg-white/10 backdrop-blur-xl text-white/80 border-white/30 hover:bg-white/20 hover:border-white/50'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function GovernancePanel() {
  const { t } = useTranslation();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filter, setFilter] = useState({ status: 'todas', type: 'todas', search: '' });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Datos simulados
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setProposals([
        {
          id: 1,
          title: 'Actualizar tasa de recompensas de staking',
          status: 'abierta',
          votes: { yes: 120, no: 30, abstain: 10 },
          closeDate: '2024-07-30',
          type: 'Economía',
          description: 'Se propone aumentar la tasa de recompensas de staking del 5% al 8% para incentivar la participación en la red. Esta medida ayudará a atraer más validadores y mejorar la seguridad de la red.',
          author: 'Ana García'
        },
        {
          id: 2,
          title: 'Agregar nuevo curso certificado como NFT',
          status: 'cerrada',
          votes: { yes: 200, no: 15, abstain: 5 },
          closeDate: '2024-07-20',
          type: 'Educación',
          description: 'Propuesta para lanzar un nuevo curso sobre Smart Contracts que será certificado como NFT. Esto permitirá a los estudiantes tener credenciales verificables en blockchain.',
          author: 'Carlos López'
        },
        {
          id: 3,
          title: 'Implementar sistema de votación cuadrática',
          status: 'abierta',
          votes: { yes: 80, no: 40, abstain: 20 },
          closeDate: '2024-08-05',
          type: 'Gobernanza',
          description: 'Actualizar el sistema de votación actual a Quadratic Voting para mejorar la representación y evitar la tiranía de la mayoría.',
          author: 'María Rodríguez'
        },
        {
          id: 4,
          title: 'Integrar oráculos de Chainlink',
          status: 'abierta',
          votes: { yes: 95, no: 25, abstain: 15 },
          closeDate: '2024-08-10',
          type: 'Tecnología',
          description: 'Integrar oráculos de Chainlink para mejorar la precisión de los datos externos utilizados en los smart contracts.',
          author: 'David Martínez'
        },
        {
          id: 5,
          title: 'Crear programa de mentores comunitarios',
          status: 'abierta',
          votes: { yes: 150, no: 20, abstain: 10 },
          closeDate: '2024-08-15',
          type: 'Comunidad',
          description: 'Establecer un programa de mentores para ayudar a nuevos usuarios a integrarse en la comunidad y aprender sobre blockchain.',
          author: 'Laura Sánchez'
        },
        {
          id: 6,
          title: 'Reducir comisiones de transacción',
          status: 'aprobada',
          votes: { yes: 180, no: 30, abstain: 5 },
          closeDate: '2024-07-15',
          type: 'Economía',
          description: 'Reducir las comisiones de transacción en un 20% para hacer la plataforma más accesible para usuarios con menos recursos.',
          author: 'Pedro González'
        }
      ]);
      setLoading(false);
    }, 1500);

    // Mostrar alerta después de 4 segundos
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filteredProposals = proposals.filter(proposal =>
    (filter.status === 'todas' || proposal.status === filter.status) &&
    (filter.type === 'todas' || proposal.type === filter.type) &&
    (proposal.title.toLowerCase().includes(filter.search.toLowerCase()) || 
     proposal.description.toLowerCase().includes(filter.search.toLowerCase()))
  );

  const handleVote = (proposalId, vote) => {
    setProposals(proposals.map(p => 
      p.id === proposalId 
        ? { ...p, votes: { ...p.votes, [vote]: p.votes[vote] + 1 } }
        : p
    ));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="governance" particleCount={55} waveCount={8} intensity="high" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
      
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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/90 to-green-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
            >
              <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
              ⚖️ Gobernanza
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Governance
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-white/90 max-w-3xl mx-auto lg:mx-0 font-medium"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}
            >
              Participa en la toma de decisiones de la comunidad. Vota en propuestas, crea nuevas iniciativas y ayuda a dar forma al futuro de BrainSafes.
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
            <NeuralAnimatedGovernanceStats 
              label="Propuestas Activas" 
              value={proposals.filter(p => p.status === 'abierta').length} 
              icon="🗳️" 
              delay={1.0}
              color="blue"
            />
            <NeuralAnimatedGovernanceStats 
              label="Votos Totales" 
              value={proposals.reduce((sum, p) => sum + p.votes.yes + p.votes.no + p.votes.abstain, 0)} 
              icon="📊" 
              delay={1.1}
              color="green"
            />
            <NeuralAnimatedGovernanceStats 
              label="Participación" 
              value="87%" 
              icon="👥" 
              delay={1.2}
              color="purple"
            />
            <NeuralAnimatedGovernanceStats 
              label="Aprobadas" 
              value={proposals.filter(p => p.status === 'aprobada').length} 
              icon="✅" 
              delay={1.3}
              color="orange"
            />
          </div>
        </motion.div>

        {/* Alert con Glassmorphism */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-xl border-2 border-blue-400/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <motion.span 
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔔
                  </motion.span>
                  <div>
                    <div className="font-bold text-white text-lg" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                      Nueva propuesta disponible
                    </div>
                    <div className="text-sm text-white/80 font-medium">
                      Actualiza la lista para ver la propuesta más reciente.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <GovernanceFilters filter={filter} setFilter={setFilter} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Proposals List */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
                      >
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      No se encontraron propuestas
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Intenta ajustar los filtros o crear una nueva propuesta.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProposals.map((proposal, index) => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        onSelect={setSelectedProposal}
                        isSelected={selectedProposal?.id === proposal.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proposal Details */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {selectedProposal ? (
                  <ProposalDetails
                    proposal={selectedProposal}
                    onClose={() => setSelectedProposal(null)}
                    onVote={handleVote}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 text-center"
                  >
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Selecciona una propuesta
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Haz clic en una propuesta para ver sus detalles y votar.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 