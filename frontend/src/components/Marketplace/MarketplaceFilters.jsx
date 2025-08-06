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
          className="space-y-4"
        >
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Filter */}
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
                  className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </motion.div>

            {/* Rarity Filter */}
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
                className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 appearance-none"
              >
                {rarezas.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                ⭐
              </span>
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                ▼
              </span>
            </motion.div>

            {/* Status Filter */}
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
                className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 appearance-none"
              >
                {estados.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.icon} {e.label}
                  </option>
                ))}
              </select>
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🏷️
              </span>
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                ▼
              </span>
            </motion.div>

            {/* Advanced Toggle */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-brain-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-brain-600 transition-all duration-300 shadow-medium hover:shadow-large"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        hasActiveFilters
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-medium hover:shadow-large'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Limpiar Filtros 🗑️
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtros activos:</span>
              
              {filtros.nombre && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  Buscar: {filtros.nombre} ✖️
                </motion.span>
              )}
              
              {filtros.rareza !== 'all' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm"
                >
                  Rareza: {rarezas.find(r => r.value === filtros.rareza)?.label} ✖️
                </motion.span>
              )}
              
              {filtros.estado !== 'all' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                >
                  Estado: {estados.find(e => e.value === filtros.estado)?.label} ✖️
                </motion.span>
              )}
              
              {(filtros.precioMin || filtros.precioMax) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
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