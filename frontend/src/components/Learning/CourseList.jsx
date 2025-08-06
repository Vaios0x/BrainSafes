import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const cursosSimulados = [
  {
    id: 1,
    nombre: 'Introducción a Blockchain',
    descripcion: 'Aprende los fundamentos de la tecnología blockchain, desde la criptografía hasta la descentralización.',
    progreso: 100,
    certificado: true,
    badge: 'Pionero',
    mentor: 'Alice',
    avatar: '👩‍💻',
    nivel: 'Básico',
    duracion: '4 semanas',
    lecciones: 12,
    rating: 4.8,
    estudiantes: 1247,
    imagen: 'https://picsum.photos/400/300?random=1',
    tags: ['Blockchain', 'Fundamentos', 'Criptografía']
  },
  {
    id: 2,
    nombre: 'Smart Contracts Avanzados',
    descripcion: 'Domina el desarrollo de smart contracts con Solidity y patrones de diseño avanzados.',
    progreso: 60,
    certificado: false,
    badge: 'Desarrollador',
    mentor: 'Bob',
    avatar: '👨‍💻',
    nivel: 'Avanzado',
    duracion: '6 semanas',
    lecciones: 18,
    rating: 4.9,
    estudiantes: 892,
    imagen: 'https://picsum.photos/400/300?random=2',
    tags: ['Solidity', 'Smart Contracts', 'Patrones']
  },
  {
    id: 3,
    nombre: 'DeFi y Finanzas Web3',
    descripcion: 'Explora el ecosistema DeFi, yield farming, y las finanzas descentralizadas.',
    progreso: 20,
    certificado: false,
    badge: 'Financiero',
    mentor: 'Charlie',
    avatar: '👨‍🎓',
    nivel: 'Intermedio',
    duracion: '5 semanas',
    lecciones: 15,
    rating: 4.7,
    estudiantes: 1567,
    imagen: 'https://picsum.photos/400/300?random=3',
    tags: ['DeFi', 'Yield Farming', 'Web3']
  },
  {
    id: 4,
    nombre: 'NFTs y Metaverso',
    descripcion: 'Crea, comercializa y desarrolla aplicaciones NFT para el metaverso.',
    progreso: 0,
    certificado: false,
    badge: 'Creador',
    mentor: 'Diana',
    avatar: '👩‍🎨',
    nivel: 'Intermedio',
    duracion: '4 semanas',
    lecciones: 14,
    rating: 4.6,
    estudiantes: 2341,
    imagen: 'https://picsum.photos/400/300?random=4',
    tags: ['NFTs', 'Metaverso', 'Arte Digital']
  },
  {
    id: 5,
    nombre: 'Seguridad en Blockchain',
    descripcion: 'Aprende las mejores prácticas de seguridad para aplicaciones blockchain.',
    progreso: 0,
    certificado: false,
    badge: 'Seguridad',
    mentor: 'Eve',
    avatar: '🛡️',
    nivel: 'Avanzado',
    duracion: '3 semanas',
    lecciones: 10,
    rating: 4.9,
    estudiantes: 678,
    imagen: 'https://picsum.photos/400/300?random=5',
    tags: ['Seguridad', 'Auditoría', 'Pentesting']
  },
  {
    id: 6,
    nombre: 'Arbitrum y L2 Scaling',
    descripcion: 'Domina las soluciones de escalabilidad L2 y el ecosistema Arbitrum.',
    progreso: 0,
    certificado: false,
    badge: 'Escalabilidad',
    mentor: 'Frank',
    avatar: '⚡',
    nivel: 'Avanzado',
    duracion: '5 semanas',
    lecciones: 16,
    rating: 4.8,
    estudiantes: 445,
    imagen: 'https://picsum.photos/400/300?random=6',
    tags: ['Arbitrum', 'L2', 'Escalabilidad']
  },
];

export default function CourseList() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCursos = cursosSimulados.filter(curso => {
    const matchSearch = curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      curso.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || 
                       (filter === 'completed' && curso.progreso === 100) ||
                       (filter === 'in-progress' && curso.progreso > 0 && curso.progreso < 100) ||
                       (filter === 'not-started' && curso.progreso === 0);
    
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cursos y Tutoriales
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Aprende blockchain, DeFi y Web3 con expertos del ecosistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cursos..."
                className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos', icon: '📚' },
              { id: 'completed', label: 'Completados', icon: '✅' },
              { id: 'in-progress', label: 'En Progreso', icon: '🔄' },
              { id: 'not-started', label: 'No Iniciados', icon: '⏳' },
            ].map((filterOption) => (
              <motion.button
                key={filterOption.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterOption.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filter === filterOption.id
                    ? 'bg-gradient-to-r from-primary-500 to-brain-500 text-white shadow-medium'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span>{filterOption.icon}</span>
                <span className="hidden sm:inline">{filterOption.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredCursos.map((curso, idx) => (
            <motion.div
              key={curso.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/20 overflow-hidden"
            >
              {/* Course Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={curso.imagen}
                  alt={curso.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {curso.nivel}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    ⭐ {curso.rating}
                  </span>
                </div>
                {curso.certificado && (
                  <div className="absolute bottom-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      🎓 Certificado
                    </span>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {curso.nombre}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {curso.descripcion}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {curso.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {curso.lecciones}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Lecciones
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {curso.duracion}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Duración
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {curso.estudiantes.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Estudiantes
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Progreso
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {curso.progreso}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary-500 to-brain-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${curso.progreso}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                {/* Mentor */}
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{curso.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {curso.mentor}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Mentor
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelected(curso.id)}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-brain-500 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-brain-600 transition-all duration-300"
                  >
                    {curso.progreso === 100 ? 'Repasar' : curso.progreso > 0 ? 'Continuar' : 'Comenzar'}
                  </motion.button>
                  
                  {curso.certificado && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-300"
                    >
                      🎓
                    </motion.button>
                  )}
                </div>

                {/* Quiz Section */}
                <AnimatePresence>
                  {selected === curso.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                    >
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Quiz del Curso
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Pon a prueba tus conocimientos con preguntas interactivas.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-300"
                      >
                        Iniciar Quiz 🎯
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredCursos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No se encontraron cursos
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Intenta ajustar los filtros o términos de búsqueda.
          </p>
        </motion.div>
      )}
    </div>
  );
} 