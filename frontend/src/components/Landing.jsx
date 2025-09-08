import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { NeuralEffects } from './NeuralEffects';
import { AdvancedGlassCard, GlassButton } from './GlassmorphismEffects';

// Componente de red neuronal animada con WebGL
const NeuralNetwork = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configuración de la red neuronal
    const nodes = [];
    const connections = [];
    const numNodes = 50;
    const maxDistance = 150;

    // Crear nodos
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        hue: Math.random() * 60 + 200 // Azul a púrpura
      });
    }

    // Crear conexiones
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          connections.push({
            from: i,
            to: j,
            distance: distance,
            opacity: (maxDistance - distance) / maxDistance
          });
        }
      }
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      // Actualizar nodos
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Rebote en los bordes
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1;
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1;

        // Mantener dentro de los límites
        node.x = Math.max(0, Math.min(dimensions.width, node.x));
        node.y = Math.max(0, Math.min(dimensions.height, node.y));

        // Efecto de pulso
        const pulse = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7;
        node.currentSize = node.size * pulse;
        node.currentOpacity = node.opacity * pulse;
      });

      // Dibujar conexiones
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = ((maxDistance - distance) / maxDistance) * 0.3;
          const pulse = Math.sin(time * 3 + conn.from * 0.1) * 0.2 + 0.8;
          
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `hsla(${fromNode.hue}, 70%, 60%, ${opacity * pulse})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Dibujar nodos
      nodes.forEach(node => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.currentSize * 3
        );
        gradient.addColorStop(0, `hsla(${node.hue}, 70%, 60%, ${node.currentOpacity})`);
        gradient.addColorStop(1, `hsla(${node.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Nodo principal
        ctx.fillStyle = `hsla(${node.hue}, 80%, 70%, ${node.currentOpacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de partículas flotantes mejorado
const FloatingParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 8 + 2,
      speed: Math.random() * 0.8 + 0.2,
      direction: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.8 + 0.2,
      hue: Math.random() * 60 + 200,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      rotationSpeed: Math.random() * 0.05 + 0.01,
      waveAmplitude: Math.random() * 30 + 10,
      waveFrequency: Math.random() * 0.02 + 0.01
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: `hsl(${particle.hue}, 80%, 70%)`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 3}px hsl(${particle.hue}, 80%, 70%), 0 0 ${particle.size * 6}px hsl(${particle.hue}, 80%, 50%)`,
            filter: 'blur(0.5px)'
          }}
          animate={{
            x: [
              0, 
              Math.cos(particle.direction) * particle.waveAmplitude, 
              Math.cos(particle.direction + Math.PI) * particle.waveAmplitude,
              0
            ],
            y: [
              0, 
              Math.sin(particle.direction) * particle.waveAmplitude, 
              Math.sin(particle.direction + Math.PI) * particle.waveAmplitude,
              0
            ],
            opacity: [
              particle.opacity, 
              particle.opacity * 0.2, 
              particle.opacity * 0.8,
              particle.opacity
            ],
            scale: [1, 1.5, 0.8, 1.2, 1],
            rotate: [0, 180, 360],
            filter: [
              'blur(0.5px)',
              'blur(1px)',
              'blur(0.5px)',
              'blur(0px)',
              'blur(0.5px)'
            ]
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1]
          }}
        />
      ))}
    </div>
  );
};

// Componente de cursor personalizado mejorado
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Cursor principal */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 bg-gradient-to-r from-primary-500 to-brain-500 rounded-full pointer-events-none z-50 mix-blend-difference"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
          scale: isHovering ? 1.5 : isClicking ? 0.8 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />
      
      {/* Cursor trail */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 bg-gradient-to-r from-primary-400/30 to-brain-400/30 rounded-full pointer-events-none z-49"
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
          scale: isHovering ? 1.2 : 0.8,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      />
    </>
  );
};

// Componente de scroll indicator mejorado
const ScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-brain-500 to-purple-500 origin-left z-50"
      style={{ scaleX, opacity }}
    />
  );
};

