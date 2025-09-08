import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  AdvancedGlassCard, 
  GlassButton, 
  GlassInput, 
  GlassModal 
} from './GlassmorphismEffects';
import { ChatbotNeuralEffects } from './ChatbotNeuralEffects';
import { AdvancedTypingIndicator, AdvancedProcessingIndicator } from './AdvancedTypingIndicator';

// Componente de mensaje con efectos neurales
const NeuralMessage = ({ message, isUser, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20, 
        scale: isVisible ? 1 : 0.9 
      }}
      transition={{ 
        duration: 0.6, 
        type: "spring", 
        stiffness: 100,
        delay: delay / 1000
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <motion.div
        className={`relative max-w-[80%] ${
          isUser 
            ? 'bg-gradient-to-br from-primary-500/20 to-brain-500/20' 
            : 'bg-gradient-to-br from-gray-800/20 to-gray-700/20'
        } backdrop-blur-xl border border-white/10 rounded-3xl p-4`}
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: isUser 
            ? '0 8px 32px rgba(59, 130, 246, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Efecto de brillo neural */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0"
          animate={{ opacity: isVisible ? 0.1 : 0 }}
          transition={{ duration: 1, delay: delay / 1000 }}
          style={{
            background: isUser 
              ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.3))'
              : 'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
          }}
        />
        
        <p className={`relative z-10 text-sm ${
          isUser ? 'text-white' : 'text-gray-100'
        } leading-relaxed`}>
          {message}
        </p>
        
        {/* Indicador de escritura para IA */}
        {!isUser && (
          <motion.div
            className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: delay / 1000
            }}
          >
            <span className="text-xs">🤖</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Componente de sugerencias inteligentes
