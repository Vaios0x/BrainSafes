import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Sistema de partículas avanzado para el chatbot
export const ChatbotParticleSystem = ({ 
  particleCount = 100, 
  intensity = 'medium',
  className = "" 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const intensities = {
    low: { count: 50, speed: 0.5, size: 1 },
    medium: { count: 100, speed: 1, size: 2 },
    high: { count: 200, speed: 1.5, size: 3 }
  };

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

    const config = intensities[intensity];
    const particles = [];

    // Crear partículas
    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        size: Math.random() * config.size + 1,
        opacity: Math.random() * 0.8 + 0.2,
        hue: Math.random() * 60 + 200,
        life: Math.random() * 100,
        maxLife: 100,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        trail: []
      });
    }

    particlesRef.current = particles;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      particles.forEach((particle, index) => {
        // Actualizar posición
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Actualizar vida
        particle.life -= 0.5;
        if (particle.life <= 0) {
          particle.life = particle.maxLife;
          particle.x = Math.random() * dimensions.width;
          particle.y = Math.random() * dimensions.height;
        }

        // Rebote en bordes
        if (particle.x < 0 || particle.x > dimensions.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
        }
        if (particle.y < 0 || particle.y > dimensions.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
        }

        // Efecto de pulso
        particle.pulse += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulse) * 0.3 + 0.7;
        const currentSize = particle.size * pulse;
        const currentOpacity = particle.opacity * pulse * (particle.life / particle.maxLife);

        // Agregar al trail
        particle.trail.push({ x: particle.x, y: particle.y, opacity: currentOpacity });
        if (particle.trail.length > 10) {
          particle.trail.shift();
        }

        // Dibujar trail
        particle.trail.forEach((point, i) => {
          const trailOpacity = (i / particle.trail.length) * currentOpacity * 0.3;
          ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${trailOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, currentSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 4
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Partícula principal
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 70%, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = `hsla(${particle.hue}, 90%, 90%, ${currentOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x - currentSize * 0.3, particle.y - currentSize * 0.3, currentSize * 0.3, 0, Math.PI * 2);
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
  }, [dimensions, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de partículas interactivas que responden al mouse
export const InteractiveParticles = ({ 
  particleCount = 50, 
  className = "" 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
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

    const particles = [];

    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 200,
        baseSize: Math.random() * 2 + 1,
        targetSize: Math.random() * 2 + 1
      });
    }

    particlesRef.current = particles;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 0.01;

      particles.forEach((particle) => {
        // Calcular distancia al mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100;

        // Efecto de repulsión/atracción
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          
          particle.vx += Math.cos(angle) * force * 0.01;
          particle.vy += Math.sin(angle) * force * 0.01;
          
          // Cambiar tamaño basado en proximidad
          particle.targetSize = particle.baseSize * (1 + force * 2);
        } else {
          particle.targetSize = particle.baseSize;
        }

        // Aplicar velocidad
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Amortiguación
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Rebote en bordes
        if (particle.x < 0 || particle.x > dimensions.width) {
          particle.vx *= -0.8;
          particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
        }
        if (particle.y < 0 || particle.y > dimensions.height) {
          particle.vy *= -0.8;
          particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
        }

        // Interpolar tamaño
        particle.size += (particle.targetSize - particle.size) * 0.1;

        // Efecto de pulso
        const pulse = Math.sin(time * 2 + particle.x * 0.01) * 0.3 + 0.7;
        const currentSize = particle.size * pulse;
        const currentOpacity = particle.opacity * pulse;

        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 3
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Partícula principal
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 70%, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = `hsla(${particle.hue}, 90%, 90%, ${currentOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x - currentSize * 0.3, particle.y - currentSize * 0.3, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

// Componente de explosión de partículas
export const ParticleExplosion = ({ 
  trigger = false, 
  x = 0, 
  y = 0, 
  particleCount = 30,
  className = "" 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
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
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width) return;

    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const particles = [];

    // Crear partículas de explosión
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 5 + 2;
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        opacity: 1,
        hue: Math.random() * 60 + 200,
        life: 60,
        maxLife: 60,
        gravity: 0.1
      });
    }

    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      particles.forEach((particle, index) => {
        // Actualizar posición
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;

        // Actualizar vida
        particle.life--;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          return;
        }

        const lifeRatio = particle.life / particle.maxLife;
        const currentOpacity = particle.opacity * lifeRatio;
        const currentSize = particle.size * lifeRatio;

        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 4
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 60%, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Partícula principal
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 70%, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      });

      if (particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, x, y, particleCount, dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    />
  );
};

export default {
  ChatbotParticleSystem,
  InteractiveParticles,
  ParticleExplosion
};
