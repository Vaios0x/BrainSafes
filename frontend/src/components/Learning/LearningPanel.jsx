import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NeuralBackground from '../NeuralBackground';
import CourseList from './CourseList';

// Componente de partículas neurales avanzadas para el learning
const NeuralLearningParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${Math.random() * 120 + 180}, 80%, 60%)`,
      connections: [],
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

      // Dibujar partícula
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();

      // Dibujar conexiones neurales
      particlesRef.current.forEach((otherParticle, j) => {
        if (i !== j) {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (100 - distance) / 100 * 0.3;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Crear partículas
    particlesRef.current = Array.from({ length: 40 }, createParticle);
    
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
const NeuralAnimatedLearningStats = ({ label, value, icon, delay = 0, color = "blue" }) => (
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

// Componente de navegación a herramientas educativas
const EducationalToolsNavigation = () => {
  const { t } = useTranslation();
  
  const tools = [
    {
      title: t('courseManagement'),
      description: t('manageCoursesDescription'),
      icon: '📚',
      path: '/learning/courses',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: t('automatedAssessment'),
      description: t('aiPoweredAssessmentDescription'),
      icon: '🤖',
      path: '/learning/assessment',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: t('certificateNFTManager'),
      description: t('manageCertificatesDescription'),
      icon: '🎓',
      path: '/learning/certificates',
      color: 'from-green-500 to-green-600'
    },
    {
      title: t('progressTracker'),
      description: t('trackYourLearningProgress'),
      icon: '📊',
      path: '/learning/progress',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: t('scholarshipManager'),
      description: t('aiPoweredScholarshipManagement'),
      icon: '💰',
      path: '/learning/scholarships',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: t('aiPerformancePredictor'),
      description: t('aiPoweredPerformancePrediction'),
      icon: '🔮',
      path: '/learning/predictions',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {tools.map((tool, index) => (
        <motion.div
          key={tool.path}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          whileTap={{ scale: 0.95 }}
          className="group relative"
        >
          <Link to={tool.path}>
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden h-full transition-all duration-500">
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Partículas flotantes */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/40 rounded-full"
                    style={{
                      left: `${20 + i * 20}%`,
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

              <div className="relative z-10 p-6 h-full flex flex-col">
                <motion.div 
                  className="text-4xl mb-4"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  {tool.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                  {tool.title}
                </h3>
                <p className="text-white/80 text-sm flex-1">{tool.description}</p>
              </div>

              {/* Borde animado */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

// Componente de Quiz Interactivo
const InteractiveQuiz = () => {
  const [step, setStep] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const preguntas = [
    { 
      q: '¿Qué es un smart contract?', 
      a: ['Un contrato legal', 'Un programa en blockchain', 'Un NFT'], 
      correct: 1,
      explanation: 'Un smart contract es un programa que se ejecuta automáticamente en la blockchain cuando se cumplen ciertas condiciones.'
    },
    { 
      q: '¿Qué red es famosa por DeFi?', 
      a: ['Ethereum', 'Bitcoin', 'Solana'], 
      correct: 0,
      explanation: 'Ethereum es la red más popular para aplicaciones DeFi debido a su ecosistema maduro y seguridad.'
    },
    { 
      q: '¿Qué es un NFT?', 
      a: ['Token fungible', 'Token no fungible', 'Un exchange'], 
      correct: 1,
      explanation: 'NFT significa "Non-Fungible Token", un token único que no puede ser reemplazado por otro idéntico.'
    },
  ];

  const handleAnswer = (idx) => {
    const newRespuestas = [...respuestas, idx];
    setRespuestas(newRespuestas);
    
    if (step + 1 >= preguntas.length) {
      setShowResult(true);
    } else {
      setStep(step + 1);
    }
  };

  const aciertos = respuestas.filter((r, i) => r === preguntas[i]?.correct).length;
  const porcentaje = (aciertos / preguntas.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden p-8"
    >
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
      <div className="text-center mb-6 relative z-10">
        <h3 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
          Quiz Interactivo
        </h3>
        <p className="text-white/80">
          Pon a prueba tus conocimientos sobre blockchain
        </p>
      </div>

      {!showResult ? (
        <div className="relative z-10">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-white/80 font-medium">
                Pregunta {step + 1} de {preguntas.length}
              </span>
              <div className="w-32 bg-white/20 backdrop-blur-xl rounded-full h-3 border border-white/30">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / preguntas.length) * 100}%` }}
                ></motion.div>
              </div>
            </div>
            <h4 className="text-xl font-bold text-white mb-4" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
              {preguntas[step]?.q}
            </h4>
          </div>

          <div className="space-y-4">
            {preguntas[step]?.a.map((respuesta, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02, rotateX: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(idx)}
                className="w-full p-4 text-left bg-white/10 backdrop-blur-xl hover:bg-white/20 rounded-2xl border-2 border-white/30 hover:border-white/50 transition-all duration-300"
              >
                <span className="font-bold text-white">
                  {String.fromCharCode(65 + idx)}. {respuesta}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center relative z-10">
          <motion.div 
            className="text-6xl mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity 
            }}
          >
            🎉
          </motion.div>
          <h4 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
            ¡Quiz Completado!
          </h4>
          <p className="text-lg text-white/80 mb-4">
            Obtuviste {aciertos} de {preguntas.length} correctas
          </p>
          <div className="w-full bg-white/20 backdrop-blur-xl rounded-full h-4 mb-4 border border-white/30">
            <motion.div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                porcentaje >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                porcentaje >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${porcentaje}%` }}
              transition={{ duration: 1.5, delay: 0.5 }}
            ></motion.div>
          </div>
          <p className="text-sm text-white/80 font-medium">
            {porcentaje}% de acierto
          </p>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setStep(0);
              setRespuestas([]);
              setShowResult(false);
            }}
            className="mt-6 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-8 py-4 rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Intentar de Nuevo
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

// Componente de Logros
const AchievementsPanel = () => {
  const logros = [
    { name: 'Pionero', desc: 'Completaste tu primer curso', icon: '🏅', color: 'from-yellow-500 to-orange-500' },
    { name: 'Quiz Master', desc: 'Acierto perfecto en un quiz', icon: '🎯', color: 'from-red-500 to-pink-500' },
    { name: 'Mentor', desc: 'Ayudaste a otro usuario', icon: '🤝', color: 'from-green-500 to-emerald-500' },
    { name: 'Innovador', desc: 'Completaste 5 cursos', icon: '💡', color: 'from-blue-500 to-indigo-500' },
    { name: 'Experto', desc: 'Dominas blockchain avanzado', icon: '👑', color: 'from-purple-500 to-violet-500' },
    { name: 'Comunidad', desc: 'Participaste en 10 foros', icon: '👥', color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Logros e Insignias
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Desbloquea logros mientras aprendes
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logros.map((logro, i) => (
          <motion.div
            key={logro.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6 text-center"
          >
            <div className="text-4xl mb-4">{logro.icon}</div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {logro.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {logro.desc}
            </p>
            <div className={`mt-4 w-16 h-1 bg-gradient-to-r ${logro.color} rounded-full mx-auto`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de Foro de Discusión
const DiscussionForum = () => {
  const [posts, setPosts] = useState([
    { 
      id: 1,
      user: 'Alice', 
      avatar: '👩‍💻',
      msg: '¿Alguien recomienda recursos para DeFi? Estoy empezando y me gustaría aprender más sobre yield farming.', 
      date: '2024-07-24',
      likes: 12,
      replies: 5
    },
    { 
      id: 2,
      user: 'Bob', 
      avatar: '👨‍💻',
      msg: '¿Qué opinan de los NFTs educativos? Creo que podrían revolucionar la forma en que validamos el conocimiento.', 
      date: '2024-07-23',
      likes: 8,
      replies: 3
    },
    { 
      id: 3,
      user: 'Charlie', 
      avatar: '👨‍🎓',
      msg: 'Acabo de completar el curso de Smart Contracts. ¡Excelente contenido! ¿Alguien más lo ha hecho?', 
      date: '2024-07-22',
      likes: 15,
      replies: 7
    },
  ]);
  const [msg, setMsg] = useState('');

  const handlePost = () => {
    if (msg.trim()) {
      const newPost = {
        id: posts.length + 1,
        user: 'Tú', 
        avatar: '👤',
        msg: msg.trim(), 
        date: new Date().toLocaleDateString(),
        likes: 0,
        replies: 0
      };
      setPosts([newPost, ...posts]);
      setMsg('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Foro de Discusión
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta con otros estudiantes y comparte conocimientos
        </p>
      </div>

      {/* New Post */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
        <div className="flex gap-4">
          <div className="text-2xl">👤</div>
          <div className="flex-1">
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="¿Qué quieres compartir con la comunidad?"
              className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {msg.length}/500 caracteres
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePost}
                disabled={!msg.trim()}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                  msg.trim()
                    ? 'bg-gradient-to-r from-primary-500 to-brain-500 text-white hover:from-primary-600 hover:to-brain-600'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Publicar
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
          >
            <div className="flex gap-4">
              <div className="text-2xl">{post.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {post.user}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {post.date}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {post.msg}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <button className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    👍 {post.likes}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    💬 {post.replies}
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    🔗 Compartir
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de Certificados
const CertificateList = () => {
  const certificados = [
    { 
      name: 'Blockchain Fundamentals', 
      date: '2024-07-20', 
      nft: true,
      image: 'https://picsum.photos/300/200?random=1',
      issuer: 'BrainSafes Academy',
      level: 'Básico'
    },
    { 
      name: 'Smart Contracts Avanzados', 
      date: '2024-07-22', 
      nft: true,
      image: 'https://picsum.photos/300/200?random=2',
      issuer: 'BrainSafes Academy',
      level: 'Avanzado'
    },
    { 
      name: 'DeFi y Finanzas Web3', 
      date: '2024-07-25', 
      nft: true,
      image: 'https://picsum.photos/300/200?random=3',
      issuer: 'BrainSafes Academy',
      level: 'Intermedio'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Certificados NFT
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tus credenciales verificables en la blockchain
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificados.map((cert, i) => (
          <motion.div
            key={cert.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden"
          >
            <div className="relative">
              <img 
                src={cert.image} 
                alt={cert.name}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                NFT
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {cert.name}
              </h4>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Emitido:</span>
                  <span className="text-gray-900 dark:text-white">{cert.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Emisor:</span>
                  <span className="text-gray-900 dark:text-white">{cert.issuer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Nivel:</span>
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">{cert.level}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-primary-500 to-brain-500 text-white py-2 rounded-xl font-medium hover:from-primary-600 hover:to-brain-600 transition-all duration-300"
              >
                Ver NFT
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function LearningPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'courses', label: 'Cursos', icon: '📚' },
    { id: 'tools', label: 'Herramientas', icon: '🛠️' },
    { id: 'quiz', label: 'Quiz', icon: '🧠' },
    { id: 'achievements', label: 'Logros', icon: '🏆' },
    { id: 'forum', label: 'Foro', icon: '💬' },
    { id: 'certificates', label: 'Certificados', icon: '🎓' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="learning" particleCount={50} waveCount={7} intensity="medium" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con Glassmorphism 3D */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
          >
            <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
            🚀 Arbitrum Sepolia
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6" style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.8)' }}>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Centro de Aprendizaje
            </span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto font-medium" style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}>
            Plataforma descentralizada en Arbitrum Sepolia - Explora, aprende y crece con nuestras herramientas educativas avanzadas potenciadas por IA
          </p>
        </motion.div>

        {/* Tabs con Glassmorphism 3D */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 backdrop-blur-xl text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats con Glassmorphism 3D */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <NeuralAnimatedLearningStats 
                  label="Cursos Completados" 
                  value="12" 
                  icon="📚" 
                  delay={0.1}
                  color="blue"
                />
                <NeuralAnimatedLearningStats 
                  label="Horas de Estudio" 
                  value="156" 
                  icon="⏰" 
                  delay={0.2}
                  color="green"
                />
                <NeuralAnimatedLearningStats 
                  label="Certificados" 
                  value="8" 
                  icon="🎓" 
                  delay={0.3}
                  color="purple"
                />
                <NeuralAnimatedLearningStats 
                  label="Puntuación Promedio" 
                  value="87%" 
                  icon="⭐" 
                  delay={0.4}
                  color="orange"
                />
              </div>

              {/* Educational Tools Navigation */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-8 text-center" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                  Herramientas Educativas
                </h2>
                <EducationalToolsNavigation />
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CourseList />
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EducationalToolsNavigation />
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <InteractiveQuiz />
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AchievementsPanel />
            </motion.div>
          )}

          {activeTab === 'forum' && (
            <motion.div
              key="forum"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DiscussionForum />
            </motion.div>
          )}

          {activeTab === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CertificateList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 