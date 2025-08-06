import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Componente de cursor personalizado
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-6 h-6 bg-primary-500/50 rounded-full pointer-events-none z-50 mix-blend-difference"
      animate={{
        x: mousePosition.x - 12,
        y: mousePosition.y - 12,
        scale: isHovering ? 1.5 : 1,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    />
  );
};

// Componente de partículas animadas mejorado
const ParticleBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas mejorado
const AnimatedCounter = ({ end, duration = 2000, suffix = "+" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(end * progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <motion.span 
      className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {count}{suffix}
    </motion.span>
  );
};

// Componente de tarjeta de característica con glassmorphism
const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    whileHover={{ 
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }}
    className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 hover:shadow-large transition-all duration-500"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-brain-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <motion.div 
        className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300"
        whileHover={{ rotate: 5 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </div>
  </motion.div>
);

// Componente de testimonio con glassmorphism
const TestimonialCard = ({ name, role, content, avatar, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ 
      scale: 1.02,
      transition: { duration: 0.2 }
    }}
    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-medium border border-white/20 dark:border-gray-700/20"
  >
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-brain-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
        {avatar}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
      </div>
    </div>
    <p className="text-gray-600 dark:text-gray-300 italic">"{content}"</p>
  </motion.div>
);

// Componente de scroll indicator
const ScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-brain-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// Componente de botón interactivo
const InteractiveButton = ({ children, className = "", ...props }) => (
  <motion.button
    className={`relative overflow-hidden ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-brain-500/20"
      initial={{ x: "-100%" }}
      whileHover={{ x: "0%" }}
      transition={{ duration: 0.3 }}
    />
    <span className="relative z-10">{children}</span>
  </motion.button>
);

export default function Landing() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const benefits = [
    {
      icon: '🔒',
      title: 'Seguridad Blockchain',
      description: 'Credenciales verificables e inmutables en la blockchain con criptografía de última generación',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20'
    },
    {
      icon: '⚡',
      title: 'IA Integrada',
      description: 'Aprendizaje personalizado con inteligencia artificial y recomendaciones adaptativas',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50/80 dark:bg-green-900/20'
    },
    {
      icon: '🌐',
      title: 'Interoperabilidad',
      description: 'Conecta con múltiples cadenas y plataformas para máxima flexibilidad',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50/80 dark:bg-purple-900/20'
    }
  ];

  const features = [
    {
      icon: '🎓',
      title: 'Certificaciones NFT',
      description: 'Emite y verifica certificados académicos de forma segura en la blockchain con tecnología NFT'
    },
    {
      icon: '💼',
      title: 'Portfolio Profesional',
      description: 'Construye tu reputación profesional con credenciales verificables y un portfolio descentralizado'
    },
    {
      icon: '🤝',
      title: 'Mentoría Descentralizada',
      description: 'Conecta con mentores y expertos en tu campo de estudio a través de smart contracts'
    },
    {
      icon: '💰',
      title: 'Préstamos DeFi',
      description: 'Accede a financiamiento educativo con garantías descentralizadas y tasas competitivas'
    },
    {
      icon: '🏆',
      title: 'Sistema de Recompensas',
      description: 'Gana tokens por tu participación y contribuciones a la comunidad educativa'
    },
    {
      icon: '🔐',
      title: 'Seguridad Avanzada',
      description: 'Protección con criptografía de última generación, auditorías automáticas y monitoreo 24/7'
    }
  ];

  const testimonials = [
    {
      name: 'María González',
      role: 'Estudiante de IA',
      content: 'BrainSafes revolucionó mi forma de aprender. Las certificaciones NFT me dieron credibilidad real.',
      avatar: 'MG'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Desarrollador Blockchain',
      content: 'La interoperabilidad cross-chain es increíble. Puedo usar mis credenciales en múltiples plataformas.',
      avatar: 'CR'
    },
    {
      name: 'Ana Martínez',
      role: 'Mentora Senior',
      content: 'El sistema de mentoría descentralizada me permite ayudar a más estudiantes de forma transparente.',
      avatar: 'AM'
    }
  ];

  const stats = [
    { label: 'Estudiantes Activos', value: 15000, icon: '👥' },
    { label: 'Certificados Emitidos', value: 25000, icon: '🎓' },
    { label: 'Mentores Verificados', value: 500, icon: '🤝' },
    { label: 'Transacciones Diarias', value: 5000, icon: '⚡' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <CustomCursor />
      <ScrollIndicator />
      <ParticleBackground />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200/50 dark:border-primary-700/50"
                >
                  🚀 Plataforma Educativa Descentralizada
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight"
                >
                  <span className="bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent">
                    BrainSafes
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed"
                >
                  La plataforma descentralizada que revoluciona la educación con{' '}
                  <span className="font-semibold text-primary-600">blockchain</span>,{' '}
                  <span className="font-semibold text-brain-600">IA</span> y{' '}
                  <span className="font-semibold text-purple-600">oráculos</span>
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-lg text-gray-500 dark:text-gray-400"
                >
                  Construye tu futuro con credenciales verificables, mentoría descentralizada y oportunidades de financiamiento inteligente.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-brain-600 text-white font-semibold rounded-xl shadow-large hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Comenzar Ahora
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </Link>
                
                <InteractiveButton className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300">
                  Ver Demo
                </InteractiveButton>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <motion.div 
                      className="bg-gradient-to-br from-primary-500 to-brain-500 p-4 rounded-xl text-white"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-2xl mb-2">🎓</div>
                      <div className="text-sm font-medium">Certificados NFT</div>
                    </motion.div>
                    <motion.div 
                      className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl text-white"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="text-sm font-medium">IA Integrada</div>
                    </motion.div>
                  </div>
                  <div className="space-y-4">
                    <motion.div 
                      className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl text-white"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-2xl mb-2">🔗</div>
                      <div className="text-sm font-medium">Cross-Chain</div>
                    </motion.div>
                    <motion.div 
                      className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl text-white"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-2xl mb-2">💰</div>
                      <div className="text-sm font-medium">DeFi Loans</div>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-brain-400/20 rounded-3xl blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  <AnimatedCounter end={stat.value} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              ¿Por qué elegir{' '}
              <span className="bg-gradient-to-r from-primary-600 to-brain-600 bg-clip-text text-transparent">
                BrainSafes
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Descubre las ventajas únicas de nuestra plataforma descentralizada
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className={`group relative p-8 rounded-2xl ${benefit.bgColor} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-large transition-all duration-500`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <motion.div 
                    className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    {benefit.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Características Principales
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Todo lo que necesitas para tu desarrollo educativo y profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Descubre las experiencias de estudiantes y profesionales que confían en BrainSafes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                role={testimonial.role}
                content={testimonial.content}
                avatar={testimonial.avatar}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para comenzar tu viaje?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Únete a miles de estudiantes y profesionales que ya confían en BrainSafes para su desarrollo educativo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl shadow-large hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Crear Cuenta Gratis
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <InteractiveButton className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-primary-600 transition-all duration-300">
                Ver Demo Interactivo
              </InteractiveButton>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 