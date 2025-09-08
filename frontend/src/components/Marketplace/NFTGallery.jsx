import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NFTGallery({ nfts, viewMode = 'grid', isLoading = false }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [hovered, setHovered] = useState(-1);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(null);

  const handleViewDetail = (nft) => {
    setLoading(true);
    setTimeout(() => {
      setSelected(nft);
      setLoading(false);
      setSuccess(true);
      setActionMsg('Detalle mostrado (simulado)');
      setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

  const handleBuy = (nft) => {
    setLoading(true);
    const fail = Math.random() < 0.2;
    setTimeout(() => {
      setLoading(false);
      if (fail) {
        setError(true);
        setActionMsg('Error al comprar el NFT. Intenta de nuevo.');
        setTimeout(() => setError(false), 2000);
      } else {
        setSuccess(true);
        setActionMsg('¡Compra realizada (simulada)!');
        setTimeout(() => setSuccess(false), 2000);
      }
    }, 1200);
  };

  const handleFavorite = (nft) => {
    setFavLoading(nft.id);
    const fail = Math.random() < 0.15;
    setTimeout(() => {
      setFavLoading(null);
      if (fail) {
        setError(true);
        setActionMsg('Error al actualizar favoritos.');
        setTimeout(() => setError(false), 2000);
      } else {
        setFavorites(favs => favs.includes(nft.id) ? favs.filter(id => id !== nft.id) : [...favs, nft.id]);
        setSuccess(true);
        setActionMsg(favorites.includes(nft.id) ? 'Eliminado de favoritos' : 'Añadido a favoritos');
        setTimeout(() => setSuccess(false), 2000);
      }
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="relative p-6 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
                
                <div className="aspect-square bg-gradient-to-br from-white/20 to-white/10 rounded-2xl mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-white/30 to-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-white/30 to-white/20 rounded w-1/2"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] w-full p-8"
      >
        <div className="relative p-8 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
          
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-6xl mb-4"
            >
              😔
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
              No se encontraron NFTs
            </h3>
            <p className="text-white/80 text-center">
              No se encontraron NFTs con los filtros seleccionados.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NFT Grid/List */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }`}>
        <AnimatePresence>
          {nfts.map((nft, idx) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.6, delay: idx * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              }}
              className={`group relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden transition-all duration-500 ${
                hovered === idx ? 'scale-105 shadow-2xl' : ''
              } ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(-1)}
            >
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
              {/* NFT Image con Glassmorphism 3D */}
              <div className={`relative overflow-hidden rounded-2xl ${
                viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'
              }`}>
                <img
                  src={nft.image || `https://picsum.photos/400/400?random=${nft.id}`}
                  alt={nft.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay con glassmorphism */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/0 group-hover:from-black/20 group-hover:via-black/10 group-hover:to-black/20 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(nft);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl text-gray-900 rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Ver Detalle
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(nft);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Comprar
                    </motion.button>
                  </div>
                </div>

                {/* Favorite Button con Glassmorphism */}
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(nft);
                  }}
                  className="absolute top-3 right-3 p-3 bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl rounded-full border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={favLoading === nft.id}
                >
                  {favLoading === nft.id ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : favorites.includes(nft.id) ? (
                    <span className="text-red-500 text-xl">❤️</span>
                  ) : (
                    <span className="text-white/70 hover:text-red-500 text-xl">🤍</span>
                  )}
                </motion.button>

                {/* Price Tag con Glassmorphism */}
                <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-sm font-bold border-2 border-white/50 shadow-lg">
                  {nft.price} ETH
                </div>

                {/* Rarity Badge con Glassmorphism */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-xl text-white px-3 py-2 rounded-2xl text-xs font-bold border-2 border-white/50 shadow-lg">
                  {nft.rarity}
                </div>
              </div>

              {/* NFT Info con Glassmorphism */}
              <div className={`p-6 space-y-4 relative z-10 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                    {nft.name}
                  </h3>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {nft.description}
                  </p>
                </div>

                {/* Creator Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/50 shadow-lg">
                      {nft.creator?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Creador</p>
                      <p className="text-sm font-bold text-white">
                        {nft.creator || 'Usuario'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-sm font-bold text-white">
                      {nft.rating || '4.5'}
                    </span>
                  </div>
                </div>

                {/* Stats con Glassmorphism */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <p className="text-xs text-white/70 font-medium">Vistas</p>
                    <p className="text-sm font-bold text-white">
                      {nft.views || Math.floor(Math.random() * 1000)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <p className="text-xs text-white/70 font-medium">Likes</p>
                    <p className="text-sm font-bold text-white">
                      {nft.likes || Math.floor(Math.random() * 100)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <p className="text-xs text-white/70 font-medium">Ofertas</p>
                    <p className="text-sm font-bold text-white">
                      {nft.offers || Math.floor(Math.random() * 10)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {actionMsg}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white font-medium">Procesando...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 