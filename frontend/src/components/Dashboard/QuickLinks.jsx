import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const QuickLinks = () => {
  const { t } = useTranslation();
  
  const links = [
    { 
      label: "Gobernanza", 
      to: "/gobernanza", 
      icon: "⚖️",
      color: "from-purple-500 to-pink-500",
      description: "Panel de gobernanza y votaciones"
    },
    { 
      label: "Marketplace", 
      to: "/marketplace", 
      icon: "🛒",
      color: "from-blue-500 to-cyan-500",
      description: "Marketplace de NFTs y certificados"
    },
    { 
      label: "Educación", 
      to: "/educacion", 
      icon: "🎓",
      color: "from-green-500 to-emerald-500",
      description: "Panel de aprendizaje y cursos"
    },
    { 
      label: "Seguridad", 
      to: "/seguridad", 
      icon: "🔒",
      color: "from-red-500 to-orange-500",
      description: "Panel de seguridad y auditoría"
    },
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
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Accesos Rápidos
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl"
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

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((link, index) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
            whileHover={{ 
              scale: 1.05,
              y: -5,
              transition: { duration: 0.3 }
            }}
            className="group"
          >
            <motion.a
              href={link.to}
              className={`block p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:shadow-large transition-all duration-500 group-hover:shadow-large`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${link.color} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <motion.div 
                    className="text-3xl group-hover:scale-110 transition-transform duration-300"
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
                
                <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                  {link.description}
                </p>
              </div>
            </motion.a>
          </motion.div>
        ))}
      </div>

      {/* Additional Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mt-8"
      >
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Nuevo Certificado", icon: "📜", action: () => console.log("Nuevo certificado") },
            { label: "Solicitar Préstamo", icon: "💰", action: () => console.log("Solicitar préstamo") },
            { label: "Buscar Mentor", icon: "🤝", action: () => console.log("Buscar mentor") },
            { label: "Ver Logros", icon: "🏆", action: () => console.log("Ver logros") }
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-left"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickLinks; 