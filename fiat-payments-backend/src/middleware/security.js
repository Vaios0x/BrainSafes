const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const winston = require('winston');
const { ethers } = require('ethers');

class SecurityManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/security.log' })
      ],
    });

    // Almacenamiento de intentos fallidos
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.suspiciousActivities = new Map();
    
    // Configuración de seguridad
    this.securityConfig = {
      maxFailedAttempts: 5,
      blockDuration: 15 * 60 * 1000, // 15 minutos
      suspiciousThreshold: 10,
      auditEnabled: true
    };

    this.logger.info('Security Manager inicializado');
  }

  /**
   * Configurar middleware de seguridad básica
   */
  getBasicSecurityMiddleware() {
    return [
      // Helmet para headers de seguridad
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            connectSrc: ["'self'", "https://arb1.arbitrum.io", "https://ipfs.io"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
          }
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
      }),

      // CORS configurado
      cors({
        origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://brainsafes.com'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Webhook-Signature']
      }),

      // Rate limiting global
      this.getGlobalRateLimiter(),

      // Speed limiting
      this.getSpeedLimiter(),

      // Middleware de auditoría
      this.getAuditMiddleware(),

      // Middleware de detección de ataques
      this.getAttackDetectionMiddleware()
    ];
  }

  /**
   * Rate limiter global
   */
  getGlobalRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: {
        error: 'Demasiadas requests desde esta IP',
        retryAfter: '15 minutos'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Usar IP real si está detrás de proxy
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
      },
      skip: (req) => {
        // Saltar rate limiting para health checks
        return req.path === '/health' || req.path === '/metrics';
      },
      handler: (req, res) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          error: 'Demasiadas requests desde esta IP',
          retryAfter: '15 minutos'
        });
      }
    });
  }

  /**
   * Rate limiter específico para autenticación
   */
  getAuthRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 intentos de login
      message: {
        error: 'Demasiados intentos de autenticación',
        retryAfter: '15 minutos'
      },
      keyGenerator: (req) => {
        return req.body.email || req.body.walletAddress || req.ip;
      },
      handler: (req, res) => {
        this.logSecurityEvent('auth_rate_limit_exceeded', {
          ip: req.ip,
          email: req.body.email,
          walletAddress: req.body.walletAddress
        });
        
        res.status(429).json({
          error: 'Demasiados intentos de autenticación',
          retryAfter: '15 minutos'
        });
      }
    });
  }

  /**
   * Rate limiter para APIs de contratos
   */
  getContractAPIRateLimiter() {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 30, // máximo 30 requests por minuto
      message: {
        error: 'Demasiadas requests a la API de contratos',
        retryAfter: '1 minuto'
      },
      keyGenerator: (req) => {
        return req.headers.authorization || req.ip;
      },
      handler: (req, res) => {
        this.logSecurityEvent('contract_api_rate_limit_exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        
        res.status(429).json({
          error: 'Demasiadas requests a la API de contratos',
          retryAfter: '1 minuto'
        });
      }
    });
  }

  /**
   * Speed limiter para ralentizar requests
   */
  getSpeedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutos
      delayAfter: 50, // ralentizar después de 50 requests
      delayMs: 500, // ralentizar 500ms por request adicional
      maxDelayMs: 20000, // máximo 20 segundos de delay
      keyGenerator: (req) => {
        return req.headers.authorization || req.ip;
      }
    });
  }

  /**
   * Middleware de auditoría
   */
  getAuditMiddleware() {
    return (req, res, next) => {
      if (!this.securityConfig.auditEnabled) {
        return next();
      }

      const startTime = Date.now();
      const requestId = crypto.randomUUID();

      // Log de request
      this.logSecurityEvent('request_started', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body)
      });

      // Interceptar response
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log de response
        this.logSecurityEvent('request_completed', {
          requestId,
          statusCode: res.statusCode,
          responseTime,
          responseSize: data ? data.length : 0
        });

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Middleware de detección de ataques
   */
  getAttackDetectionMiddleware() {
    return (req, res, next) => {
      const ip = req.ip;
      const userAgent = req.get('User-Agent') || '';
      const path = req.path;

      // Detectar patrones sospechosos
      const suspiciousPatterns = [
        /\.\.\//, // Directory traversal
        /<script/i, // XSS básico
        /union\s+select/i, // SQL injection básico
        /eval\s*\(/i, // JavaScript injection
        /document\.cookie/i, // Cookie stealing
        /on\w+\s*=/i, // Event handlers
        /javascript:/i, // JavaScript protocol
        /vbscript:/i, // VBScript protocol
        /data:text\/html/i, // Data URI attacks
        /<iframe/i, // Iframe injection
      ];

      // Verificar patrones sospechosos en URL y headers
      const url = req.url;
      const headers = JSON.stringify(req.headers).toLowerCase();
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url) || pattern.test(headers)) {
          this.logSecurityEvent('suspicious_pattern_detected', {
            ip,
            pattern: pattern.source,
            url,
            userAgent
          });
          
          this.incrementSuspiciousActivity(ip);
          break;
        }
      }

      // Detectar User-Agents sospechosos
      const suspiciousUserAgents = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /perl/i,
        /java/i,
        /go-http-client/i
      ];

      for (const pattern of suspiciousUserAgents) {
        if (pattern.test(userAgent)) {
          this.logSecurityEvent('suspicious_user_agent', {
            ip,
            userAgent,
            path
          });
          break;
        }
      }

      // Verificar si la IP está bloqueada
      if (this.blockedIPs.has(ip)) {
        this.logSecurityEvent('blocked_ip_access_attempt', {
          ip,
          path,
          userAgent
        });
        
        return res.status(403).json({
          error: 'Acceso bloqueado por seguridad',
          reason: 'IP bloqueada temporalmente'
        });
      }

      next();
    };
  }

  /**
   * Middleware de validación de wallet
   */
  getWalletValidationMiddleware() {
    return (req, res, next) => {
      const walletAddress = req.body.walletAddress || req.query.walletAddress;

      if (walletAddress && !ethers.isAddress(walletAddress)) {
        this.logSecurityEvent('invalid_wallet_address', {
          ip: req.ip,
          walletAddress,
          path: req.path
        });

        return res.status(400).json({
          error: 'Dirección de wallet inválida'
        });
      }

      next();
    };
  }

  /**
   * Middleware de validación de firma
   */
  getSignatureValidationMiddleware() {
    return (req, res, next) => {
      const signature = req.headers['x-webhook-signature'];
      const payload = JSON.stringify(req.body);
      const secret = process.env.WEBHOOK_SECRET;

      if (signature && secret) {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');

        if (signature !== expectedSignature) {
          this.logSecurityEvent('invalid_signature', {
            ip: req.ip,
            path: req.path,
            providedSignature: signature,
            expectedSignature: expectedSignature
          });

          return res.status(401).json({
            error: 'Firma inválida'
          });
        }
      }

      next();
    };
  }

  /**
   * Middleware de protección contra reentrancy
   */
  getReentrancyProtectionMiddleware() {
    const processingRequests = new Set();

    return (req, res, next) => {
      const requestKey = `${req.method}:${req.path}:${req.ip}`;

      if (processingRequests.has(requestKey)) {
        this.logSecurityEvent('reentrancy_attempt', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(429).json({
          error: 'Request en procesamiento',
          retryAfter: '5 segundos'
        });
      }

      processingRequests.add(requestKey);

      res.on('finish', () => {
        processingRequests.delete(requestKey);
      });

      next();
    };
  }

  /**
   * Incrementar actividad sospechosa
   * @param {string} ip - IP del usuario
   */
  incrementSuspiciousActivity(ip) {
    const current = this.suspiciousActivities.get(ip) || 0;
    const newCount = current + 1;
    
    this.suspiciousActivities.set(ip, newCount);

    if (newCount >= this.securityConfig.suspiciousThreshold) {
      this.blockIP(ip);
    }

    this.logSecurityEvent('suspicious_activity_incremented', {
      ip,
      count: newCount,
      threshold: this.securityConfig.suspiciousThreshold
    });
  }

  /**
   * Bloquear IP
   * @param {string} ip - IP a bloquear
   */
  blockIP(ip) {
    this.blockedIPs.add(ip);
    
    // Remover bloqueo después del tiempo configurado
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.suspiciousActivities.delete(ip);
      
      this.logSecurityEvent('ip_unblocked', { ip });
    }, this.securityConfig.blockDuration);

    this.logSecurityEvent('ip_blocked', { 
      ip, 
      duration: this.securityConfig.blockDuration 
    });
  }

  /**
   * Registrar evento de seguridad
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Datos del evento
   */
  logSecurityEvent(eventType, data) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: {
        ...data,
        severity: this.getEventSeverity(eventType)
      }
    };

    this.logger.warn('Security Event', event);

    // Aquí podrías enviar alertas o notificaciones
    // Por ejemplo, usando el NotificationManager
  }

  /**
   * Obtener severidad del evento
   * @param {string} eventType - Tipo de evento
   * @returns {string} Severidad
   */
  getEventSeverity(eventType) {
    const highSeverity = [
      'suspicious_pattern_detected',
      'invalid_signature',
      'reentrancy_attempt',
      'ip_blocked'
    ];

    const mediumSeverity = [
      'rate_limit_exceeded',
      'auth_rate_limit_exceeded',
      'suspicious_user_agent',
      'invalid_wallet_address'
    ];

    if (highSeverity.includes(eventType)) return 'high';
    if (mediumSeverity.includes(eventType)) return 'medium';
    return 'low';
  }

  /**
   * Sanitizar headers para logging
   * @param {Object} headers - Headers a sanitizar
   * @returns {Object} Headers sanitizados
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizar body para logging
   * @param {Object} body - Body a sanitizar
   * @returns {Object} Body sanitizado
   */
  sanitizeBody(body) {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'privateKey'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Obtener estadísticas de seguridad
   * @returns {Object} Estadísticas
   */
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivities.size,
      failedAttempts: this.failedAttempts.size,
      securityConfig: this.securityConfig
    };
  }

  /**
   * Limpiar datos antiguos
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 horas

    // Limpiar intentos fallidos antiguos
    for (const [key, data] of this.failedAttempts) {
      if (data.timestamp < cutoff) {
        this.failedAttempts.delete(key);
      }
    }

    // Limpiar actividades sospechosas antiguas
    for (const [key, data] of this.suspiciousActivities) {
      if (data.timestamp < cutoff) {
        this.suspiciousActivities.delete(key);
      }
    }

    this.logger.info('Security cleanup completed');
  }
}

// Instancia singleton
const securityManager = new SecurityManager();

// Configurar limpieza automática cada hora
setInterval(() => {
  securityManager.cleanup();
}, 60 * 60 * 1000);

module.exports = securityManager;