// Componente de tarjeta con glassmorphism avanzado
const GlassCard = ({ children, className = "", delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
    viewport={{ once: true }}
    whileHover={{ 
      scale: 1.02,
      y: -5,
      transition: { duration: 0.3 }
    }}
    className={`relative group ${className}`}
    {...props}
  >
    {/* Fondo con múltiples capas de glassmorphism */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl backdrop-blur-xl border border-white/20 dark:border-gray-700/30" />
    <div className="absolute inset-0 bg-gradient-to-tl from-primary-500/5 via-transparent to-brain-500/5 rounded-3xl" />
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent rounded-3xl" />
    
    {/* Efecto de brillo en hover */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-brain-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100"
      transition={{ duration: 0.5 }}
    />
    
    {/* Contenido */}
    <div className="relative z-10 p-8">
      {children}
    </div>
  </motion.div>
);

// Componente de estadísticas animadas mejorado
const AnimatedCounter = ({ end, duration = 2000, suffix = "+", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [end]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(end * easeOutQuart));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return (
    <motion.span 
      id={`counter-${end}`}
      className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent break-words"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
};

// Componente de botón interactivo mejorado usando GlassButton
const InteractiveButton = ({ children, className = "", variant = "primary", ...props }) => {
  return (
    <GlassButton
      variant={variant}
      size="large"
      className={className}
      {...props}
    >
      {children}
      <motion.span
        animate={{ x: 0 }}
        whileHover={{ x: 5 }}
        transition={{ duration: 0.3 }}
      >
        →
      </motion.span>
    </GlassButton>
  );
};

// Componente principal de la landing page
export default function Landing() {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Seguimiento del mouse para efectos parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const benefits = [
    {
      icon: '🔒',
      title: 'Seguridad Blockchain',
      description: 'Credenciales verificables e inmutables en la blockchain con criptografía de última generación y auditorías automáticas',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20'
    },
    {
      icon: '⚡',
      title: 'IA Integrada',
      description: 'Aprendizaje personalizado con inteligencia artificial avanzada, recomendaciones adaptativas y análisis predictivo',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50/80 dark:bg-green-900/20'
    },
    {
      icon: '🌐',
      title: 'Interoperabilidad',
      description: 'Conecta con múltiples cadenas y plataformas para máxima flexibilidad y compatibilidad cross-chain',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50/80 dark:bg-purple-900/20'
    }
  ];

  const features = [
    {
      icon: '🎓',
      title: 'Certificaciones NFT',
      description: 'Emite y verifica certificados académicos de forma segura en la blockchain con tecnología NFT y metadatos enriquecidos'
    },
    {
      icon: '💼',
      title: 'Portfolio Profesional',
      description: 'Construye tu reputación profesional con credenciales verificables y un portfolio descentralizado inmutable'
    },
    {
      icon: '🤝',
      title: 'Mentoría Descentralizada',
      description: 'Conecta con mentores y expertos en tu campo de estudio a través de smart contracts y sistemas de reputación'
    },
    {
      icon: '💰',
      title: 'Préstamos DeFi',
      description: 'Accede a financiamiento educativo con garantías descentralizadas, tasas competitivas y liquidez automática'
    },
    {
      icon: '🏆',
      title: 'Sistema de Recompensas',
      description: 'Gana tokens por tu participación y contribuciones a la comunidad educativa con gamificación avanzada'
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
      content: 'BrainSafes revolucionó mi forma de aprender. Las certificaciones NFT me dieron credibilidad real en el mercado laboral.',
      avatar: 'MG',
      rating: 5
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Desarrollador Blockchain',
      content: 'La interoperabilidad cross-chain es increíble. Puedo usar mis credenciales en múltiples plataformas sin problemas.',
      avatar: 'CR',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      role: 'Mentora Senior',
      content: 'El sistema de mentoría descentralizada me permite ayudar a más estudiantes de forma transparente y eficiente.',
      avatar: 'AM',
      rating: 5
    }
  ];

  const stats = [
    { label: 'Estudiantes Activos', value: 15000, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Certificados Emitidos', value: 25000, icon: '🎓', color: 'from-green-500 to-emerald-500' },
    { label: 'Mentores Verificados', value: 500, icon: '🤝', color: 'from-purple-500 to-pink-500' },
    { label: 'Transacciones Diarias', value: 5000, icon: '⚡', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <CustomCursor />
      <ScrollIndicator />
      <NeuralEffects 
        showNetwork={true}
        showParticles={true}
        showWaves={true}
        showForceField={true}
        particleCount={300}
        waveIntensity={0.8}
        networkDensity={0.6}
      />
      
      {/* Fondo con efectos parallax mejorado */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-brain-500/10"
        animate={{
          backgroundPosition: [`${mousePosition.x}% ${mousePosition.y}%`, `${mousePosition.x + 10}% ${mousePosition.y + 10}%`, `${mousePosition.x}% ${mousePosition.y}%`]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Ondas de fondo animadas */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
          `
        }}
        animate={{
          background: [
            `
              radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
            `,
            `
              radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 60% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
            `,
            `
              radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
            `
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 min-h-screen flex items-center">
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
                  className="inline-flex items-center px-6 py-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-white/30 dark:border-gray-700/30 shadow-lg"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                  🚀 Plataforma Educativa Descentralizada
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white leading-tight"
                >
                  <span className="bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent">
                    BrainSafes
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 leading-relaxed"
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
                className="flex flex-col sm:flex-row gap-6"
              >
                <Link to="/dashboard">
                  <InteractiveButton variant="primary" className="w-full sm:w-auto">
                    Comenzar Ahora
                  </InteractiveButton>
                </Link>
                
                <InteractiveButton variant="secondary" className="w-full sm:w-auto">
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
              <AdvancedGlassCard intensity="high" variant="primary" className="p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <motion.div 
                      className="bg-gradient-to-br from-primary-500 to-brain-500 p-6 rounded-2xl text-white shadow-lg"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-3xl mb-3">🎓</div>
                      <div className="text-sm font-medium">Certificados NFT</div>
                      <div className="text-xs opacity-80 mt-1">Verificables</div>
                    </motion.div>
                    <motion.div 
                      className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-2xl text-white shadow-lg"
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-3xl mb-3">🤖</div>
                      <div className="text-sm font-medium">IA Integrada</div>
                      <div className="text-xs opacity-80 mt-1">Personalizada</div>
                    </motion.div>
                  </div>
                  <div className="space-y-6">
                    <motion.div 
                      className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white shadow-lg"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-3xl mb-3">🔗</div>
                      <div className="text-sm font-medium">Cross-Chain</div>
                      <div className="text-xs opacity-80 mt-1">Interoperable</div>
                    </motion.div>
                    <motion.div 
                      className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white shadow-lg"
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-3xl mb-3">💰</div>
                      <div className="text-sm font-medium">DeFi Loans</div>
                      <div className="text-xs opacity-80 mt-1">Descentralizado</div>
                    </motion.div>
                  </div>
                </div>
              </AdvancedGlassCard>
              
              {/* Efectos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-brain-400/20 rounded-3xl blur-3xl -z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-3xl blur-2xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight px-4">
              <span className="inline-block">
                ¿Por qué elegir{' '}
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  BrainSafes
                </span>
                ?
              </span>
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
              >
                <AdvancedGlassCard intensity="high" variant="default" delay={index * 0.2}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <motion.div 
                      className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      {benefit.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </AdvancedGlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
              Características Principales
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Todo lo que necesitas para tu desarrollo educativo y profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AdvancedGlassCard
                key={index}
                delay={index * 0.1}
                intensity="medium"
                variant="default"
                className="group"
              >
                <motion.div 
                  className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </AdvancedGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Descubre las experiencias de estudiantes y profesionales que confían en BrainSafes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <AdvancedGlassCard delay={index * 0.2} intensity="medium" variant="default">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-brain-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      <div className="flex mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-sm">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic text-lg leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </AdvancedGlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Efectos de fondo animados mejorados */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-400/40 via-brain-400/40 to-purple-400/40"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            backgroundSize: ["100% 100%", "200% 200%", "100% 100%"]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Ondas de energía adicionales */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              conic-gradient(from 0deg at 50% 50%, 
                rgba(59, 130, 246, 0.2) 0deg,
                rgba(139, 92, 246, 0.2) 120deg,
                rgba(6, 182, 212, 0.2) 240deg,
                rgba(59, 130, 246, 0.2) 360deg
              )
            `
          }}
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-8 leading-tight px-4">
              <span className="inline-block">¿Listo para comenzar tu viaje?</span>
            </h2>
            <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
              Únete a miles de estudiantes y profesionales que ya confían en BrainSafes para su desarrollo educativo
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/dashboard">
                <InteractiveButton variant="secondary" className="w-full sm:w-auto">
                  Crear Cuenta Gratis
                </InteractiveButton>
              </Link>
              <InteractiveButton variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
                Ver Demo Interactivo
              </InteractiveButton>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}