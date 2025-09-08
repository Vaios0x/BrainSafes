import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import NeuralBackground from '../NeuralBackground';
import NFTGallery from './NFTGallery';
import MarketplaceFilters from './MarketplaceFilters';

// NFTs simulados con datos más ricos
const nftsEjemplo = [
  {
    id: 1,
    name: 'Brain NFT #1',
    image: 'https://picsum.photos/400/400?random=1',
    owner: '0x1234...abcd',
    creator: 'BrainSafes',
    price: 1.2,
    status: 'en venta',
    rarity: 'Legendario',
    rating: 4.8,
    views: 1247,
    likes: 89,
    offers: 12,
    attributes: [
      { trait_type: 'Color', value: 'Azul' },
      { trait_type: 'Nivel', value: '5' },
    ],
    description: 'NFT único de la colección BrainSafes con características especiales.',
    history: [
      { from: '0x0000...0000', to: '0x1234...abcd', date: '2024-07-01', price: 1.2 },
    ],
  },
  {
    id: 2,
    name: 'Brain NFT #2',
    image: 'https://picsum.photos/400/400?random=2',
    owner: '0x5678...efgh',
    creator: 'BrainSafes',
    price: 0.8,
    status: 'vendido',
    rarity: 'Raro',
    rating: 4.5,
    views: 892,
    likes: 67,
    offers: 8,
    attributes: [
      { trait_type: 'Color', value: 'Rojo' },
      { trait_type: 'Nivel', value: '3' },
    ],
    description: 'NFT especial de la colección BrainSafes con diseño único.',
    history: [
      { from: '0x0000...0000', to: '0x5678...efgh', date: '2024-06-15', price: 0.8 },
    ],
  },
  {
    id: 3,
    name: 'Brain NFT #3',
    image: 'https://picsum.photos/400/400?random=3',
    owner: '0x9abc...def0',
    creator: 'BrainSafes',
    price: 2.1,
    status: 'en venta',
    rarity: 'Legendario',
    rating: 4.9,
    views: 2156,
    likes: 156,
    offers: 23,
    attributes: [
      { trait_type: 'Color', value: 'Dorado' },
      { trait_type: 'Nivel', value: '7' },
    ],
    description: 'NFT premium de la colección BrainSafes con características exclusivas.',
    history: [
      { from: '0x0000...0000', to: '0x9abc...def0', date: '2024-07-10', price: 2.1 },
    ],
  },
  {
    id: 4,
    name: 'Brain NFT #4',
    image: 'https://picsum.photos/400/400?random=4',
    owner: '0xdef1...2345',
    creator: 'BrainSafes',
    price: 0.5,
    status: 'en venta',
    rarity: 'Común',
    rating: 4.2,
    views: 456,
    likes: 34,
    offers: 5,
    attributes: [
      { trait_type: 'Color', value: 'Verde' },
      { trait_type: 'Nivel', value: '2' },
    ],
    description: 'NFT básico de la colección BrainSafes perfecto para principiantes.',
    history: [
      { from: '0x0000...0000', to: '0xdef1...2345', date: '2024-06-20', price: 0.5 },
    ],
  },
];

const filtrosIniciales = {
  nombre: '',
  rareza: 'all',
  estado: 'all',
  precioMin: '',
  precioMax: '',
};

