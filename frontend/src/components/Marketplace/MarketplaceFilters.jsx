import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rarezas = [
  { value: 'all', label: 'Todas', icon: '🌟' },
  { value: 'Legendario', label: 'Legendario', icon: '👑' },
  { value: 'Raro', label: 'Raro', icon: '💎' },
  { value: 'Común', label: 'Común', icon: '⭐' },
];

const estados = [
  { value: 'all', label: 'Todos', icon: '📋' },
  { value: 'en venta', label: 'En venta', icon: '🛒' },
  { value: 'vendido', label: 'Vendido', icon: '✅' },
];

export default function MarketplaceFilters({ filtros, setFiltros, visible = true }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFiltros({
      nombre: '',
      rareza: 'all',
      estado: 'all',
      precioMin: '',
      precioMax: '',
    });
  };

  const hasActiveFilters = filtros.nombre || filtros.rareza !== 'all' || filtros.estado !== 'all' || filtros.precioMin || filtros.precioMax;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Filter con Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={filtros.nombre}
                  onChange={handleChange}
                  placeholder="Buscar NFTs..."
                  className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-lg"
                />
                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                  🔍
                </span>
              </div>
            </motion.div>

            {/* Rarity Filter con Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="relative"
            >
              <select
                name="rareza"
                value={filtros.rareza}
                onChange={handleChange}
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 appearance-none shadow-lg"
              >
                {rarezas.map((r) => (
                  <option key={r.value} value={r.value} className="bg-gray-800 text-white">
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
              <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                ⭐
              </span>
              <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                ▼
              </span>
            </motion.div>

            {/* Status Filter con Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative"
            >
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleChange}
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 appearance-none shadow-lg"
              >
                {estados.map((e) => (
                  <option key={e.value} value={e.value} className="bg-gray-800 text-white">
                    {e.icon} {e.label}
                  </option>
                ))}
              </select>
              <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                🏷️
              </span>
              <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                ▼
              </span>
            </motion.div>

            {/* Advanced Toggle con Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {showAdvanced ? 'Ocultar' : 'Avanzado'} ⚙️
              </motion.button>
            </motion.div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/20">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                      Precio Mínimo (ETH)
                    </label>
                    <input
                      type="number"
                      name="precioMin"
                      value={filtros.precioMin}
                      onChange={handleChange}
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                      className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                      Precio Máximo (ETH)
                    </label>
                    <input
                      type="number"
                      name="precioMax"
                      value={filtros.precioMax}
                      onChange={handleChange}
                      placeholder="10.0"
                      step="0.1"
                      min="0"
                      className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-lg"
                    />
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
                        hasActiveFilters
                          ? 'bg-gradient-to-r from-red-600/90 to-red-700/90 backdrop-blur-xl text-white border-red-400/50 shadow-lg hover:shadow-xl'
                          : 'bg-white/10 backdrop-blur-xl text-white/50 border-white/20 cursor-not-allowed'
                      }`}
                    >
                      Limpiar Filtros 🗑️
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display con Glassmorphism */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-3"
            >
              <span className="text-sm font-bold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>Filtros activos:</span>
              
              {filtros.nombre && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-xl text-white rounded-2xl text-sm font-bold border border-white/30 shadow-lg"
                >
                  Buscar: {filtros.nombre} ✖️
                </motion.span>
              )}
              
              {filtros.rareza !== 'all' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-xl text-white rounded-2xl text-sm font-bold border border-white/30 shadow-lg"
                >
                  Rareza: {rarezas.find(r => r.value === filtros.rareza)?.label} ✖️
                </motion.span>
              )}
              
              {filtros.estado !== 'all' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 backdrop-blur-xl text-white rounded-2xl text-sm font-bold border border-white/30 shadow-lg"
                >
                  Estado: {estados.find(e => e.value === filtros.estado)?.label} ✖️
                </motion.span>
              )}
              
              {(filtros.precioMin || filtros.precioMax) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-xl text-white rounded-2xl text-sm font-bold border border-white/30 shadow-lg"
                >
                  Precio: {filtros.precioMin || '0'} - {filtros.precioMax || '∞'} ETH ✖️
                </motion.span>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 