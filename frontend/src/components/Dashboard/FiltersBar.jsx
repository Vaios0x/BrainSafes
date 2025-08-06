import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const usuariosSimulados = [
  { id: "all", nombre: "Todos" },
  { id: "0x123", nombre: "Alice" },
  { id: "0x456", nombre: "Bob" },
  { id: "0x789", nombre: "Charlie" },
];

const FiltersBar = ({ filtros, setFiltros }) => {
  const { t } = useTranslation();
  
  const tiposEvento = [
    { value: "all", label: "Todos" },
    { value: "error", label: "Errores" },
    { value: "warning", label: "Advertencias" },
    { value: "info", label: "Información" },
  ];

  const usuarios = usuariosSimulados.map(u => ({ 
    ...u, 
    nombre: u.id === "all" ? "Todos" : u.nombre 
  }));

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Filtro de Fecha */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-primary-500">📅</span>
            </div>
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              placeholder="dd/mm/aaaa"
            />
          </div>
        </motion.div>

        {/* Filtro de Tipo de Evento */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-primary-500">🔍</span>
            </div>
            <select
              name="tipoEvento"
              value={filtros.tipoEvento}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 appearance-none"
            >
              {tiposEvento.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">▼</span>
            </div>
          </div>
        </motion.div>

        {/* Filtro de Usuario */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Usuario
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-primary-500">👤</span>
            </div>
            <select
              name="usuario"
              value={filtros.usuario}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 appearance-none"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">▼</span>
            </div>
          </div>
        </motion.div>

        {/* Botón de Limpiar Filtros */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFiltros({ fecha: "", tipoEvento: "all", usuario: "all" })}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
          >
            Limpiar
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FiltersBar; 