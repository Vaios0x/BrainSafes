import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedGlassCard } from '../GlassmorphismEffects';

// Componente de red neuronal 3D para dashboard
const NeuralNetwork3D = ({ width = 800, height = 400 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => {
      if (canvasRef.current) {
        observer.unobserve(canvasRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Configuración de la red neuronal
    const nodes = [];
    const connections = [];
    const numNodes = 60;
    const maxDistance = 150;
    const centerX = width / 2;
    const centerY = height / 2;

    // Crear nodos en forma de red neuronal
    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const radius = 80 + Math.random() * 60;
      const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
      const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 40;

      nodes.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 200, // Azul a púrpura
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        layer: Math.floor(Math.random() * 3) + 1
      });
    }

    // Crear conexiones entre nodos
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          connections.push({
            from: i,
            to: j,
            distance: distance,
            opacity: (maxDistance - distance) / maxDistance * 0.3,
            weight: Math.random() * 0.5 + 0.5
          });
        }
      }
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.008;

      // Actualizar nodos
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Rebote suave en los bordes
        if (node.x < 0 || node.x > width) node.vx *= -0.8;
        if (node.y < 0 || node.y > height) node.vy *= -0.8;

        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));

        // Efecto de pulso
        node.pulse += node.pulseSpeed;
        const pulse = Math.sin(node.pulse) * 0.4 + 0.6;
        node.currentSize = node.size * pulse;
        node.currentOpacity = node.opacity * pulse;
      });

      // Dibujar conexiones
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = conn.opacity * 0.4;
          const pulse = Math.sin(time * 3 + conn.from * 0.1) * 0.3 + 0.7;
          
          // Gradiente para la conexión
          const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
          gradient.addColorStop(0, `hsla(${fromNode.hue}, 60%, 50%, ${opacity * pulse})`);
          gradient.addColorStop(1, `hsla(${toNode.hue}, 60%, 50%, ${opacity * pulse})`);
          
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = conn.weight;
          ctx.stroke();
        }
      });

      // Dibujar nodos
      nodes.forEach(node => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.currentSize * 3
        );
        gradient.addColorStop(0, `hsla(${node.hue}, 70%, 60%, ${node.currentOpacity})`);
        gradient.addColorStop(0.5, `hsla(${node.hue}, 60%, 50%, ${node.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${node.hue}, 50%, 40%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Nodo principal
        ctx.fillStyle = `hsla(${node.hue}, 80%, 70%, ${node.currentOpacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Borde del nodo
        ctx.strokeStyle = `hsla(${node.hue}, 90%, 80%, ${node.currentOpacity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ width, height }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-brain-500/5 rounded-xl pointer-events-none" />
    </motion.div>
  );
};

// Componente de métricas en tiempo real
const RealTimeMetrics = () => {
  const [metrics, setMetrics] = useState({
    transactions: 0,
    users: 0,
    contracts: 0,
    gasPrice: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        transactions: Math.floor(Math.random() * 1000) + 5000,
        users: Math.floor(Math.random() * 100) + 1200,
        contracts: Math.floor(Math.random() * 10) + 35,
        gasPrice: (Math.random() * 50 + 20).toFixed(2)
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const metricItems = [
    { label: 'Transacciones/min', value: metrics.transactions, icon: '🔄', color: 'text-blue-600' },
    { label: 'Usuarios Activos', value: metrics.users, icon: '👥', color: 'text-green-600' },
    { label: 'Contratos', value: metrics.contracts, icon: '📋', color: 'text-purple-600' },
    { label: 'Gas Price (Gwei)', value: metrics.gasPrice, icon: '⛽', color: 'text-orange-600' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metricItems.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="text-center"
        >
          <AdvancedGlassCard intensity="medium" variant="default" className="p-4">
            <div className="text-2xl mb-2">{metric.icon}</div>
            <div className={`text-xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metric.label}
            </div>
          </AdvancedGlassCard>
        </motion.div>
      ))}
    </div>
  );
};

// Componente principal del dashboard neural
const NeuralDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'network', label: 'Red Neural', icon: '🧠' },
    { id: 'metrics', label: 'Métricas', icon: '📈' },
    { id: 'activity', label: 'Actividad', icon: '⚡' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          <span className="bg-gradient-to-r from-primary-600 via-brain-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Neural
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Visualización avanzada de la red neuronal de BrainSafes
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="flex space-x-2 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl p-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/20'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedGlassCard intensity="high" variant="primary" className="p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Red Neuronal de BrainSafes
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Sistema de inteligencia artificial que procesa y analiza datos en tiempo real
                </p>
                <RealTimeMetrics />
              </div>
            </AdvancedGlassCard>
          </motion.div>
        )}

        {activeTab === 'network' && (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedGlassCard intensity="high" variant="default" className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Visualización de Red Neuronal
              </h3>
              <NeuralNetwork3D width={800} height={400} />
            </AdvancedGlassCard>
          </motion.div>
        )}

        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedGlassCard intensity="medium" variant="default" className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Métricas en Tiempo Real
              </h3>
              <RealTimeMetrics />
            </AdvancedGlassCard>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedGlassCard intensity="medium" variant="default" className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Procesamiento de datos completado', time: 'hace 30 seg', status: 'success' },
                  { action: 'Nuevo nodo agregado a la red', time: 'hace 2 min', status: 'info' },
                  { action: 'Optimización de algoritmo ejecutada', time: 'hace 5 min', status: 'success' },
                  { action: 'Sincronización con blockchain', time: 'hace 8 min', status: 'info' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {activity.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </AdvancedGlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeuralDashboard;
