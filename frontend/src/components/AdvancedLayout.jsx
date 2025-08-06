import React, { useState } from 'react';

export default function AdvancedLayout() {
  const [layoutMode, setLayoutMode] = useState('grid'); // grid, flex, masonry
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cards = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Tarjeta ${i + 1}`,
    content: `Contenido de la tarjeta ${i + 1} con información relevante.`,
    category: ['Primaria', 'Secundaria', 'Técnica', 'Universitaria'][i % 4],
    priority: ['Alta', 'Media', 'Baja'][i % 3],
    color: ['blue', 'green', 'purple', 'yellow', 'red', 'indigo'][i % 6]
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Layout Avanzado
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Demostración de las capacidades avanzadas de layout de Tailwind CSS v4.1
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Layout:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['grid', 'flex', 'masonry'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    layoutMode === mode
                      ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            {sidebarOpen ? 'Ocultar' : 'Mostrar'} Sidebar
          </button>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Filtros
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>Todas</option>
                      <option>Primaria</option>
                      <option>Secundaria</option>
                      <option>Técnica</option>
                      <option>Universitaria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prioridad
                    </label>
                    <div className="space-y-2">
                      {['Alta', 'Media', 'Baja'].map((priority) => (
                        <label key={priority} className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1">
            {layoutMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-large transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-xl flex items-center justify-center mb-4`}>
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{card.content}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-1 bg-${card.color}-100 text-${card.color}-800 dark:bg-${card.color}-900/30 dark:text-${card.color}-400 text-xs rounded-full`}>
                        {card.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        card.priority === 'Alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        card.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {card.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {layoutMode === 'flex' && (
              <div className="flex flex-wrap gap-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex-1 min-w-[300px] max-w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-large transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{card.content}</p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-2 py-1 bg-${card.color}-100 text-${card.color}-800 dark:bg-${card.color}-900/30 dark:text-${card.color}-400 text-xs rounded-full`}>
                            {card.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            card.priority === 'Alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            card.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {card.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {layoutMode === 'masonry' && (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="break-inside-avoid bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-large transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-${card.color}-100 dark:bg-${card.color}-900/20 rounded-xl flex items-center justify-center mb-4`}>
                      <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{card.content}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-1 bg-${card.color}-100 text-${card.color}-800 dark:bg-${card.color}-900/30 dark:text-${card.color}-400 text-xs rounded-full`}>
                        {card.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        card.priority === 'Alta' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        card.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {card.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cards.length}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Categorías</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <div className="text-3xl">🏷️</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Prioridad Alta</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <div className="text-3xl">🔴</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 