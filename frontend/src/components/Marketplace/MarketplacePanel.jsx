import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

// Componente de partículas para el marketplace
const MarketplaceParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary-400/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 5 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 4,
        }}
      />
    ))}
  </div>
);

// Componente de estadísticas animadas
const AnimatedStats = ({ label, value, icon, delay = 0 }) => (
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <MarketplaceParticles />
      
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
              className="inline-flex items-center px-4 py-2 bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200/50 dark:border-primary-700/50 mb-4"
            >
              🎨 NFT Marketplace
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent">
                Marketplace
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto lg:mx-0"
            >
              Descubre, compra y vende NFTs únicos de la colección BrainSafes
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
            <AnimatedStats 
              label="NFTs Totales" 
              value={filteredNFTs.length} 
              icon="🎨" 
              delay={1.0}
            />
            <AnimatedStats 
              label="Valor Total" 
              value={`${totalValue.toFixed(2)} ETH`} 
              icon="💰" 
              delay={1.1}
            />
            <AnimatedStats 
              label="Precio Promedio" 
              value={`${averagePrice.toFixed(2)} ETH`} 
              icon="📊" 
              delay={1.2}
            />
            <AnimatedStats 
              label="En Venta" 
              value={filteredNFTs.filter(nft => nft.status === 'en venta').length} 
              icon="🛒" 
              delay={1.3}
            />
          </div>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
            <MarketplaceFilters filtros={filtros} setFiltros={setFiltros} />
            
            {/* View Controls */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📱
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📋
                </motion.button>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="recent">Más Recientes</option>
                  <option value="price">Por Precio</option>
                  <option value="popularity">Más Populares</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gallery Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden">
            <NFTGallery 
              nfts={filteredNFTs} 
              viewMode={viewMode}
              isLoading={isLoading}
            />
          </div>
        </motion.div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-8 text-center"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredNFTs.length} de {nfts.length} NFTs disponibles
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 