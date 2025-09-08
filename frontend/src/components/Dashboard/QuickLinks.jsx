import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AdvancedGlassCard, GlassButton } from '../GlassmorphismEffects';

// Componente de enlace rápido mejorado
const QuickLinkCard = ({ link, index, onHover }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
    whileHover={{ 
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }}
    onHoverStart={() => onHover(index)}
    onHoverEnd={() => onHover(-1)}
    className="group relative"
  >
    <AdvancedGlassCard intensity="high" variant="default" className="p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${link.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="text-4xl group-hover:scale-110 transition-transform duration-300"
            whileHover={{ rotate: 5 }}
          >
            {link.icon}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
            className="text-gray-400 group-hover:text-primary-500 transition-colors duration-300"
          >
            →
          </motion.div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {link.label}
        </h4>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 mb-4">
          {link.description}
        </p>

        {/* Indicador de estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              link.status === 'active' ? 'bg-green-500' : 
              link.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {link.status === 'active' ? 'Activo' : 
               link.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {link.users}+ usuarios
          </span>
        </div>
      </div>
    </AdvancedGlassCard>
  </motion.div>
);

// Componente de acción rápida mejorado
const QuickActionButton = ({ action, index }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={action.action}
    className="group relative"
  >
    <AdvancedGlassCard intensity="medium" variant="default" className="p-4">
      <div className="flex items-center space-x-3">
        <motion.span 
          className="text-2xl"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {action.icon}
        </motion.span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
          {action.label}
        </span>
      </div>
    </AdvancedGlassCard>
  </motion.button>
);

// Componente de estadísticas de enlaces
const LinkStats = ({ links }) => {
  const totalUsers = links.reduce((sum, link) => sum + link.users, 0);
  const activeLinks = links.filter(link => link.status === 'active').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.4 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
    >
      <AdvancedGlassCard intensity="medium" variant="default" className="p-4 text-center">
        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          {links.length}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Secciones Disponibles
        </div>
      </AdvancedGlassCard>
      
      <AdvancedGlassCard intensity="medium" variant="default" className="p-4 text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {activeLinks}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Secciones Activas
        </div>
      </AdvancedGlassCard>
      
      <AdvancedGlassCard intensity="medium" variant="default" className="p-4 text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {totalUsers.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Usuarios Totales
        </div>
      </AdvancedGlassCard>
    </motion.div>
  );
};

const QuickLinks = () => {
  const { t } = useTranslation();
  const [hoveredLink, setHoveredLink] = useState(-1);
  
  const links = [
    { 
      label: "Gobernanza", 
      to: "/gobernanza", 
      icon: "⚖️",
      color: "from-purple-500 to-pink-500",
      description: "Panel de gobernanza y votaciones descentralizadas",
      status: "active",
      users: 1250
    },
    { 
      label: "Marketplace", 
      to: "/marketplace", 
      icon: "🛒",
      color: "from-blue-500 to-cyan-500",
      description: "Marketplace de NFTs y certificados verificables",
      status: "active",
      users: 2100
    },
    { 
      label: "Educación", 
      to: "/educacion", 
      icon: "🎓",
      color: "from-green-500 to-emerald-500",
      description: "Panel de aprendizaje y cursos interactivos",
      status: "active",
      users: 3400
    },
    { 
      label: "Seguridad", 
      to: "/seguridad", 
      icon: "🔒",
      color: "from-red-500 to-orange-500",
      description: "Panel de seguridad y auditoría avanzada",
      status: "maintenance",
      users: 890
    },
    { 
      label: "DeFi", 
      to: "/defi", 
      icon: "💰",
      color: "from-yellow-500 to-orange-500",
      description: "Protocolos DeFi y préstamos descentralizados",
      status: "active",
      users: 1650
    },
    { 
      label: "IA & Analytics", 
      to: "/analytics", 
      icon: "🤖",
      color: "from-indigo-500 to-purple-500",
      description: "Inteligencia artificial y análisis predictivo",
      status: "active",
      users: 980
    },
    { 
      label: "Comunidad", 
      to: "/comunidad", 
      icon: "👥",
      color: "from-teal-500 to-cyan-500",
      description: "Red social y colaboración entre usuarios",
      status: "active",
      users: 4200
    },
    { 
      label: "Desarrollo", 
      to: "/desarrollo", 
      icon: "⚡",
      color: "from-pink-500 to-rose-500",
      description: "Herramientas de desarrollo y APIs",
      status: "active",
      users: 750
    }
  ];

  const quickActions = [
    { label: "Nuevo Certificado", icon: "📜", action: () => console.log("Nuevo certificado") },
    { label: "Solicitar Préstamo", icon: "💰", action: () => console.log("Solicitar préstamo") },
    { label: "Buscar Mentor", icon: "🤝", action: () => console.log("Buscar mentor") },
    { label: "Ver Logros", icon: "🏆", action: () => console.log("Ver logros") },
    { label: "Crear Proyecto", icon: "🚀", action: () => console.log("Crear proyecto") },
    { label: "Unirse a DAO", icon: "🏛️", action: () => console.log("Unirse a DAO") }
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Accesos Rápidos
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl"
          >
            ⚡
          </motion.div>
        </div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          Navega rápidamente a las secciones principales de BrainSafes
        </motion.p>
      </motion.div>

      {/* Estadísticas */}
      <LinkStats links={links} />

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {links.map((link, index) => (
          <QuickLinkCard
            key={link.label}
            link={link}
            index={index}
            onHover={setHoveredLink}
          />
        ))}
      </div>

      {/* Acciones Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mb-8"
      >
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={action.label}
              action={action}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Enlaces Destacados */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enlaces Destacados
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Documentación API",
              description: "Guía completa para desarrolladores",
              icon: "📚",
              color: "from-blue-500 to-cyan-500",
              action: () => console.log("Ver documentación")
            },
            {
              title: "Centro de Ayuda",
              description: "Soporte técnico y FAQ",
              icon: "🆘",
              color: "from-green-500 to-emerald-500",
              action: () => console.log("Ver ayuda")
            }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <AdvancedGlassCard intensity="medium" variant="default" className="p-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={item.action}
                      className="text-gray-400 group-hover:text-primary-500 transition-colors duration-300"
                    >
                      →
                    </motion.button>
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </AdvancedGlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickLinks;