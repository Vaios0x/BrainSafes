import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para mentoring
const MentoringParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-mentoring-400/20 rounded-full"
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
const AnimatedMentoringStats = ({ label, value, icon, delay = 0 }) => (
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

// Componente de tarjeta de mentor
const MentorCard = ({ mentor, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getExpertiseColor = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return 'from-blue-500 to-indigo-500';
      case 'Smart Contracts': return 'from-purple-500 to-pink-500';
      case 'DeFi': return 'from-green-500 to-emerald-500';
      case 'Security': return 'from-red-500 to-pink-500';
      case 'AI/ML': return 'from-orange-500 to-yellow-500';
      case 'Frontend': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getExpertiseIcon = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return '⛓️';
      case 'Smart Contracts': return '📜';
      case 'DeFi': return '💰';
      case 'Security': return '🛡️';
      case 'AI/ML': return '🤖';
      case 'Frontend': return '🎨';
      default: return '📚';
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'Disponible': return 'text-green-600 dark:text-green-400';
      case 'Ocupado': return 'text-yellow-600 dark:text-yellow-400';
      case 'No disponible': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAvailabilityIcon = (availability) => {
    switch (availability) {
      case 'Disponible': return '🟢';
      case 'Ocupado': return '🟡';
      case 'No disponible': return '🔴';
      default: return '⚪';
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
      onClick={() => onSelect(mentor)}
      className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-mentoring-500 shadow-large' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} flex items-center justify-center text-white text-xl font-bold`}>
            {mentor.avatar || mentor.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {mentor.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} text-white`}>
                <span>{getExpertiseIcon(mentor.expertise)}</span>
                <span>{mentor.expertise}</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-xs ${getAvailabilityColor(mentor.availability)}`}>
                <span>{getAvailabilityIcon(mentor.availability)}</span>
                <span>{mentor.availability}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Rating
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {mentor.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {mentor.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {mentor.sessions}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sesiones
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {mentor.students}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Estudiantes
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {mentor.experience}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Años Exp.
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Habilidades
        </div>
        <div className="flex flex-wrap gap-1">
          {mentor.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {mentor.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
              +{mentor.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
          mentor.availability === 'Disponible'
            ? 'bg-gradient-to-r from-mentoring-500 to-mentoring-600 text-white hover:from-mentoring-600 hover:to-mentoring-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
        disabled={mentor.availability !== 'Disponible'}
      >
        {mentor.availability === 'Disponible' ? 'Solicitar Mentoría' : 'No Disponible'}
      </motion.button>
    </motion.div>
  );
};

// Componente de detalles de mentor
const MentorDetails = ({ mentor, onClose, onRequestMentorship }) => {
  const [requesting, setRequesting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');

  const handleRequest = async () => {
    if (!selectedDate || !selectedTime || !message.trim()) {
      return;
    }

    setRequesting(true);
    
    // Simular solicitud
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onRequestMentorship(mentor.id, {
      date: selectedDate,
      time: selectedTime,
      message
    });
    
    setRequesting(false);
    onClose();
  };

  const getExpertiseColor = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return 'from-blue-500 to-indigo-500';
      case 'Smart Contracts': return 'from-purple-500 to-pink-500';
      case 'DeFi': return 'from-green-500 to-emerald-500';
      case 'Security': return 'from-red-500 to-pink-500';
      case 'AI/ML': return 'from-orange-500 to-yellow-500';
      case 'Frontend': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getExpertiseIcon = (expertise) => {
    switch (expertise) {
      case 'Blockchain': return '⛓️';
      case 'Smart Contracts': return '📜';
      case 'DeFi': return '💰';
      case 'Security': return '🛡️';
      case 'AI/ML': return '🤖';
      case 'Frontend': return '🎨';
      default: return '📚';
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
          Detalles del Mentor
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

      {/* Mentor Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} flex items-center justify-center text-white text-2xl font-bold`}>
          {mentor.avatar || mentor.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {mentor.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getExpertiseColor(mentor.expertise)} text-white`}>
              <span>{getExpertiseIcon(mentor.expertise)}</span>
              <span>{mentor.expertise}</span>
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>⭐</span>
              <span>{mentor.rating}</span>
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {mentor.experience} años de experiencia • {mentor.sessions} sesiones • {mentor.students} estudiantes
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sobre {mentor.name}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {mentor.description}
        </p>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Habilidades
        </h4>
        <div className="flex flex-wrap gap-2">
          {mentor.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Request Form */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Solicitar Mentoría
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-mentoring-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hora
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-mentoring-500 focus:border-transparent"
            >
              <option value="">Seleccionar hora</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mensaje
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe lo que quieres aprender o discutir..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-mentoring-500 focus:border-transparent resize-none"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRequest}
          disabled={requesting || !selectedDate || !selectedTime || !message.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
            requesting || !selectedDate || !selectedTime || !message.trim()
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-mentoring-500 to-mentoring-600 text-white hover:from-mentoring-600 hover:to-mentoring-700'
          }`}
        >
          {requesting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Enviando solicitud...
            </div>
          ) : (
            'Solicitar Mentoría'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

// Componente de filtros
const MentoringFilters = ({ filter, setFilter }) => {
  const filters = [
    { id: 'todos', label: 'Todos', icon: '👥' },
    { id: 'Disponible', label: 'Disponibles', icon: '🟢' },
    { id: 'Ocupado', label: 'Ocupados', icon: '🟡' },
    { id: 'No disponible', label: 'No disponibles', icon: '🔴' },
  ];

  const expertise = [
    { id: 'todos', label: 'Todas las áreas', icon: '📚' },
    { id: 'Blockchain', label: 'Blockchain', icon: '⛓️' },
    { id: 'Smart Contracts', label: 'Smart Contracts', icon: '📜' },
    { id: 'DeFi', label: 'DeFi', icon: '💰' },
    { id: 'Security', label: 'Security', icon: '🛡️' },
    { id: 'AI/ML', label: 'AI/ML', icon: '🤖' },
    { id: 'Frontend', label: 'Frontend', icon: '🎨' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Buscar mentores..."
          className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-mentoring-500 focus:border-transparent"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Disponibilidad
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
                  ? 'bg-gradient-to-r from-mentoring-500 to-mentoring-600 text-white shadow-medium'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Expertise Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Área de Experiencia
        </h4>
        <div className="flex flex-wrap gap-2">
          {expertise.map((e) => (
            <motion.button
              key={e.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter({ ...filter, expertise: e.id })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                filter.expertise === e.id
                  ? 'bg-gradient-to-r from-mentoring-500 to-mentoring-600 text-white shadow-medium'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span>{e.icon}</span>
              <span>{e.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MentorshipPanel() {
  const { t } = useTranslation();
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [filter, setFilter] = useState({ status: 'todos', expertise: 'todos', search: '' });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Datos simulados
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setMentors([
        {
          id: 1,
          name: 'Dr. Ana García',
          expertise: 'Blockchain',
          description: 'Experta en blockchain con 8 años de experiencia. Especializada en Ethereum, Solidity y desarrollo de dApps. Ha trabajado en proyectos DeFi y NFT.',
          rating: 4.9,
          sessions: 156,
          students: 89,
          experience: 8,
          availability: 'Disponible',
          skills: ['Ethereum', 'Solidity', 'DeFi', 'NFTs', 'Web3.js', 'Hardhat']
        },
        {
          id: 2,
          name: 'Carlos López',
          expertise: 'Smart Contracts',
          description: 'Desarrollador senior de smart contracts con experiencia en auditorías de seguridad. Especializado en optimización de gas y patrones de diseño.',
          rating: 4.8,
          sessions: 203,
          students: 124,
          experience: 6,
          availability: 'Ocupado',
          skills: ['Solidity', 'Security', 'Auditing', 'Gas Optimization', 'OpenZeppelin']
        },
        {
          id: 3,
          name: 'María Rodríguez',
          expertise: 'DeFi',
          description: 'Especialista en finanzas descentralizadas con experiencia en protocolos DeFi, yield farming y estrategias de inversión en criptomonedas.',
          rating: 4.7,
          sessions: 98,
          students: 67,
          experience: 5,
          availability: 'Disponible',
          skills: ['DeFi', 'Yield Farming', 'Liquidity Pools', 'Uniswap', 'Compound']
        },
        {
          id: 4,
          name: 'David Martínez',
          expertise: 'Security',
          description: 'Hacker ético y auditor de seguridad blockchain. Especializado en detección de vulnerabilidades y mejores prácticas de seguridad.',
          rating: 4.9,
          sessions: 134,
          students: 92,
          experience: 7,
          availability: 'Disponible',
          skills: ['Security', 'Penetration Testing', 'Auditing', 'Vulnerability Assessment']
        },
        {
          id: 5,
          name: 'Laura Sánchez',
          expertise: 'AI/ML',
          description: 'Investigadora en IA aplicada a blockchain. Experta en oráculos, predicciones on-chain y sistemas de recomendación descentralizados.',
          rating: 4.6,
          sessions: 87,
          students: 54,
          experience: 4,
          availability: 'No disponible',
          skills: ['Machine Learning', 'Oracles', 'Predictions', 'Python', 'TensorFlow']
        },
        {
          id: 6,
          name: 'Pedro González',
          expertise: 'Frontend',
          description: 'Desarrollador frontend especializado en aplicaciones Web3. Experto en React, dApps y integración con wallets.',
          rating: 4.5,
          sessions: 112,
          students: 78,
          experience: 5,
          availability: 'Disponible',
          skills: ['React', 'Web3.js', 'Ethers.js', 'Wagmi', 'Tailwind CSS']
        }
      ]);
      setLoading(false);
    }, 1500);

    // Mostrar alerta después de 4 segundos
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filteredMentors = mentors.filter(mentor =>
    (filter.status === 'todos' || mentor.availability === filter.status) &&
    (filter.expertise === 'todos' || mentor.expertise === filter.expertise) &&
    (mentor.name.toLowerCase().includes(filter.search.toLowerCase()) || 
     mentor.description.toLowerCase().includes(filter.search.toLowerCase()) ||
     mentor.skills.some(skill => skill.toLowerCase().includes(filter.search.toLowerCase())))
  );

  const handleRequestMentorship = (mentorId, requestData) => {
    // Simular solicitud de mentoría
    console.log('Solicitud de mentoría:', { mentorId, ...requestData });
    // Aquí se enviaría la solicitud al backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <MentoringParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-mentoring-100/80 dark:bg-mentoring-900/30 backdrop-blur-sm text-mentoring-700 dark:text-mentoring-300 rounded-full text-sm font-medium border border-mentoring-200/50 dark:border-mentoring-700/50 mb-4"
            >
              🎓 Mentoría
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-mentoring-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Mentoring
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Conecta con expertos en blockchain y tecnología. Aprende de mentores certificados que te guiarán en tu camino hacia el dominio de las tecnologías descentralizadas.
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
            <AnimatedMentoringStats 
              label="Mentores Activos" 
              value={mentors.filter(m => m.availability === 'Disponible').length} 
              icon="👥" 
              delay={1.0}
            />
            <AnimatedMentoringStats 
              label="Sesiones Realizadas" 
              value={mentors.reduce((sum, m) => sum + m.sessions, 0)} 
              icon="📚" 
              delay={1.1}
            />
            <AnimatedMentoringStats 
              label="Estudiantes Satisfechos" 
              value={mentors.reduce((sum, m) => sum + m.students, 0)} 
              icon="🎓" 
              delay={1.2}
            />
            <AnimatedMentoringStats 
              label="Rating Promedio" 
              value="4.7⭐" 
              icon="⭐" 
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
                  <span className="text-2xl">🎓</span>
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Nuevo mentor disponible
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Dr. Ana García se ha unido como mentora en Blockchain.
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
          <MentoringFilters filter={filter} setFilter={setFilter} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mentors List */}
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
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">🎓</div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      No se encontraron mentores
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Intenta ajustar los filtros o contacta con soporte.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMentors.map((mentor, index) => (
                      <MentorCard
                        key={mentor.id}
                        mentor={mentor}
                        onSelect={setSelectedMentor}
                        isSelected={selectedMentor?.id === mentor.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mentor Details */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {selectedMentor ? (
                  <MentorDetails
                    mentor={selectedMentor}
                    onClose={() => setSelectedMentor(null)}
                    onRequestMentorship={handleRequestMentorship}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 text-center"
                  >
                    <div className="text-4xl mb-4">🎓</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Selecciona un mentor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Haz clic en un mentor para ver sus detalles y solicitar una sesión de mentoría.
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