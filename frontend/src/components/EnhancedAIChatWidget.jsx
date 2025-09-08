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
      <p className="text-xs text-gray-400 font-medium">💡 Sugerencias</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 4).map((suggestion, index) => (
          <motion.button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-2 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-all duration-300"
            whileHover={{ 
              scale: 1.05, 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
          </motion.button>
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
      className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs">🔮</span>
        <p className="text-xs text-purple-300 font-medium">Análisis</p>
      </div>
      <div className="space-y-1">
        {predictions.slice(0, 2).map((prediction, index) => (
          <motion.p
            key={index}
            className="text-xs text-gray-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            • {prediction.length > 40 ? prediction.substring(0, 40) + '...' : prediction}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
};

// Componente principal del chatbot mejorado
const EnhancedAIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: '¡Hola! Soy tu asistente IA de BrainSafes. ¿En qué puedo ayudarte?', 
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions] = useState([
    '¿Cómo funciona la seguridad en blockchain?',
    'Explícame los contratos inteligentes',
    '¿Qué es Web3?',
    'Ayúdame con DeFi',
    'Análisis de mercado crypto'
  ]);
  const [predictions] = useState([
    'Posible congestión de red detectada para mañana',
    'Se recomienda optimizar el contrato BrainSafes.sol',
    'Nuevas oportunidades de yield farming disponibles'
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
    
    if (input.includes('blockchain') || input.includes('seguridad')) {
      return 'La seguridad en blockchain se basa en criptografía, consenso distribuido y transparencia. Los contratos inteligentes de BrainSafes implementan múltiples capas de seguridad incluyendo auditorías automáticas, validación de múltiples firmas y sistemas de detección de anomalías.';
    } else if (input.includes('contrato') || input.includes('smart contract')) {
      return 'Los contratos inteligentes son programas autoejecutables que se ejecutan en blockchain. BrainSafes utiliza contratos optimizados con gas eficiente, actualizaciones seguras y compatibilidad cross-chain. ¿Te gustaría que analice algún contrato específico?';
    } else if (input.includes('web3') || input.includes('decentralizado')) {
      return 'Web3 representa la evolución hacia una web descentralizada donde los usuarios tienen control total de sus datos y activos. BrainSafes está construyendo la infraestructura para esta nueva era con protocolos seguros y escalables.';
    } else if (input.includes('defi') || input.includes('finanzas')) {
      return 'DeFi (Finanzas Descentralizadas) permite servicios financieros sin intermediarios. BrainSafes ofrece herramientas avanzadas para yield farming, lending, y análisis de riesgo en tiempo real.';
    } else if (input.includes('mercado') || input.includes('crypto') || input.includes('precio')) {
      return 'El análisis de mercado crypto requiere múltiples factores: volumen, sentimiento, on-chain metrics, y datos macroeconómicos. BrainSafes integra análisis predictivo con IA para optimizar estrategias de trading.';
    } else {
      return 'Interesante pregunta. Como asistente IA especializado en blockchain y Web3, puedo ayudarte con temas de seguridad, desarrollo de contratos inteligentes, análisis de mercado, y arquitectura descentralizada. ¿Hay algún aspecto específico que te gustaría explorar?';
    }
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
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 shadow-2xl flex items-center justify-center text-white text-lg font-bold"
          whileHover={{ 
            scale: 1.1, 
            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" 
          }}
          whileTap={{ scale: 0.9 }}
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
        </motion.button>
      </motion.div>

      {/* Panel del chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-6 w-72 max-w-[calc(100vw-2rem)] z-40"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            style={{ perspective: 1000 }}
          >
            <AdvancedGlassCard
              className="h-[400px] max-h-[70vh] flex flex-col overflow-hidden"
              intensity="high"
              variant="primary"
            >
              {/* Efectos neurales de fondo */}
              <ChatbotNeuralEffects 
                showNetwork={true}
                showParticles={true}
                showWaves={true}
                className="opacity-20"
              />
              
              {/* Header */}
              <motion.div
                className="relative z-10 flex items-center justify-between p-2 border-b border-white/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-brain-500 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <span className="text-sm">🧠</span>
                  </motion.div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">BrainSafes AI</h3>
                    <p className="text-xs text-gray-400">Asistente</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-white text-sm">×</span>
                </motion.button>
              </motion.div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[200px]">
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
                <div className="px-2 pb-1">
                  <SmartSuggestions 
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>
              )}

              {/* Análisis predictivo */}
              {messages.length > 2 && (
                <div className="px-2 pb-1">
                  <PredictiveAnalysis predictions={predictions} />
                </div>
              )}

              {/* Input area */}
              <motion.div
                className="relative z-10 p-2 border-t border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex gap-2">
                  <GlassInput
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <GlassButton
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="px-4 py-3"
                    variant="primary"
                  >
                    <motion.span
                      animate={{ rotate: isTyping ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isTyping ? Infinity : 0 }}
                    >
                      {isTyping ? '⏳' : '➤'}
                    </motion.span>
                  </GlassButton>
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
