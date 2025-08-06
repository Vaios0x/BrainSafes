import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para la gobernanza
const GovernanceParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-governance-400/20 rounded-full"
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
const AnimatedGovernanceStats = ({ label, value, icon, delay = 0 }) => (
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(proposal)}
      className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-governance-500 shadow-large' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-2xl ${isHovered ? 'animate-bounce' : ''}`}>
            {getTypeIcon(proposal.type)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {proposal.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(proposal.status)} text-white`}>
                <span>{getStatusIcon(proposal.status)}</span>
                <span className="capitalize">{proposal.status}</span>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {proposal.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cierra
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date(proposal.closeDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {proposal.description}
      </p>

      {/* Votes Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progreso de votación</span>
          <span>{Math.round(calculateProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-governance-500 to-governance-600 h-2 rounded-full"
          />
        </div>
      </div>

      {/* Vote Counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
          <div className="text-green-600 dark:text-green-400 font-bold text-sm">
            {proposal.votes.yes}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Sí
          </div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
          <div className="text-red-600 dark:text-red-400 font-bold text-sm">
            {proposal.votes.no}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">
            No
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
          <div className="text-gray-600 dark:text-gray-400 font-bold text-sm">
            {proposal.votes.abstain}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Abstención
          </div>
        </div>
      </div>

      {/* Author info */}
      {proposal.author && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-governance-400 to-governance-500 flex items-center justify-center text-white text-xs font-bold">
            {proposal.author.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
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
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Buscar propuestas..."
          className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-governance-500 focus:border-transparent"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estado
        </h4>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter({ ...filter, status: f.id })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter.status === f.id
                  ? 'bg-gradient-to-r from-governance-500 to-governance-600 text-white shadow-medium'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo
        </h4>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter({ ...filter, type: t.id })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter.type === t.id
                  ? 'bg-gradient-to-r from-governance-500 to-governance-600 text-white shadow-medium'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <GovernanceParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-governance-100/80 dark:bg-governance-900/30 backdrop-blur-sm text-governance-700 dark:text-governance-300 rounded-full text-sm font-medium border border-governance-200/50 dark:border-governance-700/50 mb-4"
            >
              ⚖️ Gobernanza
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-governance-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Governance
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Participa en la toma de decisiones de la comunidad. Vota en propuestas, crea nuevas iniciativas y ayuda a dar forma al futuro de BrainSafes.
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
            <AnimatedGovernanceStats 
              label="Propuestas Activas" 
              value={proposals.filter(p => p.status === 'abierta').length} 
              icon="🗳️" 
              delay={1.0}
            />
            <AnimatedGovernanceStats 
              label="Votos Totales" 
              value={proposals.reduce((sum, p) => sum + p.votes.yes + p.votes.no + p.votes.abstain, 0)} 
              icon="📊" 
              delay={1.1}
            />
            <AnimatedGovernanceStats 
              label="Participación" 
              value="87%" 
              icon="👥" 
              delay={1.2}
            />
            <AnimatedGovernanceStats 
              label="Aprobadas" 
              value={proposals.filter(p => p.status === 'aprobada').length} 
              icon="✅" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Alert */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Nueva propuesta disponible
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
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