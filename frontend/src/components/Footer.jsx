import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AdvancedGlassCard } from './GlassmorphismEffects';
import { NeuralFooterEffects } from './NeuralFooterEffects';
import { FooterParallax } from './FooterParallax';

// Componente de enlace con efecto hover neural
const NeuralLink = ({ children, href, className = "", external = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const LinkComponent = external ? 'a' : Link;
  const linkProps = external ? { href, target: '_blank', rel: 'noopener noreferrer' } : { to: href };

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <LinkComponent
        {...linkProps}
        className={`relative z-10 text-gray-300 hover:text-white transition-colors duration-300 ${className}`}
      >
        {children}
      </LinkComponent>
      
      {/* Efecto neural en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-brain-500/20 rounded-lg blur-sm"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.8
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Partículas neurales */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-400 rounded-full"
              initial={{ 
                x: Math.random() * 100 - 50, 
                y: Math.random() * 20 - 10,
                opacity: 0 
              }}
              animate={{ 
                x: Math.random() * 100 - 50, 
                y: Math.random() * 20 - 10,
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Componente de icono social con efectos neurales
const SocialIcon = ({ icon, href, label }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {/* Fondo glassmorphism */}
      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-300 group-hover:text-white transition-all duration-300">
        <span className="text-xl">{icon}</span>
      </div>
      
      {/* Efecto de brillo neural */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/30 to-brain-500/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Partículas flotantes */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-400 rounded-full"
              initial={{ 
                x: 6, 
                y: 6,
                opacity: 0 
              }}
              animate={{ 
                x: Math.random() * 40 - 20, 
                y: Math.random() * 40 - 20,
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      )}
    </motion.a>
  );
};

// Componente de newsletter con efectos avanzados
const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular suscripción
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');
  };

  return (
    <AdvancedGlassCard intensity="high" variant="primary" className="p-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Mantente Actualizado
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          Recibe las últimas noticias sobre BrainSafes
        </p>
        
        {!isSubscribed ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 to-brain-500/10"
                animate={{ opacity: email ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-brain-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-brain-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Suscribiendo...</span>
                </div>
              ) : (
                'Suscribirse'
              )}
            </motion.button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-green-400 font-semibold">
              ¡Te has suscrito exitosamente!
            </p>
          </motion.div>
        )}
      </div>
    </AdvancedGlassCard>
  );
};

// Componente principal del Footer
export default function Footer() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.8]);

  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Plataforma',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Certificados', href: '/certificates' },
        { label: 'Cursos', href: '/courses' },
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'Comunidad', href: '/community' }
      ]
    },
    {
      title: 'Educación',
      links: [
        { label: 'Gestión de Cursos', href: '/learning/courses' },
        { label: 'Evaluación IA', href: '/learning/assessment' },
        { label: 'Certificados NFT', href: '/learning/certificates' },
        { label: 'Seguimiento', href: '/learning/progress' },
        { label: 'Becas', href: '/learning/scholarships' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Documentación', href: '/docs', external: true },
        { label: 'API', href: '/api', external: true },
        { label: 'Tutoriales', href: '/tutorials', external: true },
        { label: 'Soporte', href: '/support' },
        { label: 'Estado del Sistema', href: '/status', external: true }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos de Servicio', href: '/terms', external: true },
        { label: 'Política de Privacidad', href: '/privacy', external: true },
        { label: 'Cookies', href: '/cookies', external: true },
        { label: 'Licencias', href: '/licenses', external: true }
      ]
    }
  ];

  const socialLinks = [
    { icon: '🐦', href: 'https://twitter.com/brainsafes', label: 'Twitter' },
    { icon: '💬', href: 'https://t.me/Vai0sx', label: 'Telegram' },
    { icon: '📘', href: 'https://facebook.com/brainsafes', label: 'Facebook' },
    { icon: '📷', href: 'https://instagram.com/brainsafes', label: 'Instagram' },
    { icon: '💼', href: 'https://linkedin.com/company/brainsafes', label: 'LinkedIn' },
    { icon: '📺', href: 'https://youtube.com/brainsafes', label: 'YouTube' },
    { icon: '🐙', href: 'https://github.com/brainsafes', label: 'GitHub' },
    { icon: '💬', href: 'https://discord.gg/brainsafes', label: 'Discord' }
  ];

  return (
    <motion.footer 
      className="relative mt-20 overflow-hidden"
      style={{ y, opacity }}
    >
      {/* Efectos de parallax */}
      <FooterParallax />
      
      {/* Efectos de fondo neurales específicos para footer */}
      <div className="absolute inset-0">
        <NeuralFooterEffects 
          showNetwork={true}
          showParticles={true}
          showWaves={true}
        />
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Sección superior */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Información de la empresa */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-brain-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🧠</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-brain-400 bg-clip-text text-transparent">
                    BrainSafes
                  </h2>
                </div>
                
                <p className="text-gray-300 leading-relaxed">
                  La plataforma descentralizada que revoluciona la educación con blockchain, 
                  IA y tecnología Web3. Construye tu futuro con credenciales verificables 
                  y oportunidades de aprendizaje inteligente.
                </p>
                
                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-400">15K+</div>
                    <div className="text-xs text-gray-400">Estudiantes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brain-400">25K+</div>
                    <div className="text-xs text-gray-400">Certificados</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Enlaces de navegación */}
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                      viewport={{ once: true }}
                    >
                      <NeuralLink 
                        href={link.href} 
                        external={link.external}
                        className="text-sm hover:text-primary-400 transition-colors duration-300"
                      >
                        {link.label}
                      </NeuralLink>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          
          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 max-w-md mx-auto"
          >
            <NewsletterSignup />
          </motion.div>
        </div>
        
        {/* Línea divisoria con efecto neural */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent h-px" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-400 to-brain-400 h-px"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
        
        {/* Sección inferior */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center md:text-left"
            >
              <p className="text-gray-400 text-sm">
                © {currentYear} BrainSafes. Todos los derechos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Desarrollado con ❤️ por{' '}
                <a 
                  href="https://t.me/Vai0sx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors duration-300"
                >
                  @Vai0sx
                </a>
              </p>
            </motion.div>
            
            {/* Redes sociales */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center space-x-4"
            >
              {socialLinks.map((social, index) => (
                <motion.div
                  key={social.label}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + (index * 0.05) }}
                  viewport={{ once: true }}
                >
                  <SocialIcon {...social} />
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 pt-6 border-t border-gray-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Tecnología</h4>
                <p className="text-xs text-gray-400">
                  Blockchain • IA • Web3 • Smart Contracts • DeFi
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Seguridad</h4>
                <p className="text-xs text-gray-400">
                  Criptografía de última generación • Auditorías automáticas • Monitoreo 24/7
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Soporte</h4>
                <p className="text-xs text-gray-400">
                  Disponible 24/7 • Documentación completa • Comunidad activa
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
}
