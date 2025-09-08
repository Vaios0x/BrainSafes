import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Footer from './Footer';
import { AdvancedGlassCard } from './GlassmorphismEffects';

// Componente de demostración del footer
export default function FooterDemo() {
  const [activeDemo, setActiveDemo] = useState('all');

  const demoOptions = [
    { id: 'all', label: 'Todos los Efectos', description: 'Muestra todos los efectos neurales y glassmorphism' },
    { id: 'neural', label: 'Solo Efectos Neurales', description: 'Solo red neuronal y partículas' },
    { id: 'glass', label: 'Solo Glassmorphism', description: 'Solo efectos de vidrio esmerilado' },
    { id: 'parallax', label: 'Solo Parallax', description: 'Solo efectos de parallax y profundidad' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header de demostración */}
      <div className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-primary-400 to-brain-400 bg-clip-text text-transparent">
                Footer Demo
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Demostración de las mejoras implementadas en el footer de BrainSafes
            </p>
          </motion.div>

          {/* Opciones de demostración */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {demoOptions.map((option, index) => (
              <motion.button
                key={option.id}
                onClick={() => setActiveDemo(option.id)}
                className={`p-4 rounded-xl text-left transition-all duration-300 ${
                  activeDemo === option.id
                    ? 'bg-primary-500/20 border border-primary-500/50'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-semibold text-white mb-2">{option.label}</h3>
                <p className="text-sm text-gray-300">{option.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Información de características */}
          <AdvancedGlassCard intensity="high" variant="primary" className="p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-brain-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Efectos Neurales</h3>
                <p className="text-sm text-gray-300">
                  Red neuronal 3D, partículas cuánticas y ondas de energía
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-brain-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Glassmorphism</h3>
                <p className="text-sm text-gray-300">
                  Efectos de vidrio esmerilado con transparencias y blur
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌊</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Parallax</h3>
                <p className="text-sm text-gray-300">
                  Efectos de profundidad y scroll parallax
                </p>
              </div>
            </div>
          </AdvancedGlassCard>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">15KB</div>
              <div className="text-sm text-gray-400">Bundle Size</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brain-400">60fps</div>
              <div className="text-sm text-gray-400">Performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">100%</div>
              <div className="text-sm text-gray-400">Responsive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">2025</div>
              <div className="text-sm text-gray-400">Año</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de demostración */}
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AdvancedGlassCard intensity="medium" variant="default" className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Características Implementadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-400 mb-3">
                  🎨 Efectos Visuales
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Glassmorphism avanzado</li>
                  <li>• Red neuronal 3D animada</li>
                  <li>• Partículas cuánticas</li>
                  <li>• Ondas de energía</li>
                  <li>• Efectos de parallax</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brain-400 mb-3">
                  ⚡ Performance
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• GPU-accelerated</li>
                  <li>• RequestAnimationFrame</li>
                  <li>• Lazy loading</li>
                  <li>• Optimización de memoria</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>
          </AdvancedGlassCard>

          <AdvancedGlassCard intensity="medium" variant="default" className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Información del Desarrollador
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-brain-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💻</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">@Vai0sx</h3>
                <p className="text-gray-300">
                  Desarrollador Full Stack con 20 años de experiencia
                </p>
                <a 
                  href="https://t.me/Vai0sx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-300"
                >
                  https://t.me/Vai0sx
                </a>
              </div>
            </div>
          </AdvancedGlassCard>
        </div>
      </div>

      {/* Footer con efectos */}
      <Footer />
    </div>
  );
}
