import React, { useState } from 'react';
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
              className="animate-pulse"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl mb-4"
        >
          😔
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No se encontraron NFTs
        </h3>
        <p className="text-gray-500 dark:text-gray-500 text-center">
          No se encontraron NFTs con los filtros seleccionados.
        </p>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-large ${
                hovered === idx ? 'scale-105 shadow-large' : ''
              } ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(-1)}
            >
              {/* NFT Image */}
              <div className={`relative overflow-hidden ${
                viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'
              }`}>
                <img
                  src={nft.image || `https://picsum.photos/400/400?random=${nft.id}`}
                  alt={nft.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(nft);
                      }}
                      className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors duration-200"
                    >
                      Ver Detalle
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(nft);
                      }}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                    >
                      Comprar
                    </motion.button>
                  </div>
                </div>

                {/* Favorite Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(nft);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={favLoading === nft.id}
                >
                  {favLoading === nft.id ? (
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : favorites.includes(nft.id) ? (
                    <span className="text-red-500 text-lg">❤️</span>
                  ) : (
                    <span className="text-gray-400 hover:text-red-500 text-lg">🤍</span>
                  )}
                </motion.button>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  {nft.price} ETH
                </div>

                {/* Rarity Badge */}
                <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                  {nft.rarity}
                </div>
              </div>

              {/* NFT Info */}
              <div className={`p-4 space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                    {nft.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {nft.description}
                  </p>
                </div>

                {/* Creator Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-brain-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {nft.creator?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Creador</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {nft.creator || 'Usuario'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {nft.rating || '4.5'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vistas</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {nft.views || Math.floor(Math.random() * 1000)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {nft.likes || Math.floor(Math.random() * 100)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ofertas</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
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