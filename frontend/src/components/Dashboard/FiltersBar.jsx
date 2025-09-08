import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AdvancedGlassCard, GlassButton } from '../GlassmorphismEffects';

// Componente de filtro individual mejorado
const FilterField = ({ label, icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    className="flex-1"
  >
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      <span className="flex items-center space-x-2">
        <span className="text-primary-500">{icon}</span>
        <span>{label}</span>
      </span>
    </label>
    <div className="relative">
      {children}
    </div>
  </motion.div>
);

// Componente de input con efectos neurales
const NeuralInput = ({ type, name, value, onChange, placeholder, icon, options = null }) => (
  <motion.div
    className="relative group"
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
      <span className="text-primary-500 text-lg">{icon}</span>
    </div>
    
    {type === 'select' ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full pl-12 pr-10 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 appearance-none shadow-sm hover:shadow-md"
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
      />
    )}
    
    {type === 'select' && (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <motion.span 
          className="text-gray-400"
          animate={{ rotate: [0, 180, 0] }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </div>
    )}
    
    {/* Efecto de brillo en hover */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  </motion.div>
);

// Componente de filtros activos
const ActiveFilters = ({ filtros, onClear }) => {
  const activeFilters = Object.entries(filtros).filter(([key, value]) => 
    value && value !== 'all' && value !== ''
  );

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <div className="flex items-center space-x-2 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filtros activos:</span>
        {activeFilters.map(([key, value]) => (
          <motion.span
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium"
          >
            {key}: {value}
            <button
              onClick={() => onClear(key)}
              className="ml-2 text-primary-500 hover:text-primary-700 dark:hover:text-primary-200"
            >
              ×
            </button>
          </motion.span>
        ))}
        <GlassButton
          variant="secondary"
          size="small"
          onClick={() => onClear('all')}
        >
          Limpiar Todo
        </GlassButton>
      </div>
    </motion.div>
  );
};

// Componente de estadísticas de filtros
const FilterStats = ({ filtros }) => {
  const stats = [
    { label: 'Filtros Activos', value: Object.values(filtros).filter(v => v && v !== 'all' && v !== '').length, color: 'text-primary-600' },
    { label: 'Resultados', value: Math.floor(Math.random() * 1000) + 100, color: 'text-green-600' },
    { label: 'Última Actualización', value: new Date().toLocaleTimeString(), color: 'text-blue-600' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="grid grid-cols-3 gap-4 mb-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
          className="text-center"
        >
          <AdvancedGlassCard intensity="low" variant="default" className="p-3">
            <div className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </AdvancedGlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
};

const usuariosSimulados = [
  { id: "all", nombre: "Todos" },
  { id: "0x123", nombre: "Alice" },
  { id: "0x456", nombre: "Bob" },
  { id: "0x789", nombre: "Charlie" },
  { id: "0xabc", nombre: "Diana" },
  { id: "0xdef", nombre: "Eve" }
];

const FiltersBar = ({ filtros, setFiltros }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tiposEvento = [
    { value: "all", label: "Todos" },
    { value: "error", label: "Errores" },
    { value: "warning", label: "Advertencias" },
    { value: "info", label: "Información" },
    { value: "success", label: "Éxitos" },
    { value: "transaction", label: "Transacciones" },
    { value: "certificate", label: "Certificados" }
  ];

  const usuarios = usuariosSimulados.map(u => ({ 
    ...u, 
    nombre: u.id === "all" ? "Todos" : u.nombre 
  }));

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const clearFilter = (key) => {
    if (key === 'all') {
      setFiltros({ fecha: "", tipoEvento: "all", usuario: "all" });
    } else {
      setFiltros({ ...filtros, [key]: key === 'tipoEvento' || key === 'usuario' ? 'all' : '' });
    }
  };

  const activeFiltersCount = Object.values(filtros).filter(v => v && v !== 'all' && v !== '').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Filtros Avanzados
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Personaliza tu vista del dashboard
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors duration-200"
        >
          <span>{isExpanded ? 'Contraer' : 'Expandir'}</span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ▼
          </motion.span>
        </motion.button>
      </div>

      {/* Estadísticas */}
      <FilterStats filtros={filtros} />

      {/* Filtros activos */}
      <AnimatePresence>
        <ActiveFilters filtros={filtros} onClear={clearFilter} />
      </AnimatePresence>

      {/* Filtros principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-6"
      >
        <AdvancedGlassCard intensity="medium" variant="default" className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            {/* Filtro de Fecha */}
            <FilterField label="Fecha" icon="📅" delay={0.1}>
              <NeuralInput
                type="date"
                name="fecha"
                value={filtros.fecha}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
                icon="📅"
              />
            </FilterField>

            {/* Filtro de Tipo de Evento */}
            <FilterField label="Tipo de Evento" icon="🔍" delay={0.2}>
              <NeuralInput
                type="select"
                name="tipoEvento"
                value={filtros.tipoEvento}
                onChange={handleChange}
                options={tiposEvento}
                icon="🔍"
              />
            </FilterField>

            {/* Filtro de Usuario */}
            <FilterField label="Usuario" icon="👤" delay={0.3}>
              <NeuralInput
                type="select"
                name="usuario"
                value={filtros.usuario}
                onChange={handleChange}
                options={usuarios}
                icon="👤"
              />
            </FilterField>

            {/* Botón de Limpiar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-end"
            >
              <GlassButton
                variant="secondary"
                onClick={() => clearFilter('all')}
                className="w-full lg:w-auto"
              >
                Limpiar Filtros
              </GlassButton>
            </motion.div>
          </div>
        </AdvancedGlassCard>
      </motion.div>

      {/* Filtros expandidos */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <AdvancedGlassCard intensity="low" variant="default" className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filtros Adicionales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro de Rango de Fechas */}
                <FilterField label="Rango de Fechas" icon="📊" delay={0.5}>
                  <div className="flex space-x-2">
                    <NeuralInput
                      type="date"
                      name="fechaInicio"
                      value={filtros.fechaInicio || ''}
                      onChange={handleChange}
                      placeholder="Inicio"
                      icon="📅"
                    />
                    <NeuralInput
                      type="date"
                      name="fechaFin"
                      value={filtros.fechaFin || ''}
                      onChange={handleChange}
                      placeholder="Fin"
                      icon="📅"
                    />
                  </div>
                </FilterField>

                {/* Filtro de Estado */}
                <FilterField label="Estado" icon="⚡" delay={0.6}>
                  <NeuralInput
                    type="select"
                    name="estado"
                    value={filtros.estado || 'all'}
                    onChange={handleChange}
                    options={[
                      { value: 'all', label: 'Todos' },
                      { value: 'active', label: 'Activo' },
                      { value: 'pending', label: 'Pendiente' },
                      { value: 'completed', label: 'Completado' },
                      { value: 'failed', label: 'Fallido' }
                    ]}
                    icon="⚡"
                  />
                </FilterField>

                {/* Filtro de Prioridad */}
                <FilterField label="Prioridad" icon="🎯" delay={0.7}>
                  <NeuralInput
                    type="select"
                    name="prioridad"
                    value={filtros.prioridad || 'all'}
                    onChange={handleChange}
                    options={[
                      { value: 'all', label: 'Todas' },
                      { value: 'low', label: 'Baja' },
                      { value: 'medium', label: 'Media' },
                      { value: 'high', label: 'Alta' },
                      { value: 'critical', label: 'Crítica' }
                    ]}
                    icon="🎯"
                  />
                </FilterField>
              </div>
            </AdvancedGlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen de filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-6"
      >
        <AdvancedGlassCard intensity="low" variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${activeFiltersCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {activeFiltersCount > 0 ? `${activeFiltersCount} filtros activos` : 'Sin filtros activos'}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Última actualización: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex space-x-2">
              <GlassButton
                variant="secondary"
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Menos Opciones' : 'Más Opciones'}
              </GlassButton>
              <GlassButton
                variant="primary"
                size="small"
                onClick={() => console.log('Aplicar filtros')}
              >
                Aplicar
              </GlassButton>
            </div>
          </div>
        </AdvancedGlassCard>
      </motion.div>
    </motion.div>
  );
};

export default FiltersBar;