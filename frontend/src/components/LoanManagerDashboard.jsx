import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para loans
const LoansParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-loans-400/20 rounded-full"
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
const AnimatedLoansStats = ({ label, value, icon, delay = 0 }) => (
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

// Componente de tarjeta de préstamo
const LoanCard = ({ loan, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return 'from-green-500 to-emerald-500';
      case 'Pendiente': return 'from-yellow-500 to-orange-500';
      case 'Rechazado': return 'from-red-500 to-pink-500';
      case 'Completado': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Activo': return '✅';
      case 'Pendiente': return '⏳';
      case 'Rechazado': return '❌';
      case 'Completado': return '🎉';
      default: return '📋';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Educativo': return '📚';
      case 'Desarrollo': return '💻';
      case 'Emprendimiento': return '🚀';
      case 'Investigación': return '🔬';
      case 'Certificación': return '🎓';
      default: return '💰';
    }
  };

  const calculateProgress = () => {
    const total = loan.amount;
    const paid = loan.amount - loan.remaining;
    return total > 0 ? (paid / total) * 100 : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(loan)}
      className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-loans-500 shadow-large' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-2xl ${isHovered ? 'animate-bounce' : ''}`}>
            {getTypeIcon(loan.type)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {loan.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(loan.status)} text-white`}>
                <span>{getStatusIcon(loan.status)}</span>
                <span>{loan.status}</span>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {loan.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tasa
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {loan.interestRate}%
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {loan.description}
      </p>

      {/* Amount Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Monto
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${loan.amount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Restante
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            ${loan.remaining.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progreso de pago</span>
          <span>{Math.round(calculateProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-loans-500 to-loans-600 h-2 rounded-full"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Inicio</div>
          <div className="text-gray-900 dark:text-white font-medium">
            {new Date(loan.startDate).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Vencimiento</div>
          <div className="text-gray-900 dark:text-white font-medium">
            {new Date(loan.dueDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
          loan.status === 'Activo'
            ? 'bg-gradient-to-r from-loans-500 to-loans-600 text-white hover:from-loans-600 hover:to-loans-700'
            : loan.status === 'Pendiente'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
        disabled={loan.status === 'Rechazado' || loan.status === 'Completado'}
      >
        {loan.status === 'Activo' ? 'Realizar Pago' : 
         loan.status === 'Pendiente' ? 'Ver Detalles' : 
         loan.status === 'Completado' ? 'Completado' : 'Rechazado'}
      </motion.button>
    </motion.div>
  );
};

// Componente de detalles de préstamo
const LoanDetails = ({ loan, onClose, onMakePayment }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [makingPayment, setMakingPayment] = useState(false);

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return;
    }

    setMakingPayment(true);
    
    // Simular pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onMakePayment(loan.id, parseFloat(paymentAmount));
    
    setMakingPayment(false);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return 'from-green-500 to-emerald-500';
      case 'Pendiente': return 'from-yellow-500 to-orange-500';
      case 'Rechazado': return 'from-red-500 to-pink-500';
      case 'Completado': return 'from-blue-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Activo': return '✅';
      case 'Pendiente': return '⏳';
      case 'Rechazado': return '❌';
      case 'Completado': return '🎉';
      default: return '📋';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Educativo': return '📚';
      case 'Desarrollo': return '💻';
      case 'Emprendimiento': return '🚀';
      case 'Investigación': return '🔬';
      case 'Certificación': return '🎓';
      default: return '💰';
    }
  };

  const calculateProgress = () => {
    const total = loan.amount;
    const paid = loan.amount - loan.remaining;
    return total > 0 ? (paid / total) * 100 : 0;
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
          Detalles del Préstamo
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

      {/* Loan Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getStatusColor(loan.status)} flex items-center justify-center text-white text-2xl`}>
          {getTypeIcon(loan.type)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {loan.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(loan.status)} text-white`}>
              <span>{getStatusIcon(loan.status)}</span>
              <span>{loan.status}</span>
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loan.type}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Tasa: {loan.interestRate}% • Duración: {loan.duration} meses
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Descripción
        </h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {loan.description}
        </p>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Monto Original
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            ${loan.amount.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Saldo Restante
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            ${loan.remaining.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Pagado
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            ${(loan.amount - loan.remaining).toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Próximo Pago
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            ${loan.nextPayment?.toLocaleString() || 'N/A'}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progreso de Pago</span>
          <span>{Math.round(calculateProgress())}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-gradient-to-r from-loans-500 to-loans-600 h-3 rounded-full"
          />
        </div>
      </div>

      {/* Payment Form */}
      {loan.status === 'Activo' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Realizar Pago
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto a Pagar
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Ingresa el monto"
              min="0"
              max={loan.remaining}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-loans-500 focus:border-transparent"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={makingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
              makingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-loans-500 to-loans-600 text-white hover:from-loans-600 hover:to-loans-700'
            }`}
          >
            {makingPayment ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando pago...
              </div>
            ) : (
              'Realizar Pago'
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

// Componente de filtros
const LoansFilters = ({ filter, setFilter }) => {
  const filters = [
    { id: 'todos', label: 'Todos', icon: '📋' },
    { id: 'Activo', label: 'Activos', icon: '✅' },
    { id: 'Pendiente', label: 'Pendientes', icon: '⏳' },
    { id: 'Completado', label: 'Completados', icon: '🎉' },
    { id: 'Rechazado', label: 'Rechazados', icon: '❌' },
  ];

  const types = [
    { id: 'todos', label: 'Todos los tipos', icon: '💰' },
    { id: 'Educativo', label: 'Educativo', icon: '📚' },
    { id: 'Desarrollo', label: 'Desarrollo', icon: '💻' },
    { id: 'Emprendimiento', label: 'Emprendimiento', icon: '🚀' },
    { id: 'Investigación', label: 'Investigación', icon: '🔬' },
    { id: 'Certificación', label: 'Certificación', icon: '🎓' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Buscar préstamos..."
          className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-loans-500 focus:border-transparent"
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
                  ? 'bg-gradient-to-r from-loans-500 to-loans-600 text-white shadow-medium'
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
          Tipo de Préstamo
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
                  ? 'bg-gradient-to-r from-loans-500 to-loans-600 text-white shadow-medium'
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

export default function LoanManagerDashboard() {
  const { t } = useTranslation();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filter, setFilter] = useState({ status: 'todos', type: 'todos', search: '' });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  // Datos simulados
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoans([
        {
          id: 1,
          title: 'Préstamo para Certificación Blockchain',
          type: 'Educativo',
          status: 'Activo',
          amount: 5000,
          remaining: 3200,
          interestRate: 8.5,
          duration: 12,
          startDate: '2024-01-15',
          dueDate: '2024-12-15',
          nextPayment: 450,
          description: 'Préstamo para obtener certificación en desarrollo de smart contracts y dApps en Ethereum.'
        },
        {
          id: 2,
          title: 'Financiamiento para Proyecto DeFi',
          type: 'Emprendimiento',
          status: 'Pendiente',
          amount: 15000,
          remaining: 15000,
          interestRate: 12.0,
          duration: 18,
          startDate: '2024-03-01',
          dueDate: '2025-08-01',
          nextPayment: null,
          description: 'Financiamiento para desarrollar un protocolo DeFi innovador con yield farming y staking.'
        },
        {
          id: 3,
          title: 'Préstamo para Investigación en IA',
          type: 'Investigación',
          status: 'Activo',
          amount: 8000,
          remaining: 1200,
          interestRate: 6.5,
          duration: 24,
          startDate: '2023-09-01',
          dueDate: '2025-08-01',
          nextPayment: 300,
          description: 'Financiamiento para investigación en inteligencia artificial aplicada a oráculos blockchain.'
        },
        {
          id: 4,
          title: 'Desarrollo de Plataforma Educativa',
          type: 'Desarrollo',
          status: 'Completado',
          amount: 3000,
          remaining: 0,
          interestRate: 7.0,
          duration: 6,
          startDate: '2023-12-01',
          dueDate: '2024-05-01',
          nextPayment: null,
          description: 'Préstamo para desarrollar una plataforma educativa de blockchain con cursos interactivos.'
        },
        {
          id: 5,
          title: 'Certificación en Seguridad Web3',
          type: 'Certificación',
          status: 'Activo',
          amount: 2500,
          remaining: 1800,
          interestRate: 9.0,
          duration: 8,
          startDate: '2024-02-01',
          dueDate: '2024-09-01',
          nextPayment: 250,
          description: 'Financiamiento para certificación en auditoría de seguridad de smart contracts.'
        },
        {
          id: 6,
          title: 'Proyecto de NFT Marketplace',
          type: 'Emprendimiento',
          status: 'Rechazado',
          amount: 20000,
          remaining: 20000,
          interestRate: 15.0,
          duration: 36,
          startDate: '2024-01-01',
          dueDate: '2026-12-01',
          nextPayment: null,
          description: 'Financiamiento para crear un marketplace de NFTs con funcionalidades avanzadas.'
        }
      ]);
      setLoading(false);
    }, 1500);

    // Mostrar alerta después de 4 segundos
    const timer = setTimeout(() => setShowAlert(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const filteredLoans = loans.filter(loan =>
    (filter.status === 'todos' || loan.status === filter.status) &&
    (filter.type === 'todos' || loan.type === filter.type) &&
    (loan.title.toLowerCase().includes(filter.search.toLowerCase()) || 
     loan.description.toLowerCase().includes(filter.search.toLowerCase()))
  );

  const handleMakePayment = (loanId, amount) => {
    // Simular pago
    setLoans(loans.map(loan => 
      loan.id === loanId 
        ? { ...loan, remaining: Math.max(0, loan.remaining - amount) }
        : loan
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <LoansParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-loans-100/80 dark:bg-loans-900/30 backdrop-blur-sm text-loans-700 dark:text-loans-300 rounded-full text-sm font-medium border border-loans-200/50 dark:border-loans-700/50 mb-4"
            >
              💰 Préstamos
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-loans-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Loans
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Gestiona tus préstamos DeFi de manera inteligente. Accede a financiamiento para educación, desarrollo y emprendimiento con las mejores tasas del mercado.
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
            <AnimatedLoansStats 
              label="Préstamos Activos" 
              value={loans.filter(l => l.status === 'Activo').length} 
              icon="✅" 
              delay={1.0}
            />
            <AnimatedLoansStats 
              label="Total Prestado" 
              value={`$${loans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}`} 
              icon="💰" 
              delay={1.1}
            />
            <AnimatedLoansStats 
              label="Saldo Restante" 
              value={`$${loans.reduce((sum, l) => sum + l.remaining, 0).toLocaleString()}`} 
              icon="📊" 
              delay={1.2}
            />
            <AnimatedLoansStats 
              label="Tasa Promedio" 
              value={`${(loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length).toFixed(1)}%`} 
              icon="📈" 
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
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      Nuevo préstamo disponible
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Préstamo para desarrollo de dApps con tasa preferencial.
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
          <LoansFilters filter={filter} setFilter={setFilter} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loans List */}
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
                ) : filteredLoans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      No se encontraron préstamos
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Intenta ajustar los filtros o solicita un nuevo préstamo.
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLoans.map((loan, index) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        onSelect={setSelectedLoan}
                        isSelected={selectedLoan?.id === loan.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Loan Details */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {selectedLoan ? (
                  <LoanDetails
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                    onMakePayment={handleMakePayment}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 text-center"
                  >
                    <div className="text-4xl mb-4">💰</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Selecciona un préstamo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Haz clic en un préstamo para ver sus detalles y realizar pagos.
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