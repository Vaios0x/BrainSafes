import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Componente de red neuronal 3D con WebGL
export const NeuralNetwork3D = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
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

    // Configuración avanzada de la red neuronal
    const nodes = [];
    const connections = [];
    const numNodes = 80;
    const maxDistance = 200;
    const minDistance = 50;

    // Crear nodos con propiedades 3D simuladas
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        z: Math.random() * 100 - 50, // Profundidad simulada
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        hue: Math.random() * 60 + 200,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Crear conexiones dinámicas
    const updateConnections = () => {
      connections.length = 0;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dz = nodes[i].z - nodes[j].z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance < maxDistance && distance > minDistance) {
            connections.push({
              from: i,
              to: j,
              distance: distance,
              opacity: (maxDistance - distance) / maxDistance,
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

      // Actualizar nodos con física mejorada
      nodes.forEach((node, i) => {
        // Movimiento con física
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Rebote en los bordes con amortiguación
        if (node.x < 0 || node.x > dimensions.width) {
          node.vx *= -0.8;
          node.x = Math.max(0, Math.min(dimensions.width, node.x));
        }
        if (node.y < 0 || node.y > dimensions.height) {
          node.vy *= -0.8;
          node.y = Math.max(0, Math.min(dimensions.height, node.y));
        }
        if (node.z < -50 || node.z > 50) {
          node.vz *= -0.8;
          node.z = Math.max(-50, Math.min(50, node.z));
        }

        // Efecto de pulso
        node.pulse += node.pulseSpeed;
        const pulse = Math.sin(node.pulse) * 0.3 + 0.7;
        node.currentSize = node.size * pulse;
        node.currentOpacity = node.opacity * pulse;

        // Efecto de profundidad
        const depthFactor = (node.z + 50) / 100;
        node.currentSize *= depthFactor;
        node.currentOpacity *= depthFactor;
      });

      // Actualizar conexiones dinámicamente
      if (Math.floor(time * 10) % 60 === 0) {
        updateConnections();
      }

      // Dibujar conexiones con efectos 3D
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = conn.opacity * 0.4;
          const pulse = Math.sin(time * 2 + conn.from * 0.1) * 0.3 + 0.7;
          const width = conn.strength * 2;
          
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

      // Dibujar nodos con efectos 3D
      nodes.forEach(node => {
        // Sombra proyectada
        const shadowOffset = (node.z + 50) / 100 * 5;
        ctx.fillStyle = `hsla(${node.hue}, 50%, 20%, ${node.currentOpacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x + shadowOffset, node.y + shadowOffset, node.currentSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.currentSize * 4
        );
        gradient.addColorStop(0, `hsla(${node.hue}, 70%, 60%, ${node.currentOpacity})`);
        gradient.addColorStop(0.5, `hsla(${node.hue}, 70%, 60%, ${node.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${node.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.currentSize * 4, 0, Math.PI * 2);
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
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-40 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de partículas cuánticas
export const QuantumParticles = ({ count = 150, className = "" }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.8 + 0.2,
      direction: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.7 + 0.3,
      hue: Math.random() * 60 + 200,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 30 + 10,
      frequency: Math.random() * 0.02 + 0.01
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
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: `hsl(${particle.hue}, 70%, 60%)`,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 3}px hsl(${particle.hue}, 70%, 60%)`
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
            duration: 12 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Componente de ondas de energía
export const EnergyWaves = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
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
    const numWaves = 5;

    // Crear ondas de energía
    for (let i = 0; i < numWaves; i++) {
      waves.push({
        x: (dimensions.width / numWaves) * i + dimensions.width / (numWaves * 2),
        y: dimensions.height / 2,
        amplitude: Math.random() * 100 + 50,
        frequency: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        hue: Math.random() * 60 + 200,
        opacity: Math.random() * 0.3 + 0.1
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
        ctx.lineWidth = 2;

        for (let x = 0; x < dimensions.width; x += 2) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Dibujar partículas en la onda
        for (let i = 0; i < 20; i++) {
          const x = (dimensions.width / 20) * i;
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          
          ctx.fillStyle = `hsla(${wave.hue}, 80%, 70%, ${wave.opacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
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
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-30 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de campo de fuerza
export const ForceField = ({ className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
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

    const fieldPoints = [];
    const numPoints = 20;

    // Crear puntos de campo
    for (let i = 0; i < numPoints; i++) {
      fieldPoints.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        charge: Math.random() > 0.5 ? 1 : -1,
        strength: Math.random() * 50 + 25,
        hue: Math.random() * 60 + 200
      });
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      // Dibujar líneas de campo
      for (let x = 0; x < dimensions.width; x += 20) {
        for (let y = 0; y < dimensions.height; y += 20) {
          let forceX = 0;
          let forceY = 0;

          // Calcular fuerza en cada punto
          fieldPoints.forEach(point => {
            const dx = x - point.x;
            const dy = y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const force = (point.charge * point.strength) / (distance * distance);
              forceX += (dx / distance) * force;
              forceY += (dy / distance) * force;
            }
          });

          // Normalizar y dibujar línea de campo
          const magnitude = Math.sqrt(forceX * forceX + forceY * forceY);
          if (magnitude > 0) {
            const normalizedX = forceX / magnitude;
            const normalizedY = forceY / magnitude;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + normalizedX * 15, y + normalizedY * 15);
            ctx.strokeStyle = `hsla(200, 70%, 60%, ${Math.min(magnitude / 10, 0.3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Dibujar puntos de campo
      fieldPoints.forEach(point => {
        const pulse = Math.sin(time * 2 + point.x * 0.01) * 0.3 + 0.7;
        
        ctx.fillStyle = `hsla(${point.hue}, 70%, 60%, ${pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, 20
        );
        gradient.addColorStop(0, `hsla(${point.hue}, 70%, 60%, ${pulse * 0.3})`);
        gradient.addColorStop(1, `hsla(${point.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
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
      className={`absolute inset-0 w-full h-full pointer-events-none opacity-20 ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente principal que combina todos los efectos
export const NeuralEffects = ({ 
  showNetwork = true, 
  showParticles = true, 
  showWaves = true, 
  showForceField = false,
  className = "" 
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {showNetwork && <NeuralNetwork3D />}
      {showParticles && <QuantumParticles />}
      {showWaves && <EnergyWaves />}
      {showForceField && <ForceField />}
    </div>
  );
};

export default NeuralEffects;