// Componente de partículas neurales avanzadas para el marketplace
const NeuralMarketplaceParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`,
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

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = (120 - distance) / 120 * 0.2;
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
    particlesRef.current = Array.from({ length: 50 }, createParticle);
    
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
const NeuralAnimatedStats = ({ label, value, icon, delay = 0, color = "blue" }) => (
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

export default function MarketplacePanel() {
  const { t } = useTranslation();
  const [nfts] = useState(nftsEjemplo);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [sortBy, setSortBy] = useState('recent'); // recent, price, popularity

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filtrado y ordenamiento de NFTs
  const filteredNFTs = nfts
    .filter(nft => {
      const matchNombre = filtros.nombre === '' || 
        nft.name.toLowerCase().includes(filtros.nombre.toLowerCase());
      const matchRareza = filtros.rareza === 'all' || nft.rarity === filtros.rareza;
      const matchEstado = filtros.estado === 'all' || nft.status === filtros.estado;
      const matchPrecioMin = filtros.precioMin === '' || nft.price >= parseFloat(filtros.precioMin);
      const matchPrecioMax = filtros.precioMax === '' || nft.price <= parseFloat(filtros.precioMax);
      
      return matchNombre && matchRareza && matchEstado && matchPrecioMin && matchPrecioMax;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'popularity':
          return b.views - a.views;
        default:
          return b.id - a.id; // recent
      }
    });

  const totalValue = filteredNFTs.reduce((sum, nft) => sum + nft.price, 0);
  const averagePrice = filteredNFTs.length > 0 ? totalValue / filteredNFTs.length : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeuralBackground theme="marketplace" particleCount={55} waveCount={8} intensity="high" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="text-center lg:text-left relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-full text-sm font-bold border-2 border-white/50 mb-6 shadow-2xl"
            >
              <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse shadow-lg shadow-green-400/50"></span>
              🚀 Arbitrum Sepolia
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.8)' }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Marketplace
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-white/90 max-w-3xl mx-auto lg:mx-0 font-medium"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8)' }}
            >
              Plataforma descentralizada en Arbitrum Sepolia - Descubre, compra y vende NFTs únicos de la colección BrainSafes
            </motion.p>
          </div>
        </motion.div>

        {/* Marketplace Navigation con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-12"
        >
          <div className="relative p-8 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <h3 className="text-2xl font-bold text-white mb-6 text-center" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
              Funcionalidades del Marketplace
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.a
                href="/marketplace/jobs"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-xl rounded-2xl border-2 border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center">
                  <motion.div 
                    className="text-4xl mb-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    💼
                  </motion.div>
                  <h4 className="font-bold text-white text-center mb-2">Publicación de Empleos</h4>
                  <p className="text-sm text-white/80 text-center">
                    Publica y encuentra empleos descentralizados
                  </p>
                </div>
              </motion.a>

              <motion.a
                href="/marketplace/matching"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-xl rounded-2xl border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center">
                  <motion.div 
                    className="text-4xl mb-3"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🤖
                  </motion.div>
                  <h4 className="font-bold text-white text-center mb-2">Matching con IA</h4>
                  <p className="text-sm text-white/80 text-center">
                    Emparejamiento automático inteligente
                  </p>
                </div>
              </motion.a>

              <motion.a
                href="/marketplace/reputation"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-xl rounded-2xl border-2 border-green-400/30 hover:border-green-400/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center">
                  <motion.div 
                    className="text-4xl mb-3"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.div>
                  <h4 className="font-bold text-white text-center mb-2">Sistema de Reputación</h4>
                  <p className="text-sm text-white/80 text-center">
                    Reputación transparente y verificable
                  </p>
                </div>
              </motion.a>

              <motion.a
                href="/marketplace"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-xl rounded-2xl border-2 border-orange-400/30 hover:border-orange-400/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center">
                  <motion.div 
                    className="text-4xl mb-3"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🎨
                  </motion.div>
                  <h4 className="font-bold text-white text-center mb-2">NFT Marketplace</h4>
                  <p className="text-sm text-white/80 text-center">
                    Compra y vende NFTs únicos
                  </p>
                </div>
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <NeuralAnimatedStats 
              label="NFTs Totales" 
              value={filteredNFTs.length} 
              icon="🎨" 
              delay={1.0}
              color="blue"
            />
            <NeuralAnimatedStats 
              label="Valor Total" 
              value={`${totalValue.toFixed(2)} ETH`} 
              icon="💰" 
              delay={1.1}
              color="green"
            />
            <NeuralAnimatedStats 
              label="Precio Promedio" 
              value={`${averagePrice.toFixed(2)} ETH`} 
              icon="📊" 
              delay={1.2}
              color="purple"
            />
            <NeuralAnimatedStats 
              label="En Venta" 
              value={filteredNFTs.filter(nft => nft.status === 'en venta').length} 
              icon="🛒" 
              delay={1.3}
              color="orange"
            />
          </div>
        </motion.div>

        {/* Controls Section con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-12"
        >
          <div className="relative p-8 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <MarketplaceFilters filtros={filtros} setFiltros={setFiltros} />
            
            {/* View Controls */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-4 rounded-2xl transition-all duration-300 border-2 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                >
                  <span className="text-2xl">📱</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('list')}
                  className={`p-4 rounded-2xl transition-all duration-300 border-2 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border-blue-400/50 shadow-lg shadow-blue-500/25'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                >
                  <span className="text-2xl">📋</span>
                </motion.button>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-6 py-3 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300"
                >
                  <option value="recent" className="bg-gray-800 text-white">Más Recientes</option>
                  <option value="price" className="bg-gray-800 text-white">Por Precio</option>
                  <option value="popularity" className="bg-gray-800 text-white">Más Populares</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gallery Section con Glassmorphism 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <NFTGallery 
              nfts={filteredNFTs} 
              viewMode={viewMode}
              isLoading={isLoading}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
} 