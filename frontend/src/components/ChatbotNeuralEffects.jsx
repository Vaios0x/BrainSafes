import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Componente de partículas cuánticas especializadas para chatbot
export const ChatbotQuantumParticles = ({ count = 50, className = "" }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 200,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 20 + 5,
      frequency: Math.random() * 0.03 + 0.01,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: `hsl(${particle.hue}, 70%, 60%)`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 4}px hsl(${particle.hue}, 70%, 60%)`
          }}
          animate={{
            x: [
              0,
              Math.cos(particle.direction) * particle.amplitude,
              Math.cos(particle.direction + Math.PI) * particle.amplitude,
              0
            ],
            y: [
              0,
              Math.sin(particle.direction) * particle.amplitude,
              Math.sin(particle.direction + Math.PI) * particle.amplitude,
              0
            ],
            opacity: [
              particle.opacity,
              particle.opacity * 0.3,
              particle.opacity * 0.7,
              particle.opacity
            ],
            scale: [1, 1.5, 0.8, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Componente de red neuronal simplificada para chatbot
export const ChatbotNeuralNetwork = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configuración de la red neuronal
    const nodes = [];
    const connections = [];
    const numNodes = 15;
    const maxDistance = 120;
    const minDistance = 30;

    // Crear nodos
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 3 + 2,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 200,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Crear conexiones
    const updateConnections = () => {
      connections.length = 0;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance && distance > minDistance) {
            connections.push({
              from: i,
              to: j,
              distance: distance,
              opacity: (maxDistance - distance) / maxDistance * 0.3,
              strength: 1 - (distance / maxDistance)
            });
          }
        }
      }
    };

    updateConnections();

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      // Actualizar nodos
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Rebote en los bordes
        if (node.x < 0 || node.x > dimensions.width) {
          node.vx *= -0.8;
          node.x = Math.max(0, Math.min(dimensions.width, node.x));
        }
        if (node.y < 0 || node.y > dimensions.height) {
          node.vy *= -0.8;
          node.y = Math.max(0, Math.min(dimensions.height, node.y));
        }

        // Efecto de pulso
        node.pulse += node.pulseSpeed;
        const pulse = Math.sin(node.pulse) * 0.3 + 0.7;
        node.currentSize = node.size * pulse;
        node.currentOpacity = node.opacity * pulse;
      });

      // Actualizar conexiones dinámicamente
      if (Math.floor(time * 10) % 120 === 0) {
        updateConnections();
      }

      // Dibujar conexiones
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = conn.opacity * 0.4;
          const pulse = Math.sin(time * 2 + conn.from * 0.1) * 0.3 + 0.7;
          const width = conn.strength * 1.5;
          
          // Gradiente de conexión
          const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
          gradient.addColorStop(0, `hsla(${fromNode.hue}, 70%, 60%, ${opacity * pulse})`);
          gradient.addColorStop(1, `hsla(${toNode.hue}, 70%, 60%, ${opacity * pulse})`);
          
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = width;
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
        gradient.addColorStop(0.5, `hsla(${node.hue}, 70%, 60%, ${node.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${node.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Nodo principal
        ctx.fillStyle = `hsla(${node.hue}, 80%, 70%, ${node.currentOpacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = `hsla(${node.hue}, 90%, 90%, ${node.currentOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(node.x - node.currentSize * 0.3, node.y - node.currentSize * 0.3, node.currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-30 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de ondas de energía para chatbot
export const ChatbotEnergyWaves = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const waves = [];
    const numWaves = 3;

    // Crear ondas de energía
    for (let i = 0; i < numWaves; i++) {
      waves.push({
        x: (dimensions.width / numWaves) * i + dimensions.width / (numWaves * 2),
        y: dimensions.height / 2,
        amplitude: Math.random() * 40 + 20,
        frequency: Math.random() * 0.01 + 0.005,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.01 + 0.005,
        hue: Math.random() * 60 + 200,
        opacity: Math.random() * 0.2 + 0.1
      });
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      waves.forEach((wave, waveIndex) => {
        wave.phase += wave.speed;

        // Dibujar onda
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${wave.hue}, 70%, 60%, ${wave.opacity})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < dimensions.width; x += 3) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Dibujar partículas en la onda
        for (let i = 0; i < 15; i++) {
          const x = (dimensions.width / 15) * i;
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          
          ctx.fillStyle = `hsla(${wave.hue}, 80%, 70%, ${wave.opacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-25 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente principal que combina todos los efectos para el chatbot
export const ChatbotNeuralEffects = ({ 
  showNetwork = true, 
  showParticles = true, 
  showWaves = true,
  className = "" 
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {showNetwork && <ChatbotNeuralNetwork />}
      {showParticles && <ChatbotQuantumParticles count={30} />}
      {showWaves && <ChatbotEnergyWaves />}
    </div>
  );
};

export default ChatbotNeuralEffects;
