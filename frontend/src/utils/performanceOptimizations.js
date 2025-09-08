// Utilidades para optimización de rendimiento

// Debounce function para optimizar eventos
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function para limitar la frecuencia de ejecución
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer para lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Preload de imágenes críticas
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Preload de múltiples imágenes
export const preloadImages = (srcs) => {
  return Promise.all(srcs.map(preloadImage));
};

// Optimización de animaciones con requestAnimationFrame
export const optimizedAnimation = (callback) => {
  let animationId;
  
  const animate = (timestamp) => {
    callback(timestamp);
    animationId = requestAnimationFrame(animate);
  };
  
  const start = () => {
    animationId = requestAnimationFrame(animate);
  };
  
  const stop = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };
  
  return { start, stop };
};

// Memoización para cálculos costosos
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Virtual scrolling para listas grandes
export const createVirtualScroller = (container, itemHeight, items, renderItem) => {
  let scrollTop = 0;
  let visibleStart = 0;
  let visibleEnd = 0;
  
  const updateVisibleRange = () => {
    const containerHeight = container.clientHeight;
    visibleStart = Math.floor(scrollTop / itemHeight);
    visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
  };
  
  const render = () => {
    updateVisibleRange();
    const visibleItems = items.slice(visibleStart, visibleEnd);
    const offsetY = visibleStart * itemHeight;
    
    return {
      visibleItems,
      offsetY,
      totalHeight: items.length * itemHeight
    };
  };
  
  const handleScroll = (event) => {
    scrollTop = event.target.scrollTop;
    render();
  };
  
  container.addEventListener('scroll', throttle(handleScroll, 16));
  
  return { render, destroy: () => container.removeEventListener('scroll', handleScroll) };
};

// Optimización de canvas
export const optimizeCanvas = (canvas, context) => {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  context.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  
  return { dpr, width: rect.width, height: rect.height };
};

// Pool de objetos para reutilización
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = new Set();
    
    // Pre-crear objetos
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  get() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    }
    this.active.add(obj);
    return obj;
  }
  
  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  releaseAll() {
    this.active.forEach(obj => {
      this.resetFn(obj);
      this.pool.push(obj);
    });
    this.active.clear();
  }
}

// Gestión de memoria para efectos visuales
export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.intervalId = null;
  }
  
  addCleanupTask(task) {
    this.cleanupTasks.add(task);
  }
  
  removeCleanupTask(task) {
    this.cleanupTasks.delete(task);
  }
  
  startCleanup(interval = 30000) {
    this.intervalId = setInterval(() => {
      this.cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Cleanup task failed:', error);
        }
      });
    }, interval);
  }
  
  stopCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  cleanup() {
    this.cleanupTasks.forEach(task => task());
    this.cleanupTasks.clear();
  }
}

// Detección de rendimiento
export const performanceMonitor = {
  metrics: new Map(),
  
  start(name) {
    this.metrics.set(name, performance.now());
  },
  
  end(name) {
    const startTime = this.metrics.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.delete(name);
      return duration;
    }
    return null;
  },
  
  measure(name, fn) {
    this.start(name);
    const result = fn();
    const duration = this.end(name);
    return { result, duration };
  },
  
  async measureAsync(name, fn) {
    this.start(name);
    const result = await fn();
    const duration = this.end(name);
    return { result, duration };
  }
};

// Optimización de eventos de mouse
export const mouseOptimizer = {
  lastMoveTime: 0,
  moveThrottle: 16, // ~60fps
  
  optimizedMove(callback) {
    return throttle((event) => {
      const now = performance.now();
      if (now - this.lastMoveTime >= this.moveThrottle) {
        this.lastMoveTime = now;
        callback(event);
      }
    }, this.moveThrottle);
  }
};

// Gestión de recursos WebGL
export class WebGLResourceManager {
  constructor(gl) {
    this.gl = gl;
    this.programs = new Map();
    this.buffers = new Map();
    this.textures = new Map();
  }
  
  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking failed:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    
    this.programs.set(program, { vertexShader, fragmentShader });
    return program;
  }
  
  createBuffer(data, usage = this.gl.STATIC_DRAW) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage);
    this.buffers.set(buffer, { data, usage });
    return buffer;
  }
  
  createTexture(image) {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.textures.set(texture, image);
    return texture;
  }
  
  cleanup() {
    this.programs.forEach((_, program) => this.gl.deleteProgram(program));
    this.buffers.forEach((_, buffer) => this.gl.deleteBuffer(buffer));
    this.textures.forEach((_, texture) => this.gl.deleteTexture(texture));
    
    this.programs.clear();
    this.buffers.clear();
    this.textures.clear();
  }
}

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  preloadImage,
  preloadImages,
  optimizedAnimation,
  memoize,
  createVirtualScroller,
  optimizeCanvas,
  ObjectPool,
  MemoryManager,
  performanceMonitor,
  mouseOptimizer,
  WebGLResourceManager
};
