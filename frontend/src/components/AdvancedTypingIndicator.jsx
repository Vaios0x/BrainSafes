import React from 'react';
import { motion } from 'framer-motion';

// Componente de indicador de escritura avanzado con efectos neurales
export const AdvancedTypingIndicator = ({ isVisible = true, className = "" }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className={`flex items-center space-x-2 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar del bot */}
      <motion.div
        className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 flex items-center justify-center"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <span className="text-sm">🤖</span>
      </motion.div>

      {/* Burbuja de chat */}
      <motion.div
        className="bg-gradient-to-br from-gray-800/30 to-gray-700/30 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Puntos animados */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-primary-400 to-brain-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
                y: [0, -4, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Efecto de pulso neural */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/10 to-brain-500/10"
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Efecto de ondas de energía */}
      <motion.div
        className="absolute -inset-4 rounded-full border border-primary-500/20"
        animate={{ 
          scale: [1, 1.5, 2],
          opacity: [0.8, 0.4, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </motion.div>
  );
};

// Componente de indicador de escritura con texto
export const TypingWithText = ({ text = "Escribiendo...", isVisible = true, className = "" }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className={`flex items-center space-x-3 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Avatar animado */}
      <motion.div
        className="relative w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 flex items-center justify-center"
        animate={{ 
          rotate: [0, 360],
          boxShadow: [
            "0 0 20px rgba(59, 130, 246, 0.3)",
            "0 0 40px rgba(59, 130, 246, 0.6)",
            "0 0 20px rgba(59, 130, 246, 0.3)"
          ]
        }}
        transition={{ 
          rotate: { duration: 15, repeat: Infinity, ease: "linear" },
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <span className="text-lg">🧠</span>
        
        {/* Efecto de partículas */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{
              x: [0, Math.cos(i * 120 * Math.PI / 180) * 20],
              y: [0, Math.sin(i * 120 * Math.PI / 180) * 20],
              opacity: [1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>

      {/* Contenedor de texto */}
      <motion.div
        className="bg-gradient-to-br from-gray-800/40 to-gray-700/40 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300 font-medium">{text}</span>
          
          {/* Puntos animados */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-primary-400 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>

        {/* Efecto de brillo */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// Componente de indicador de procesamiento avanzado
export const AdvancedProcessingIndicator = ({ 
  message = "Procesando con IA...", 
  isVisible = true, 
  className = "" 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className={`flex items-center space-x-4 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cerebro animado */}
      <motion.div
        className="relative w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 via-brain-500 to-purple-500 flex items-center justify-center"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)'
        }}
      >
        <span className="text-xl">🧠</span>
        
        {/* Anillos de energía */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary-400/30"
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.8, 0.4, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>

      {/* Contenedor de mensaje */}
      <motion.div
        className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-xl border border-white/10 rounded-3xl px-5 py-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-200 font-medium">{message}</span>
          
          {/* Indicador de progreso */}
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-primary-400 to-brain-400 rounded-full"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>

        {/* Barra de progreso animada */}
        <motion.div
          className="mt-2 h-1 bg-gray-700/50 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-brain-500 rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default {
  AdvancedTypingIndicator,
  TypingWithText,
  AdvancedProcessingIndicator
};
