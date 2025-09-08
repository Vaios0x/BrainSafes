import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from './NeuralBackground';

// Componente de partículas neurales avanzadas para el support
const NeuralSupportParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${Math.random() * 60 + 200}, 80%, 60%)`, // Azul a cyan
      connections: [],
      pulse: Math.random() * Math.PI * 2,
    };
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Actualizar y dibujar partículas
    particlesRef.current.forEach((particle, i) => {
      // Actualizar posición
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Rebote en bordes
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      // Mantener en canvas
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));

      // Efecto de pulso
      particle.pulse += 0.02;
      const pulseSize = particle.size + Math.sin(particle.pulse) * 0.5;

      // Dibujar partícula con glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, pulseSize * 3
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = particle.opacity;
      ctx.fillRect(particle.x - pulseSize * 3, particle.y - pulseSize * 3, pulseSize * 6, pulseSize * 6);

      // Dibujar conexiones neurales
      particlesRef.current.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (120 - distance) / 120 * 0.4;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      });
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Crear partículas
    particlesRef.current = Array.from({ length: 35 }, createParticle);
    
    // Iniciar animación
    animate();

    // Limpiar al desmontar
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de estadísticas con glassmorphism 3D avanzado
const NeuralAnimatedSupportStats = ({ label, value, icon, delay = 0, color = "blue" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
    whileHover={{ 
      scale: 1.05, 
      rotateY: 5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
    }}
    className="relative group"
  >
    <div className="relative p-6 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <motion.div 
          className="text-4xl mb-3"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: delay * 0.5
          }}
        >
          {icon}
        </motion.div>
        <motion.div 
          className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2"
          style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
        >
          {value}
        </motion.div>
        <div className="text-sm text-white/80 font-medium">
          {label}
        </div>
      </div>

      {/* Borde animado */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  </motion.div>
);

// Componente de FAQs Interactivo
const InteractiveFAQs = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const faqs = [
    { 
      q: '¿Cómo conecto mi wallet?', 
      a: 'Haz clic en "Conectar Wallet" en la esquina superior derecha y sigue las instrucciones de Metamask. Asegúrate de tener Metamask instalado en tu navegador.',
      category: 'Wallet',
      icon: '🔗'
    },
    { 
      q: '¿Qué es un NFT?', 
      a: 'Un NFT (Non-Fungible Token) es un token único y verificable en blockchain que representa un activo digital. En BrainSafes, los certificados son NFTs.',
      category: 'NFTs',
      icon: '🎨'
    },
    { 
      q: '¿Cómo obtengo un certificado?', 
      a: 'Completa un curso y aprueba el quiz correspondiente. Tu certificado NFT se generará automáticamente y será verificable en la blockchain.',
      category: 'Certificados',
      icon: '🎓'
    },
    { 
      q: '¿Qué es Arbitrum L2?', 
      a: 'Arbitrum es una solución de escalabilidad L2 que reduce los costos de gas y aumenta la velocidad de las transacciones en Ethereum.',
      category: 'Blockchain',
      icon: '⚡'
    },
    { 
      q: '¿Cómo funciona el sistema de becas?', 
      a: 'El sistema de becas utiliza smart contracts para distribuir automáticamente fondos basados en criterios predefinidos y milestones.',
      category: 'Becas',
      icon: '💰'
    },
    { 
      q: '¿Es seguro BrainSafes?', 
      a: 'Sí, utilizamos contratos auditados, multi-signature wallets, y monitoreo 24/7 para garantizar la máxima seguridad.',
      category: 'Seguridad',
      icon: '🛡️'
    },
    { 
      q: '¿Puedo usar BrainSafes desde móvil?', 
      a: 'Sí, la plataforma es completamente responsive y optimizada para dispositivos móviles con soporte para wallets móviles.',
      category: 'Móvil',
      icon: '📱'
    },
    { 
      q: '¿Qué idiomas soporta BrainSafes?', 
      a: 'Actualmente soportamos español e inglés, con planes de expandir a más idiomas próximamente.',
      category: 'Idiomas',
      icon: '🌐'
    },
  ];

  const filtered = faqs.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
          Preguntas Frecuentes
        </h3>
        <p className="text-white/80">
          Encuentra respuestas rápidas a las preguntas más comunes
        </p>
      </div>

      {/* Search con Glassmorphism */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en FAQs..."
          className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-lg"
        />
        <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
          🔍
        </span>
      </div>

      {/* FAQs con Glassmorphism */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 2,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              }}
              className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden group"
            >
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Partículas flotantes */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, j) => (
                  <motion.div
                    key={j}
                    className="absolute w-1 h-1 bg-white/40 rounded-full"
                    style={{
                      left: `${20 + j * 30}%`,
                      top: `${30 + (j % 2) * 40}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 2 + j * 0.3,
                      repeat: Infinity,
                      delay: j * 0.2,
                    }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setExpanded(expanded === faq.q ? null : faq.q)}
                className="w-full p-6 text-left flex items-center justify-between relative z-10"
              >
                <div className="flex items-center gap-4">
                  <motion.span 
                    className="text-3xl"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  >
                    {faq.icon}
                  </motion.span>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                      {faq.q}
                    </h4>
                    <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-2xl text-sm font-bold border border-white/30">
                      {faq.category}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expanded === faq.q ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/80 text-2xl"
                >
                  ▼
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {expanded === faq.q && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden relative z-10"
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-white/30 pt-4">
                        <p className="text-white/80 leading-relaxed font-medium">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State con Glassmorphism */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="relative p-8 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <div className="relative z-10">
              <motion.div 
                className="text-6xl mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity 
                }}
              >
                🤔
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                No se encontraron resultados
              </h3>
              <p className="text-white/80">
                Intenta con otros términos de búsqueda.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Componente de Contacto
