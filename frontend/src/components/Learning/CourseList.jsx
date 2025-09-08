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
      {/* Header con Glassmorphism */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
          Cursos y Tutoriales
        </h3>
        <p className="text-white/80">
          Aprende blockchain, DeFi y Web3 con expertos del ecosistema
        </p>
      </div>

      {/* Filters con Glassmorphism */}
      <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden p-8">
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
        
        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cursos..."
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 shadow-lg"
              />
              <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/80 text-lg">
                🔍
              </span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-3">
            {[
              { id: 'all', label: 'Todos', icon: '📚' },
              { id: 'completed', label: 'Completados', icon: '✅' },
              { id: 'in-progress', label: 'En Progreso', icon: '🔄' },
              { id: 'not-started', label: 'No Iniciados', icon: '⏳' },
            ].map((filterOption) => (
              <motion.button
                key={filterOption.id}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterOption.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all duration-300 border-2 ${
                  filter === filterOption.id
                    ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white border-blue-400/50 shadow-lg'
                    : 'bg-white/10 backdrop-blur-xl text-white/70 border-white/20 hover:bg-white/20 hover:border-white/40'
                }`}
              >
                <span className="text-lg">{filterOption.icon}</span>
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
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.6, delay: idx * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              }}
              className="relative bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden group"
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
              {/* Course Image con Glassmorphism */}
              <div className="relative h-48 overflow-hidden rounded-2xl">
                <img
                  src={curso.imagen}
                  alt={curso.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-sm font-bold border-2 border-white/50 shadow-lg">
                    {curso.nivel}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl text-gray-900 px-4 py-2 rounded-2xl text-sm font-bold border-2 border-white/50 shadow-lg">
                    ⭐ {curso.rating}
                  </span>
                </div>
                {curso.certificado && (
                  <div className="absolute bottom-4 right-4">
                    <span className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-sm font-bold border-2 border-white/50 shadow-lg">
                      🎓 Certificado
                    </span>
                  </div>
                )}
              </div>

              {/* Course Info con Glassmorphism */}
              <div className="p-6 space-y-4 relative z-10">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                    {curso.nombre}
                  </h4>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {curso.descripcion}
                  </p>
                </div>

                {/* Tags con Glassmorphism */}
                <div className="flex flex-wrap gap-2">
                  {curso.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-white/20 backdrop-blur-xl text-white px-3 py-1 rounded-2xl text-xs font-bold border border-white/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats con Glassmorphism */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <div className="text-lg font-bold text-white">
                      {curso.lecciones}
                    </div>
                    <div className="text-xs text-white/70 font-medium">
                      Lecciones
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <div className="text-lg font-bold text-white">
                      {curso.duracion}
                    </div>
                    <div className="text-xs text-white/70 font-medium">
                      Duración
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/30">
                    <div className="text-lg font-bold text-white">
                      {curso.estudiantes.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/70 font-medium">
                      Estudiantes
                    </div>
                  </div>
                </div>

                {/* Progress con Glassmorphism */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80 font-medium">
                      Progreso
                    </span>
                    <span className="text-sm font-bold text-white">
                      {curso.progreso}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 backdrop-blur-xl rounded-full h-3 border border-white/30">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${curso.progreso}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                {/* Mentor */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{curso.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {curso.mentor}
                    </div>
                    <div className="text-xs text-white/70 font-medium">
                      Mentor
                    </div>
                  </div>
                </div>

                {/* Actions con Glassmorphism */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelected(curso.id)}
                    className="flex-1 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white py-4 rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {curso.progreso === 100 ? 'Repasar' : curso.progreso > 0 ? 'Continuar' : 'Comenzar'}
                  </motion.button>
                  
                  {curso.certificado && (
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-4 bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-xl text-white rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      🎓
                    </motion.button>
                  )}
                </div>

                {/* Quiz Section con Glassmorphism */}
                <AnimatePresence>
                  {selected === curso.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/30"
                    >
                      <h5 className="font-bold text-white mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                        Quiz del Curso
                      </h5>
                      <p className="text-sm text-white/80 mb-4">
                        Pon a prueba tus conocimientos con preguntas interactivas.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-xl text-white py-3 rounded-2xl font-bold border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
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

      {/* Empty State con Glassmorphism */}
      {filteredCursos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="relative p-8 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            
            <div className="relative z-10">
              <motion.div 
                className="text-6xl mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity 
                }}
              >
                📚
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                No se encontraron cursos
              </h3>
              <p className="text-white/80">
                Intenta ajustar los filtros o términos de búsqueda.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 