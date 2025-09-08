import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Componente de capas parallax para el footer
export const FooterParallaxLayers = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0.8]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* Capa 1 - Fondo base */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-800 to-transparent"
        style={{ y: y1, opacity }}
      />
      
      {/* Capa 2 - Gradiente de color */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-brain-600/10"
        style={{ y: y2, opacity }}
      />
      
      {/* Capa 3 - Efectos de luz */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y3, opacity }}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brain-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
};

// Componente de elementos flotantes con parallax
export const FloatingElements = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const elements = [
    { id: 1, x: '10%', y: '20%', size: 'w-4 h-4', color: 'bg-primary-400/20', delay: 0 },
    { id: 2, x: '80%', y: '30%', size: 'w-6 h-6', color: 'bg-brain-400/20', delay: 0.2 },
    { id: 3, x: '20%', y: '70%', size: 'w-3 h-3', color: 'bg-purple-400/20', delay: 0.4 },
    { id: 4, x: '70%', y: '80%', size: 'w-5 h-5', color: 'bg-primary-400/20', delay: 0.6 },
    { id: 5, x: '50%', y: '10%', size: 'w-2 h-2', color: 'bg-brain-400/20', delay: 0.8 },
    { id: 6, x: '90%', y: '60%', size: 'w-4 h-4', color: 'bg-purple-400/20', delay: 1.0 }
  ];

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {elements.map((element) => {
        const y = useTransform(scrollYProgress, [0, 1], [0, -100 - (element.id * 20)]);
        const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.6, 0.3]);
        const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1.2]);

        return (
          <motion.div
            key={element.id}
            className={`absolute ${element.size} ${element.color} rounded-full blur-sm`}
            style={{
              left: element.x,
              top: element.y,
              y,
              opacity,
              scale
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3 + element.delay,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.delay
            }}
          />
        );
      })}
    </div>
  );
};

// Componente de ondas de energía con parallax
export const ParallaxEnergyWaves = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.4, 0.6, 0.3]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {/* Onda 1 */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y1, opacity }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,200 Q300,100 600,200 T1200,200 L1200,400 L0,400 Z"
            fill="url(#gradient1)"
            opacity="0.1"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Onda 2 */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y2, opacity: useTransform(opacity, [0, 1], [0, 0.3]) }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,250 Q400,150 800,250 T1200,250 L1200,400 L0,400 Z"
            fill="url(#gradient2)"
            opacity="0.15"
          />
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Onda 3 */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y3, opacity: useTransform(opacity, [0, 1], [0, 0.2]) }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,300 Q500,200 1000,300 T1200,300 L1200,400 L0,400 Z"
            fill="url(#gradient3)"
            opacity="0.1"
          />
          <defs>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
};

// Componente principal de parallax para el footer
export const FooterParallax = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <FooterParallaxLayers />
      <FloatingElements />
      <ParallaxEnergyWaves />
    </div>
  );
};

export default FooterParallax;
