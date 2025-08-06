import React, { useState } from 'react';

export default function ImageGallery({ images = [], title = "Galería de Imágenes" }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, masonry, list

  // Generar imágenes de ejemplo si no se proporcionan
  const defaultImages = images.length > 0 ? images : Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    src: `https://picsum.photos/400/${300 + Math.floor(Math.random() * 200)}?random=${i}`,
    alt: `Imagen ${i + 1}`,
    title: `Título de la imagen ${i + 1}`,
    description: `Descripción de la imagen ${i + 1}`,
    category: ['NFT', 'Arte', 'Fotografía', 'Digital'][Math.floor(Math.random() * 4)]
  }));

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {defaultImages.length} imágenes disponibles
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Vista:</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'masonry'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Masonry
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="space-y-6">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {defaultImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-large hover:scale-105"
                onClick={() => handleImageClick(image)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-lg">👁️</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {image.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {image.description}
                  </p>
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-xs rounded-full">
                    {image.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'masonry' && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {defaultImages.map((image) => (
              <div
                key={image.id}
                className="break-inside-avoid group relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-large"
                onClick={() => handleImageClick(image)}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-lg">👁️</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {image.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {image.description}
                  </p>
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-xs rounded-full">
                    {image.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {defaultImages.map((image) => (
              <div
                key={image.id}
                className="group flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-300 hover:shadow-large"
                onClick={() => handleImageClick(image)}
              >
                <div className="flex-shrink-0">
                  <div className="aspect-square w-24 overflow-hidden rounded-xl">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {image.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {image.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-xs rounded-full">
                      {image.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {image.id}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-gray-400 text-lg">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full overflow-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-200"
            >
              ✕
            </button>
            <div className="p-6">
              <div className="aspect-video overflow-hidden rounded-xl mb-4">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedImage.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedImage.description}
                </p>
                <div className="flex items-center space-x-4">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-sm rounded-full">
                    {selectedImage.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {selectedImage.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 