const SmartSuggestions = ({ suggestions, onSuggestionClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-2"
    >
      <p className="text-xs sm:text-sm text-gray-400 font-medium">💡 Sugerencias</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.slice(0, 4).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-left cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// Componente de análisis predictivo
const PredictiveAnalysis = ({ predictions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-lg"
    >
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs">🔮</span>
        <p className="text-xs text-purple-300 font-medium">Análisis</p>
      </div>
      <p className="text-xs text-gray-300 leading-tight">
        {predictions[0]}
      </p>
    </motion.div>
  );
};

// Componente principal del chatbot mejorado
const EnhancedAIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: '¡Hola! Soy tu asistente IA de BrainSafes 🧠. Estoy especializado en nuestro ecosistema educativo descentralizado en Arbitrum. Puedo ayudarte con contratos inteligentes, Stylus, bridges L1↔L2, gas optimization, certificados NFT, becas, marketplace y más. ¿En qué puedo asistirte hoy?', 
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions] = useState([
    '¿Cómo funciona BrainSafes en Arbitrum?',
    'Explícame los contratos inteligentes',
    '¿Qué es Arbitrum Stylus?',
    'Ayúdame con el bridge L1↔L2',
    'Análisis de gas fees en Arbitrum'
  ]);
  const [predictions] = useState([
    'ArbOS 32 actualizado - Mejoras de seguridad implementadas',
    'Protocolo Yap integrado - Nuevas funciones sociales disponibles',
    'Stylus optimizado - Procesamiento IA on-chain más eficiente'
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulación de respuesta IA con delay realista
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hola') || input.includes('hi') || input.includes('hello')) {
      return "¡Hola! Soy tu asistente IA de BrainSafes 🧠. Estoy aquí para ayudarte con nuestro ecosistema educativo descentralizado en Arbitrum. Puedo explicarte sobre contratos inteligentes, Stylus, bridges L1↔L2, gas optimization y más. ¿En qué puedo asistirte hoy?";
    }
    
    if (input.includes('brainsafes') || input.includes('cómo funciona')) {
      return "BrainSafes es una plataforma educativa descentralizada que combina blockchain, IA y oráculos. Está optimizada para Arbitrum con contratos inteligentes que gestionan cursos, certificados NFT, becas y marketplace. Utilizamos Stylus para procesamiento IA on-chain y bridges cross-chain para interoperabilidad. ¿Te interesa algún componente específico?";
    }
    
    if (input.includes('arbitrum') || input.includes('l2') || input.includes('layer 2')) {
      return "Arbitrum es nuestra red principal. Con ArbOS 32 actualizado, tenemos mejoras de seguridad y el Protocolo Yap integrado para funciones sociales. BrainSafes aprovecha las tarifas de gas 95% menores, confirmaciones más rápidas y mayor throughput. ¿Quieres saber sobre el bridge L1↔L2 o las optimizaciones específicas?";
    }
    
    if (input.includes('stylus') || input.includes('rust') || input.includes('wasm')) {
      return "Arbitrum Stylus nos permite ejecutar código Rust on-chain para procesamiento IA más eficiente. En BrainSafes, usamos Stylus para AIProcessor, análisis predictivo y optimizaciones de gas. Esto reduce costos y mejora el rendimiento de nuestros algoritmos de IA. ¿Te interesa la implementación técnica?";
    }
    
    if (input.includes('contrato') || input.includes('smart contract')) {
      return "BrainSafes tiene una arquitectura modular con contratos especializados: BrainSafes.sol (core), ScholarshipManager, JobMarketplace, CertificateNFT, EDUToken, AIOracle, y más. Todos optimizados para Arbitrum con precompilados, batch processing y gas optimization. ¿Quieres conocer algún contrato específico?";
    }
    
    if (input.includes('bridge') || input.includes('cross-chain') || input.includes('l1') || input.includes('l2')) {
      return "Nuestro CrossChainBridge permite transferencias seguras entre Ethereum L1 y Arbitrum L2. Utiliza retryable tickets, merkle proofs y el sistema de mensajería de Arbitrum. Los usuarios pueden mover tokens EDU, certificados y datos entre redes. ¿Necesitas ayuda con una transferencia específica?";
    }
    
    if (input.includes('gas') || input.includes('fee') || input.includes('costo')) {
      return "En Arbitrum, las tarifas de gas son hasta 95% menores que en Ethereum. BrainSafes está optimizado con batch processing, precompilados de Arbitrum y compresión de datos. Una transacción que costaría $50 en Ethereum cuesta solo $2.50 en Arbitrum. ¿Quieres ver comparaciones específicas?";
    }
    
    if (input.includes('nft') || input.includes('certificado')) {
      return "Los CertificateNFT en BrainSafes son credenciales verificables únicas. Cada certificado está respaldado por blockchain, es inmutable y puede ser verificado por empleadores. Utilizamos metadatos IPFS y estándares ERC-721 optimizados para Arbitrum. ¿Quieres crear o verificar un certificado?";
    }
    
    if (input.includes('ia') || input.includes('ai') || input.includes('oracle')) {
      return "Nuestro AIOracle utiliza Stylus para procesamiento on-chain de IA. Analiza patrones de aprendizaje, predice rendimiento estudiantil y optimiza rutas de aprendizaje. Integra Chainlink para datos externos y procesamiento por lotes para eficiencia. ¿Te interesa el análisis predictivo?";
    }
    
    if (input.includes('beca') || input.includes('scholarship')) {
      return "El ScholarshipManager gestiona becas descentralizadas con contratos inteligentes transparentes. Los fondos se distribuyen automáticamente según criterios verificables, con tracking de progreso y pagos por hitos. Todo optimizado para Arbitrum con menores costos. ¿Quieres aplicar a una beca?";
    }
    
    if (input.includes('marketplace') || input.includes('trabajo') || input.includes('empleo')) {
      return "Nuestro JobMarketplace conecta estudiantes con empleos Web3. Utiliza IA para matching inteligente, contratos de trabajo automatizados y pagos en tokens EDU. Integra con el sistema de reputación y certificados para verificación de habilidades. ¿Buscas trabajo o quieres contratar?";
    }
    
    if (input.includes('seguridad') || input.includes('audit') || input.includes('hack')) {
      return "BrainSafes tiene múltiples capas de seguridad: contratos auditados, SecurityManager con roles granulares, monitoreo en tiempo real, y integración con herramientas como Slither. Utilizamos OpenZeppelin y mejores prácticas de Arbitrum. ¿Tienes alguna preocupación específica de seguridad?";
    }
    
    if (input.includes('analytics') || input.includes('métricas') || input.includes('datos')) {
      return "Nuestro AdvancedAnalytics proporciona insights en tiempo real sobre aprendizaje, rendimiento de cursos, y tendencias del mercado. Utiliza BrainSafesMetrics para tracking detallado y predicciones basadas en IA. ¿Quieres ver analytics específicos?";
    }
    
    if (input.includes('yap') || input.includes('social') || input.includes('comunidad')) {
      return "Con la integración del Protocolo Yap en Arbitrum, BrainSafes ahora tiene funciones sociales avanzadas. Los usuarios pueden interactuar, formar comunidades de estudio, y colaborar en proyectos. Esto mejora la experiencia de aprendizaje colaborativo. ¿Quieres explorar las funciones sociales?";
    }
    
    if (input.includes('blockchain') || input.includes('web3')) {
      return "Blockchain es la base de BrainSafes. Utilizamos Arbitrum para escalabilidad, Stylus para IA on-chain, y bridges para interoperabilidad. Nuestro ecosistema incluye educación descentralizada, certificados verificables, y marketplace Web3. ¿Te interesa algún aspecto específico?";
    }
    
    if (input.includes('defi') || input.includes('finanzas')) {
      return "BrainSafes integra DeFi con educación. Los tokens EDU permiten staking, yield farming educativo, y pagos descentralizados. Nuestro sistema de becas utiliza contratos inteligentes para distribución automática de fondos. ¿Quieres explorar las oportunidades DeFi?";
    }
    
    if (input.includes('mercado') || input.includes('crypto') || input.includes('precio')) {
      return "Nuestro análisis de mercado utiliza IA on-chain para predecir tendencias educativas y oportunidades de empleo Web3. Integra datos de múltiples fuentes y proporciona insights personalizados para estudiantes e instructores. ¿Quieres ver análisis específicos?";
    }
    
    // Respuesta por defecto más contextual
    return "Interesante pregunta sobre BrainSafes. Como asistente IA especializado en nuestro ecosistema educativo descentralizado, puedo ayudarte con Arbitrum, Stylus, contratos inteligentes, bridges cross-chain, gas optimization, certificados NFT, becas, marketplace, seguridad, analytics y más. ¿Podrías ser más específico sobre lo que te gustaría saber?";
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante mejorado */}
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 shadow-2xl flex items-center justify-center text-white text-lg sm:text-xl font-bold cursor-pointer hover:scale-110 transition-transform duration-200"
          style={{
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Efecto de pulso neural */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-brain-500"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.3, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity 
            }}
          />
          
          {/* Efecto de ondas */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.8, 0.4, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              delay: 0.5
            }}
          />
          
          <span className="relative z-10">
            {isOpen ? '✕' : '🤖'}
          </span>
        </button>
      </motion.div>

      {/* Panel del chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 md:w-96 lg:w-[400px] z-50"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            style={{ perspective: 1000 }}
          >
            <AdvancedGlassCard
              className="h-[500px] sm:h-[550px] md:h-[600px] max-h-[90vh] flex flex-col overflow-hidden"
              intensity="high"
              variant="primary"
            >
              {/* Efectos neurales de fondo */}
              <ChatbotNeuralEffects 
                showNetwork={true}
                showParticles={true}
                showWaves={true}
                className="opacity-20 pointer-events-none"
              />
              
              {/* Header */}
              <motion.div
                className="relative z-10 flex items-center justify-between p-3 sm:p-4 border-b border-white/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <span className="text-sm sm:text-base">🧠</span>
                  </motion.div>
                  <div>
                    <h3 className="text-white font-semibold text-sm sm:text-base">BrainSafes AI</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Asistente Blockchain</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                >
                  <span className="text-white text-sm sm:text-base">×</span>
                </button>
              </motion.div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[400px] md:max-h-[450px]">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <NeuralMessage
                      key={message.id}
                      message={message.text}
                      isUser={message.isUser}
                      delay={index * 100}
                    />
                  ))}
                </AnimatePresence>
                
                {/* Indicador de escritura avanzado */}
                {isTyping && (
                  <motion.div
                    className="flex justify-start mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AdvancedProcessingIndicator 
                      message="Procesando con IA neural..."
                      isVisible={isTyping}
                    />
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Sugerencias inteligentes */}
              {messages.length <= 1 && (
                <div className="px-3 sm:px-4 pb-2">
                  <SmartSuggestions 
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>
              )}

              {/* Análisis predictivo */}
              {messages.length > 2 && (
                <div className="px-3 sm:px-4 pb-2">
                  <PredictiveAnalysis predictions={predictions} />
                </div>
              )}

              {/* Input area */}
              <motion.div
                className="relative z-10 p-3 sm:p-4 border-t border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    disabled={isTyping}
                    className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="px-4 py-3 bg-gradient-to-r from-primary-500 to-brain-500 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <motion.span
                      animate={{ rotate: isTyping ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isTyping ? Infinity : 0 }}
                    >
                      {isTyping ? '⏳' : '➤'}
                    </motion.span>
                  </button>
                </div>
              </motion.div>
            </AdvancedGlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedAIChatWidget;
