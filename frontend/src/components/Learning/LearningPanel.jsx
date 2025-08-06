import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CourseList from './CourseList';

// Componente de partículas para el learning
const LearningParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-brain-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas
const AnimatedLearningStats = ({ label, value, icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="text-center"
  >
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {label}
    </div>
  </motion.div>
);

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
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Interactivo
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Pon a prueba tus conocimientos de blockchain
        </p>
      </div>

      {!showResult ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-brain-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / preguntas.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Question */}
          <div className="text-center">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {preguntas[step].q}
            </h4>
            
            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {preguntas[step].a.map((opcion, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(i)}
                  className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-left hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300 hover:shadow-medium"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    {String.fromCharCode(65 + i)}. {opcion}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl mb-4">
            {porcentaje === 100 ? '🎉' : porcentaje >= 70 ? '🎯' : '📚'}
          </div>
          
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Quiz Completado!
          </h4>
          
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Aciertos: {aciertos} de {preguntas.length}
          </div>
          
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {porcentaje}%
          </div>
          
          <div className="space-y-2">
            {porcentaje === 100 && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg">
                ¡Perfecto! 🏆
              </div>
            )}
            {porcentaje >= 70 && porcentaje < 100 && (
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                ¡Bien hecho! 🎯
              </div>
            )}
            {porcentaje < 70 && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-lg">
                Sigue practicando 📚
              </div>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setStep(0);
              setRespuestas([]);
              setShowResult(false);
            }}
            className="bg-gradient-to-r from-primary-500 to-brain-500 text-white px-6 py-3 rounded-xl font-medium hover:from-primary-600 hover:to-brain-600 transition-all duration-300"
          >
            Intentar de Nuevo
          </motion.button>
        </motion.div>
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
  const [activeTab, setActiveTab] = useState('cursos');
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: 'cursos', label: 'Cursos', icon: '📚' },
    { id: 'quizzes', label: 'Quizzes', icon: '🎯' },
    { id: 'logros', label: 'Logros', icon: '🏆' },
    { id: 'foros', label: 'Foros', icon: '💬' },
    { id: 'certificados', label: 'Certificados', icon: '🎓' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <LearningParticles />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
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
              className="inline-flex items-center px-4 py-2 bg-brain-100/80 dark:bg-brain-900/30 backdrop-blur-sm text-brain-700 dark:text-brain-300 rounded-full text-sm font-medium border border-brain-200/50 dark:border-brain-700/50 mb-4"
            >
              🎓 Panel de Aprendizaje
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-brain-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Learning
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Aprende blockchain, DeFi y Web3 con cursos interactivos, quizzes y certificados NFT
            </motion.p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatedLearningStats 
              label="Cursos Completados" 
              value="12" 
              icon="📚" 
              delay={1.0}
            />
            <AnimatedLearningStats 
              label="Certificados NFT" 
              value="8" 
              icon="🎓" 
              delay={1.1}
            />
            <AnimatedLearningStats 
              label="Logros Desbloqueados" 
              value="24" 
              icon="🏆" 
              delay={1.2}
            />
            <AnimatedLearningStats 
              label="Puntos Ganados" 
              value="1,247" 
              icon="⭐" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-brain-500 text-white shadow-medium'
                      : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
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
            {activeTab === 'cursos' && (
              <motion.div
                key="cursos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CourseList />
              </motion.div>
            )}
            
            {activeTab === 'quizzes' && (
              <motion.div
                key="quizzes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InteractiveQuiz />
              </motion.div>
            )}
            
            {activeTab === 'logros' && (
              <motion.div
                key="logros"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AchievementsPanel />
              </motion.div>
            )}
            
            {activeTab === 'foros' && (
              <motion.div
                key="foros"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DiscussionForum />
              </motion.div>
            )}
            
            {activeTab === 'certificados' && (
              <motion.div
                key="certificados"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CertificateList />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
} 