import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AdvancedGlassCard, 
  GlassButton, 
  GlassInput 
} from './GlassmorphismEffects';
import { ChatbotNeuralEffects } from './ChatbotNeuralEffects';
import { 
  NeuralText, 
  TypewriterText, 
  ParticleText, 
  GlitchText, 
  HologramText, 
  MatrixText 
} from './NeuralTextEffects';
import { 
  ChatbotParticleSystem, 
  InteractiveParticles, 
  ParticleExplosion 
} from './ChatbotParticleSystem';

// Componente de demostración del chatbot mejorado
const ChatbotDemo = () => {
  const [activeDemo, setActiveDemo] = useState('neural');
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionCoords, setExplosionCoords] = useState({ x: 0, y: 0 });

  const demos = [
    { id: 'neural', name: 'Efectos Neurales', component: 'NeuralText' },
    { id: 'typewriter', name: 'Máquina de Escribir', component: 'TypewriterText' },
    { id: 'particles', name: 'Partículas', component: 'ParticleText' },
    { id: 'glitch', name: 'Glitch', component: 'GlitchText' },
    { id: 'hologram', name: 'Holograma', component: 'HologramText' },
    { id: 'matrix', name: 'Matrix', component: 'MatrixText' }
  ];

  const handleDemoClick = (demoId) => {
    setActiveDemo(demoId);
    
    // Trigger explosion effect
    setExplosionCoords({ 
      x: Math.random() * 400, 
      y: Math.random() * 300 
    });
    setShowExplosion(true);
    setTimeout(() => setShowExplosion(false), 1000);
  };

  const renderTextEffect = () => {
    const text = "BrainSafes AI";
    
    switch (activeDemo) {
      case 'neural':
        return <NeuralText text={text} variant="neural" className="text-4xl font-bold text-white" />;
      case 'typewriter':
        return <TypewriterText text={text} speed={150} className="text-4xl font-bold text-white" />;
      case 'particles':
        return <ParticleText text={text} className="text-4xl font-bold text-white" />;
      case 'glitch':
        return <GlitchText text={text} glitchIntensity={0.2} className="text-4xl font-bold text-white" />;
      case 'hologram':
        return <HologramText text={text} className="text-4xl font-bold text-white" />;
      case 'matrix':
        return <MatrixText text={text} className="text-4xl font-bold text-white" />;
      default:
        return <span className="text-4xl font-bold text-white">{text}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
      {/* Efectos de fondo */}
      <ChatbotNeuralEffects 
        showNetwork={true}
        showParticles={true}
        showWaves={true}
        className="opacity-30"
      />
      
      {/* Partículas interactivas */}
      <InteractiveParticles 
        particleCount={30}
        className="opacity-40"
      />
      
      {/* Explosión de partículas */}
      <ParticleExplosion 
        trigger={showExplosion}
        x={explosionCoords.x}
        y={explosionCoords.y}
        particleCount={50}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold mb-4">
            <NeuralText 
              text="Chatbot BrainSafes" 
              variant="neural" 
              className="bg-gradient-to-r from-primary-400 to-brain-400 bg-clip-text text-transparent"
            />
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            <TypewriterText 
              text="Demostración de efectos neurales avanzados con glassmorphism y animaciones de última generación"
              speed={50}
              className="text-gray-300"
            />
          </p>
        </motion.div>

        {/* Panel principal */}
        <AdvancedGlassCard
          className="p-8 mb-8"
          intensity="high"
          variant="primary"
        >
          {/* Navegación de demos */}
          <div className="flex flex-wrap gap-3 mb-8">
            {demos.map((demo) => (
              <GlassButton
                key={demo.id}
                onClick={() => handleDemoClick(demo.id)}
                variant={activeDemo === demo.id ? "primary" : "secondary"}
                className="px-4 py-2 text-sm"
              >
                {demo.name}
              </GlassButton>
            ))}
          </div>

          {/* Área de demostración */}
          <div className="relative min-h-[400px] flex items-center justify-center">
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {renderTextEffect()}
            </motion.div>
          </div>
        </AdvancedGlassCard>

        {/* Características */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Glassmorphism Avanzado",
              description: "Efectos de cristal translúcido con blur dinámico y bordes animados",
              icon: "🔮"
            },
            {
              title: "Efectos Neurales",
              description: "Red neuronal 3D con partículas cuánticas y ondas de energía",
              icon: "🧠"
            },
            {
              title: "Animaciones Fluidas",
              description: "Transiciones con Framer Motion y física realista",
              icon: "✨"
            },
            {
              title: "Interactividad",
              description: "Respuesta al mouse, hover effects y feedback visual",
              icon: "🎯"
            },
            {
              title: "Efectos de Sonido",
              description: "Síntesis de audio con Web Audio API y vibración",
              icon: "🔊"
            },
            {
              title: "Responsive Design",
              description: "Adaptable a todos los dispositivos y tamaños de pantalla",
              icon: "📱"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <AdvancedGlassCard
                className="p-6 text-center"
                intensity="medium"
                variant="secondary"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm">
                  {feature.description}
                </p>
              </AdvancedGlassCard>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas */}
        <AdvancedGlassCard
          className="p-8"
          intensity="medium"
          variant="accent"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            <HologramText text="Estadísticas de Rendimiento" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "FPS", value: "60", suffix: "" },
              { label: "Partículas", value: "200", suffix: "+" },
              { label: "Efectos", value: "15", suffix: "+" },
              { label: "Compatibilidad", value: "95", suffix: "%" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-primary-400 mb-2">
                  <GlitchText text={`${stat.value}${stat.suffix}`} glitchIntensity={0.05} />
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </AdvancedGlassCard>

        {/* Footer */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <p className="text-gray-400">
            Desarrollado por Senior Blockchain Developer con 20 años de experiencia
          </p>
          <p className="text-sm text-gray-500 mt-2">
            BrainSafes - Innovación en Web3 y Blockchain
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatbotDemo;
