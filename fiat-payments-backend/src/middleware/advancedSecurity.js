const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const winston = require('winston');
const { ethers } = require('ethers');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

/**
 * @title Advanced Security Manager
 * @dev Sistema avanzado de seguridad con WAF, ML, detección de bots y protección DDoS
 * @custom:security-contact security@brainsafes.com
 */
class AdvancedSecurityManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/advanced-security.log' })
      ],
    });

    // Almacenamiento de datos de seguridad
    this.threatIntelligence = new Map();
    this.userBehaviorProfiles = new Map();
    this.ipReputation = new Map();
    this.botSignatures = new Map();
    this.ddosProtection = new Map();
    this.rateLimiters = new Map();
    
    // Configuración de seguridad avanzada
    this.securityConfig = {
      // Rate limiting
      maxRequestsPerMinute: 100,
      maxRequestsPerHour: 1000,
      maxRequestsPerDay: 10000,
      
      // Bot detection
      botDetectionEnabled: true,
      suspiciousUserAgents: [
        /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
        /python/i, /perl/i, /java/i, /go-http-client/i, /postman/i
      ],
      
      // DDoS protection
      ddosProtectionEnabled: true,
      ddosThreshold: 1000, // requests per minute
      ddosWindow: 60000, // 1 minute
      
      // Geographic restrictions
      allowedCountries: ['US', 'CA', 'MX', 'ES', 'FR', 'DE', 'GB', 'IT'],
      blockedCountries: ['CN', 'RU', 'KP'],
      
      // Advanced threats
      sqlInjectionPatterns: [
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
        /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
        /(\b(and|or)\b\s+\d+\s*=\s*['"]\w+['"])/i
      ],
      
      xssPatterns: [
        /<script[^>]*>[\s\S]*?<\/script>/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
        /<link[^>]*>/i,
        /<meta[^>]*>/i
      ],
      
      pathTraversalPatterns: [
        /\.\.\//,
        /\.\.\\/,
        /%2e%2e%2f/i,
        /%2e%2e%5c/i,
        /\.\.%2f/i,
        /\.\.%5c/i
      ],
      
      // Machine learning thresholds
      mlThresholds: {
        suspiciousScore: 0.7,
        maliciousScore: 0.9,
        botScore: 0.8
      }
    };

    // Inicializar
    this.initializeSecuritySystems();
    this.loadThreatIntelligence();
    this.startSecurityMonitoring();
  }

  /**
   * Inicializar sistemas de seguridad
   */
  initializeSecuritySystems() {
    // Inicializar rate limiters por tipo
    this.initializeRateLimiters();
    
    // Inicializar detección de bots
    this.initializeBotDetection();
    
    // Inicializar protección DDoS
    this.initializeDDoSProtection();
    
    // Inicializar WAF
    this.initializeWAF();
    
    this.logger.info('Sistemas de seguridad avanzados inicializados');
  }

  /**
   * Inicializar rate limiters
   */
  initializeRateLimiters() {
    // Rate limiter global
    this.rateLimiters.set('global', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: this.securityConfig.maxRequestsPerMinute,
      message: {
        error: 'Demasiadas requests desde esta IP',
        retryAfter: '15 minutos'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => this.getClientIdentifier(req),
      skip: (req) => this.shouldSkipRateLimit(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res, 'global')
    }));

    // Rate limiter para autenticación
    this.rateLimiters.set('auth', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 intentos de login
      message: {
        error: 'Demasiados intentos de autenticación',
        retryAfter: '15 minutos'
      },
      keyGenerator: (req) => req.body.email || req.body.walletAddress || this.getClientIdentifier(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res, 'auth')
    }));

    // Rate limiter para APIs de contratos
    this.rateLimiters.set('contracts', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 30, // máximo 30 requests por minuto
      message: {
        error: 'Demasiadas requests a la API de contratos',
        retryAfter: '1 minuto'
      },
      keyGenerator: (req) => req.headers.authorization || this.getClientIdentifier(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res, 'contracts')
    }));

    // Rate limiter para IPFS
    this.rateLimiters.set('ipfs', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 10, // máximo 10 uploads por minuto
      message: {
        error: 'Demasiadas subidas a IPFS',
        retryAfter: '1 minuto'
      },
      keyGenerator: (req) => this.getClientIdentifier(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res, 'ipfs')
    }));

    // Rate limiter para notificaciones
    this.rateLimiters.set('notifications', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 20, // máximo 20 notificaciones por minuto
      message: {
        error: 'Demasiadas notificaciones',
        retryAfter: '1 minuto'
      },
      keyGenerator: (req) => this.getClientIdentifier(req),
      handler: (req, res) => this.handleRateLimitExceeded(req, res, 'notifications')
    }));
  }

  /**
   * Inicializar detección de bots
   */
  initializeBotDetection() {
    // Firmas de bots conocidos
    this.botSignatures.set('googlebot', {
      userAgent: /Googlebot/i,
      behavior: 'crawler',
      risk: 'low'
    });
    
    this.botSignatures.set('bingbot', {
      userAgent: /bingbot/i,
      behavior: 'crawler',
      risk: 'low'
    });
    
    this.botSignatures.set('scraper', {
      userAgent: /scraper|spider|crawler/i,
      behavior: 'scraper',
      risk: 'medium'
    });
    
    this.botSignatures.set('malicious', {
      userAgent: /curl|wget|python|perl|java|go-http-client/i,
      behavior: 'malicious',
      risk: 'high'
    });
  }

  /**
   * Inicializar protección DDoS
   */
  initializeDDoSProtection() {
    // Configurar protección DDoS por IP
    this.ddosProtection.set('ip_threshold', this.securityConfig.ddosThreshold);
    this.ddosProtection.set('window_ms', this.securityConfig.ddosWindow);
    this.ddosProtection.set('blocked_ips', new Set());
  }

  /**
   * Inicializar WAF
   */
  initializeWAF() {
    // Reglas WAF
    this.wafRules = {
      sqlInjection: {
        patterns: this.securityConfig.sqlInjectionPatterns,
        action: 'block',
        severity: 'high'
      },
      xss: {
        patterns: this.securityConfig.xssPatterns,
        action: 'block',
        severity: 'high'
      },
      pathTraversal: {
        patterns: this.securityConfig.pathTraversalPatterns,
        action: 'block',
        severity: 'high'
      },
      commandInjection: {
        patterns: [
          /[;&|`$(){}[\]]/,
          /(exec|system|eval|shell_exec|passthru)/i
        ],
        action: 'block',
        severity: 'critical'
      }
    };
  }

  /**
   * Cargar inteligencia de amenazas
   */
  loadThreatIntelligence() {
    // Cargar IPs maliciosas conocidas
    this.threatIntelligence.set('malicious_ips', new Set([
      // IPs de ejemplo - en producción cargarías desde una base de datos
      '192.168.1.100',
      '10.0.0.50'
    ]));
    
    // Cargar patrones de comportamiento malicioso
    this.threatIntelligence.set('malicious_patterns', [
      {
        name: 'rapid_fire_requests',
        pattern: (events) => events.length > 100 && events.every(e => e.timestamp - events[0].timestamp < 60000),
        risk: 'high'
      },
      {
        name: 'scanning_behavior',
        pattern: (events) => {
          const paths = events.map(e => e.path);
          const uniquePaths = new Set(paths);
          return uniquePaths.size > 50 && events.length > 200;
        },
        risk: 'medium'
      }
    ]);
  }

  /**
   * Iniciar monitoreo de seguridad
   */
  startSecurityMonitoring() {
    // Monitorear comportamiento de usuarios cada 5 minutos
    setInterval(() => {
      this.analyzeUserBehavior();
    }, 5 * 60 * 1000);

    // Actualizar reputación de IPs cada hora
    setInterval(() => {
      this.updateIPReputation();
    }, 60 * 60 * 1000);

    // Limpiar datos antiguos cada día
    setInterval(() => {
      this.cleanupSecurityData();
    }, 24 * 60 * 60 * 1000);

    this.logger.info('Monitoreo de seguridad iniciado');
  }

  /**
   * Obtener middleware de seguridad avanzado
   */
  getAdvancedSecurityMiddleware() {
    return [
      // Helmet con configuración avanzada
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "https://arb1.arbitrum.io", "https://ipfs.io", "wss:", "ws:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
          }
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
        frameguard: { action: 'deny' }
      }),

      // CORS configurado
      cors({
        origin: this.getCORSOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Webhook-Signature', 'X-API-Key'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
      }),

      // Middleware de análisis de seguridad
      this.getSecurityAnalysisMiddleware(),

      // Middleware de detección de bots
      this.getBotDetectionMiddleware(),

      // Middleware de protección DDoS
      this.getDDoSProtectionMiddleware(),

      // Middleware WAF
      this.getWAFMiddleware(),

      // Middleware de auditoría avanzada
      this.getAdvancedAuditMiddleware()
    ];
  }

  /**
   * Obtener orígenes CORS permitidos
   */
  getCORSOrigins() {
    const origins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000', 'https://brainsafes.com'];
    
    return (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    };
  }

  /**
   * Middleware de análisis de seguridad
   */
  getSecurityAnalysisMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();
      const clientInfo = this.analyzeClient(req);

      // Registrar información del cliente
      req.securityInfo = {
        requestId,
        clientInfo,
        startTime,
        riskScore: 0
      };

      // Analizar riesgo del cliente
      req.securityInfo.riskScore = this.calculateRiskScore(clientInfo);

      // Verificar si el cliente está en lista negra
      if (this.isClientBlacklisted(clientInfo)) {
        this.logSecurityEvent('blacklisted_client_access', {
          requestId,
          clientInfo,
          reason: 'Client in blacklist'
        });
        
        return res.status(403).json({
          error: 'Acceso denegado',
          reason: 'Cliente en lista negra'
        });
      }

      // Verificar restricciones geográficas
      if (this.isGeographicallyBlocked(clientInfo)) {
        this.logSecurityEvent('geographic_block', {
          requestId,
          clientInfo,
          country: clientInfo.country
        });
        
        return res.status(403).json({
          error: 'Acceso denegado',
          reason: 'Región no permitida'
        });
      }

      // Interceptar response para análisis
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Registrar evento de seguridad
        this.logSecurityEvent('request_completed', {
          requestId,
          clientInfo,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          riskScore: req.securityInfo.riskScore
        });

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Middleware de detección de bots
   */
  getBotDetectionMiddleware() {
    return (req, res, next) => {
      if (!this.securityConfig.botDetectionEnabled) {
        return next();
      }

      const userAgent = req.get('User-Agent') || '';
      const clientInfo = req.securityInfo?.clientInfo;

      // Detectar bots conocidos
      const botDetection = this.detectBot(userAgent, clientInfo);
      
      if (botDetection.isBot) {
        req.securityInfo.botDetection = botDetection;
        
        // Incrementar score de riesgo
        req.securityInfo.riskScore += botDetection.risk === 'high' ? 0.5 : 0.2;
        
        this.logSecurityEvent('bot_detected', {
          requestId: req.securityInfo.requestId,
          botType: botDetection.type,
          risk: botDetection.risk,
          userAgent
        });

        // Bloquear bots maliciosos
        if (botDetection.risk === 'high') {
          return res.status(403).json({
            error: 'Acceso denegado',
            reason: 'Bot malicioso detectado'
          });
        }
      }

      next();
    };
  }

  /**
   * Middleware de protección DDoS
   */
  getDDoSProtectionMiddleware() {
    return (req, res, next) => {
      if (!this.securityConfig.ddosProtectionEnabled) {
        return next();
      }

      const clientId = this.getClientIdentifier(req);
      const now = Date.now();
      
      // Obtener eventos recientes del cliente
      const clientEvents = this.getClientEvents(clientId);
      const recentEvents = clientEvents.filter(e => now - e.timestamp < this.securityConfig.ddosWindow);
      
      // Verificar si excede el umbral DDoS
      if (recentEvents.length > this.securityConfig.ddosThreshold) {
        this.logSecurityEvent('ddos_attack_detected', {
          clientId,
          eventCount: recentEvents.length,
          threshold: this.securityConfig.ddosThreshold,
          window: this.securityConfig.ddosWindow
        });
        
        // Bloquear IP temporalmente
        this.blockIP(clientId, 30 * 60 * 1000); // 30 minutos
        
        return res.status(429).json({
          error: 'Demasiadas requests',
          reason: 'Posible ataque DDoS detectado',
          retryAfter: '30 minutos'
        });
      }
      
      // Registrar evento
      this.recordClientEvent(clientId, {
        timestamp: now,
        method: req.method,
        path: req.path,
        ip: req.ip
      });

      next();
    };
  }

  /**
   * Middleware WAF
   */
  getWAFMiddleware() {
    return (req, res, next) => {
      const url = req.url;
      const body = JSON.stringify(req.body || {});
      const headers = JSON.stringify(req.headers);
      const query = JSON.stringify(req.query);
      
      // Verificar todas las reglas WAF
      for (const [ruleName, rule] of Object.entries(this.wafRules)) {
        for (const pattern of rule.patterns) {
          if (pattern.test(url) || pattern.test(body) || pattern.test(headers) || pattern.test(query)) {
            this.logSecurityEvent('waf_rule_triggered', {
              requestId: req.securityInfo?.requestId,
              rule: ruleName,
              pattern: pattern.source,
              severity: rule.severity,
              action: rule.action,
              url,
              clientInfo: req.securityInfo?.clientInfo
            });
            
            if (rule.action === 'block') {
              return res.status(403).json({
                error: 'Acceso denegado',
                reason: `Violación de seguridad: ${ruleName}`,
                severity: rule.severity
              });
            }
          }
        }
      }

      next();
    };
  }

  /**
   * Middleware de auditoría avanzada
   */
  getAdvancedAuditMiddleware() {
    return (req, res, next) => {
      const requestId = req.securityInfo?.requestId;
      const clientInfo = req.securityInfo?.clientInfo;
      
      // Registrar evento de auditoría
      this.logSecurityEvent('request_audit', {
        requestId,
        clientInfo,
        method: req.method,
        path: req.path,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        query: req.query,
        timestamp: new Date().toISOString(),
        riskScore: req.securityInfo?.riskScore || 0
      });

      next();
    };
  }

  /**
   * Obtener rate limiter específico
   */
  getRateLimiter(type) {
    return this.rateLimiters.get(type) || this.rateLimiters.get('global');
  }

  /**
   * Analizar cliente
   */
  analyzeClient(req) {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    const geo = geoip.lookup(ip);
    
    // Parsear User-Agent
    const uaParser = new UAParser(userAgent);
    const uaResult = uaParser.getResult();
    
    return {
      ip,
      userAgent,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
      timezone: geo?.timezone,
      browser: uaResult.browser,
      os: uaResult.os,
      device: uaResult.device,
      isMobile: uaResult.device.type === 'mobile',
      isTablet: uaResult.device.type === 'tablet',
      isDesktop: !uaResult.device.type || uaResult.device.type === 'desktop'
    };
  }

  /**
   * Calcular score de riesgo
   */
  calculateRiskScore(clientInfo) {
    let score = 0;
    
    // País de riesgo
    if (this.securityConfig.blockedCountries.includes(clientInfo.country)) {
      score += 0.8;
    }
    
    // User-Agent sospechoso
    for (const pattern of this.securityConfig.suspiciousUserAgents) {
      if (pattern.test(clientInfo.userAgent)) {
        score += 0.3;
        break;
      }
    }
    
    // IP en lista negra
    if (this.threatIntelligence.get('malicious_ips').has(clientInfo.ip)) {
      score += 0.9;
    }
    
    // Reputación de IP
    const ipReputation = this.ipReputation.get(clientInfo.ip);
    if (ipReputation && ipReputation.score < 0.3) {
      score += 0.5;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Detectar bot
   */
  detectBot(userAgent, clientInfo) {
    for (const [botType, signature] of this.botSignatures) {
      if (signature.userAgent.test(userAgent)) {
        return {
          isBot: true,
          type: botType,
          behavior: signature.behavior,
          risk: signature.risk
        };
      }
    }
    
    // Detección heurística
    const botIndicators = [
      !clientInfo.browser.name, // Sin navegador
      clientInfo.userAgent.length < 20, // User-Agent muy corto
      /^[A-Za-z0-9]+$/.test(clientInfo.userAgent), // Solo caracteres alfanuméricos
      clientInfo.userAgent.includes('bot') || clientInfo.userAgent.includes('crawler')
    ];
    
    const botScore = botIndicators.filter(Boolean).length / botIndicators.length;
    
    if (botScore > 0.5) {
      return {
        isBot: true,
        type: 'unknown',
        behavior: 'suspicious',
        risk: botScore > 0.7 ? 'high' : 'medium',
        confidence: botScore
      };
    }
    
    return { isBot: false };
  }

  /**
   * Verificar si cliente está en lista negra
   */
  isClientBlacklisted(clientInfo) {
    return this.threatIntelligence.get('malicious_ips').has(clientInfo.ip);
  }

  /**
   * Verificar restricciones geográficas
   */
  isGeographicallyBlocked(clientInfo) {
    return this.securityConfig.blockedCountries.includes(clientInfo.country);
  }

  /**
   * Obtener identificador del cliente
   */
  getClientIdentifier(req) {
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }

  /**
   * Verificar si debe saltar rate limiting
   */
  shouldSkipRateLimit(req) {
    return req.path === '/health' || req.path === '/metrics' || req.path === '/api/docs';
  }

  /**
   * Manejar exceso de rate limit
   */
  handleRateLimitExceeded(req, res, type) {
    const clientInfo = req.securityInfo?.clientInfo;
    
    this.logSecurityEvent('rate_limit_exceeded', {
      type,
      clientInfo,
      path: req.path,
      method: req.method
    });
    
    // Incrementar score de riesgo
    if (req.securityInfo) {
      req.securityInfo.riskScore += 0.2;
    }
    
    res.status(429).json({
      error: 'Demasiadas requests',
      type,
      retryAfter: '15 minutos'
    });
  }

  /**
   * Obtener eventos del cliente
   */
  getClientEvents(clientId) {
    return this.userBehaviorProfiles.get(clientId) || [];
  }

  /**
   * Registrar evento del cliente
   */
  recordClientEvent(clientId, event) {
    if (!this.userBehaviorProfiles.has(clientId)) {
      this.userBehaviorProfiles.set(clientId, []);
    }
    
    const events = this.userBehaviorProfiles.get(clientId);
    events.push(event);
    
    // Mantener solo los últimos 1000 eventos
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
  }

  /**
   * Bloquear IP
   */
  blockIP(ip, duration) {
    this.ddosProtection.get('blocked_ips').add(ip);
    
    setTimeout(() => {
      this.ddosProtection.get('blocked_ips').delete(ip);
      this.logSecurityEvent('ip_unblocked', { ip });
    }, duration);
    
    this.logSecurityEvent('ip_blocked', { ip, duration });
  }

  /**
   * Analizar comportamiento de usuarios
   */
  analyzeUserBehavior() {
    for (const [clientId, events] of this.userBehaviorProfiles) {
      // Analizar patrones maliciosos
      for (const pattern of this.threatIntelligence.get('malicious_patterns')) {
        if (pattern.pattern(events)) {
          this.logSecurityEvent('malicious_pattern_detected', {
            clientId,
            pattern: pattern.name,
            risk: pattern.risk,
            eventCount: events.length
          });
          
          // Bloquear si es de alto riesgo
          if (pattern.risk === 'high') {
            this.blockIP(clientId, 60 * 60 * 1000); // 1 hora
          }
        }
      }
    }
  }

  /**
   * Actualizar reputación de IPs
   */
  updateIPReputation() {
    for (const [clientId, events] of this.userBehaviorProfiles) {
      const recentEvents = events.filter(e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000);
      
      // Calcular score de reputación basado en eventos
      let score = 1.0;
      
      // Penalizar por eventos sospechosos
      const suspiciousEvents = recentEvents.filter(e => e.statusCode >= 400);
      score -= (suspiciousEvents.length / recentEvents.length) * 0.5;
      
      // Penalizar por alta frecuencia
      if (recentEvents.length > 1000) {
        score -= 0.3;
      }
      
      this.ipReputation.set(clientId, {
        score: Math.max(0, score),
        lastUpdate: Date.now(),
        eventCount: recentEvents.length
      });
    }
  }

  /**
   * Limpiar datos de seguridad
   */
  cleanupSecurityData() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Limpiar perfiles de comportamiento antiguos
    for (const [clientId, events] of this.userBehaviorProfiles) {
      const recentEvents = events.filter(e => e.timestamp > oneWeekAgo);
      if (recentEvents.length === 0) {
        this.userBehaviorProfiles.delete(clientId);
      } else {
        this.userBehaviorProfiles.set(clientId, recentEvents);
      }
    }
    
    // Limpiar reputación de IPs antiguas
    for (const [clientId, reputation] of this.ipReputation) {
      if (reputation.lastUpdate < oneWeekAgo) {
        this.ipReputation.delete(clientId);
      }
    }
    
    this.logger.info('Limpieza de datos de seguridad completada');
  }

  /**
   * Sanitizar headers para logging
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-webhook-signature'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitizar body para logging
   */
  sanitizeBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'privateKey', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Registrar evento de seguridad
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
  }

  /**
   * Obtener severidad del evento
   */
  getEventSeverity(eventType) {
    const criticalEvents = [
      'waf_rule_triggered',
      'ddos_attack_detected',
      'malicious_pattern_detected'
    ];
    
    const highEvents = [
      'bot_detected',
      'rate_limit_exceeded',
      'blacklisted_client_access'
    ];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    return 'medium';
  }

  /**
   * Obtener estadísticas de seguridad
   */
  getSecurityStats() {
    return {
      totalClients: this.userBehaviorProfiles.size,
      blockedIPs: this.ddosProtection.get('blocked_ips').size,
      ipReputations: this.ipReputation.size,
      botSignatures: this.botSignatures.size,
      wafRules: Object.keys(this.wafRules).length,
      threatIntelligence: this.threatIntelligence.size
    };
  }
}

// Instancia singleton
const advancedSecurityManager = new AdvancedSecurityManager();

module.exports = advancedSecurityManager;