const ContactPanel = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Contacto y Soporte
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Estamos aquí para ayudarte. Envíanos tu consulta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-support-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-support-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asunto
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-support-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-support-500 focus:border-transparent resize-none"
                placeholder="Describe tu problema o pregunta..."
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                isSubmitting
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-support-500 to-support-600 text-white hover:from-support-600 hover:to-support-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Mensaje'
              )}
            </motion.button>
          </form>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl"
              >
                ✅ ¡Mensaje enviado! Te responderemos pronto.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información de Contacto
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Email</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">support@brainsafes.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Chat en Vivo</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Disponible 24/7</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">WhatsApp</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">+1 (555) 123-4567</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tiempo de Respuesta
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Consultas generales</span>
                <span className="font-medium text-gray-900 dark:text-white">24 horas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Problemas técnicos</span>
                <span className="font-medium text-gray-900 dark:text-white">4 horas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Emergencias</span>
                <span className="font-medium text-gray-900 dark:text-white">1 hora</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Componente de Documentación
const DocumentationPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const docs = [
    {
      category: 'Guías y Manuales',
      icon: '📖',
      items: [
        { name: 'Guía de usuario', url: '#', description: 'Manual completo para usuarios', icon: '👤' },

        { name: 'Guía de integración LMS', url: '#', description: 'Integración con Moodle, Canvas', icon: '🔗' },
        { name: 'Guía de seguridad', url: '#', description: 'Mejores prácticas de seguridad', icon: '🛡️' },
      ],
    },
    {
      category: 'Documentos Técnicos',
      icon: '🔧',
      items: [
        { name: 'Whitepaper', url: '#', description: 'Documento técnico completo', icon: '📄' },
        { name: 'API Reference', url: '#', description: 'Documentación de la API', icon: '🔌' },
        { name: 'Smart Contracts', url: '#', description: 'Documentación de contratos', icon: '📜' },
        { name: 'SDK Docs', url: '#', description: 'Software Development Kit', icon: '🛠️' },
      ],
    },
    {
      category: 'Tutoriales y Ejemplos',
      icon: '🎓',
      items: [
        { name: 'Primeros pasos con BrainSafes', url: '#', description: 'Tutorial para principiantes', icon: '🚀' },
        { name: 'Ejemplo de integración con Moodle', url: '#', description: 'Caso de uso real', icon: '🎯' },
        { name: 'Tutorial de NFTs educativos', url: '#', description: 'Creación de certificados NFT', icon: '🎨' },
        { name: 'Uso del Panel de Gobernanza', url: '#', description: 'Participación en decisiones', icon: '🗳️' },
      ],
    },
    {
      category: 'Videos y Webinars',
      icon: '🎥',
      items: [
        { name: 'Introducción a BrainSafes', url: '#', description: 'Video de 5 minutos', icon: '🎬' },
        { name: 'Webinar: DeFi en Educación', url: '#', description: 'Grabación disponible', icon: '📺' },
        { name: 'Tutorial: Conectar Wallet', url: '#', description: 'Paso a paso', icon: '🔗' },
        { name: 'Demo: Sistema de Becas', url: '#', description: 'Demostración en vivo', icon: '💰' },
      ],
    },
  ];

  const categories = ['all', ...docs.map(doc => doc.category)];
  const filteredDocs = docs.filter(doc => 
    selectedCategory === 'all' || doc.category === selectedCategory
  );

  const allItems = filteredDocs.flatMap(doc => 
    doc.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Documentación y Guías
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra toda la información que necesitas
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-support-500 to-support-600 text-white shadow-medium'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? 'Todos' : category}
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar en documentación..."
          className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-support-500 focus:border-transparent"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {allItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-large transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {item.description}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-support-600 dark:text-support-400 font-medium hover:text-support-700 dark:hover:text-support-300 transition-colors duration-300"
                  >
                    Ver Documento →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {allItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No se encontraron documentos
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Intenta ajustar los filtros o términos de búsqueda.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default function SupportPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('faqs');
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: 'faqs', label: 'FAQs', icon: '❓' },
    { id: 'contact', label: 'Contacto', icon: '📞' },
    { id: 'docs', label: 'Documentación', icon: '📚' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="support" particleCount={50} waveCount={7} intensity="medium" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section con Glassmorphism 3D */}
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
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
            >
              <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
              💬 Centro de Soporte
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Support
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-white/90 max-w-3xl mx-auto lg:mx-0 font-medium"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}
            >
              Estamos aquí para ayudarte. Encuentra respuestas rápidas, contacta con nuestro equipo o explora la documentación completa.
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <NeuralAnimatedSupportStats 
              label="Tickets Resueltos" 
              value="1,247" 
              icon="✅" 
              delay={1.0}
              color="green"
            />
            <NeuralAnimatedSupportStats 
              label="Tiempo Promedio" 
              value="2.3h" 
              icon="⏱️" 
              delay={1.1}
              color="blue"
            />
            <NeuralAnimatedSupportStats 
              label="Satisfacción" 
              value="98%" 
              icon="😊" 
              delay={1.2}
              color="purple"
            />
            <NeuralAnimatedSupportStats 
              label="Documentos" 
              value="156" 
              icon="📄" 
              delay={1.3}
              color="orange"
            />
          </div>
        </motion.div>

        {/* Tabs con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden p-4">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <div className="flex flex-wrap gap-3 relative z-10">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white border-blue-400/50 shadow-lg'
                      : 'bg-white/10 backdrop-blur-xl text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'faqs' && (
              <motion.div
                key="faqs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InteractiveFAQs />
              </motion.div>
            )}
            
            {activeTab === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ContactPanel />
              </motion.div>
            )}
            
            {activeTab === 'docs' && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DocumentationPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
} 