import React, { useRef, useEffect } from 'react';

// Hook para efectos de sonido del chatbot
export const useChatbotSounds = (enabled = true) => {
  const audioContextRef = useRef(null);
  const soundsRef = useRef({});

  useEffect(() => {
    if (!enabled) return;

    // Crear contexto de audio
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // Crear sonidos sintéticos
    const createTone = (frequency, duration, type = 'sine') => {
      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    };

    // Definir sonidos
    soundsRef.current = {
      messageSent: () => createTone(800, 0.1, 'sine'),
      messageReceived: () => createTone(600, 0.15, 'triangle'),
      typing: () => createTone(400, 0.05, 'square'),
      notification: () => {
        createTone(1000, 0.1, 'sine');
        setTimeout(() => createTone(1200, 0.1, 'sine'), 100);
      },
      error: () => createTone(200, 0.3, 'sawtooth'),
      success: () => {
        createTone(523, 0.1, 'sine'); // C
        setTimeout(() => createTone(659, 0.1, 'sine'), 100); // E
        setTimeout(() => createTone(784, 0.2, 'sine'), 200); // G
      }
    };

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled]);

  return soundsRef.current;
};

// Hook para efectos de vibración
export const useChatbotVibration = (enabled = true) => {
  const vibrate = (pattern) => {
    if (!enabled || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  };

  return {
    messageSent: () => vibrate([50]),
    messageReceived: () => vibrate([100, 50, 100]),
    typing: () => vibrate([30]),
    notification: () => vibrate([200, 100, 200]),
    error: () => vibrate([100, 50, 100, 50, 100]),
    success: () => vibrate([50, 50, 50])
  };
};

// Componente para efectos visuales de sonido
export const SoundVisualizer = ({ isActive = false, className = "" }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bars = 20;
    const barWidth = canvas.width / bars;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive) {
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * canvas.height * 0.8;
          const hue = (i / bars) * 60 + 200;
          
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className={`w-full h-10 ${className}`}
      style={{ opacity: isActive ? 1 : 0.3 }}
    />
  );
};

// Componente de configuración de efectos
export const ChatbotEffectsSettings = ({ 
  onSoundsChange, 
  onVibrationChange, 
  soundsEnabled = true, 
  vibrationEnabled = true 
}) => {
  return (
    <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
      <h3 className="text-white font-semibold mb-3">Configuración de Efectos</h3>
      
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Efectos de Sonido</span>
          <input
            type="checkbox"
            checked={soundsEnabled}
            onChange={(e) => onSoundsChange?.(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
          />
        </label>
        
        <label className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Vibración</span>
          <input
            type="checkbox"
            checked={vibrationEnabled}
            onChange={(e) => onVibrationChange?.(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
          />
        </label>
      </div>
    </div>
  );
};

export default {
  useChatbotSounds,
  useChatbotVibration,
  SoundVisualizer,
  ChatbotEffectsSettings
};
