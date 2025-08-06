import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componente de partículas para el support
const SupportParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-support-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -25, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 7 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 6,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas
const AnimatedSupportStats = ({ label, value, icon, delay = 0 }) => (
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
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Preguntas Frecuentes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra respuestas rápidas a las preguntas más comunes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en FAQs..."
          className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-support-500 focus:border-transparent"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden"
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setExpanded(expanded === faq.q ? null : faq.q)}
                className="w-full p-6 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{faq.icon}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {faq.q}
                    </h4>
                    <span className="inline-block px-3 py-1 bg-support-100 dark:bg-support-900/30 text-support-700 dark:text-support-300 rounded-full text-sm font-medium">
                      {faq.category}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expanded === faq.q ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-400"
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
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Intenta con otros términos de búsqueda.
          </p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <SupportParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-support-100/80 dark:bg-support-900/30 backdrop-blur-sm text-support-700 dark:text-support-300 rounded-full text-sm font-medium border border-support-200/50 dark:border-support-700/50 mb-4"
            >
              💬 Centro de Soporte
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-support-600 via-primary-600 to-purple-600 bg-clip-text text-transparent">
                Support
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Estamos aquí para ayudarte. Encuentra respuestas rápidas, contacta con nuestro equipo o explora la documentación completa.
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
            <AnimatedSupportStats 
              label="Tickets Resueltos" 
              value="1,247" 
              icon="✅" 
              delay={1.0}
            />
            <AnimatedSupportStats 
              label="Tiempo Promedio" 
              value="2.3h" 
              icon="⏱️" 
              delay={1.1}
            />
            <AnimatedSupportStats 
              label="Satisfacción" 
              value="98%" 
              icon="😊" 
              delay={1.2}
            />
            <AnimatedSupportStats 
              label="Documentos" 
              value="156" 
              icon="📄" 
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
                      ? 'bg-gradient-to-r from-support-500 to-support-600 text-white shadow-medium'
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