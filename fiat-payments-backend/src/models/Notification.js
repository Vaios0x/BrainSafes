const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Identificación
  wallet: { 
    type: String, 
    required: true, 
    lowercase: true,
    index: true 
  },
  
  // Contenido
  title: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  
  // Metadatos
  type: { 
    type: String, 
    required: true,
    enum: [
      'welcome',
      'course_enrolled',
      'course_completed',
      'certificate_issued',
      'badge_earned',
      'achievement_unlocked',
      'payment_received',
      'payment_failed',
      'scholarship_awarded',
      'job_application',
      'job_offer',
      'mentorship_request',
      'mentorship_accepted',
      'governance_proposal',
      'governance_vote',
      'security_alert',
      'system_maintenance',
      'general'
    ],
    index: true
  },
  
  // Estado
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  archived: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  // Prioridad y categoría
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: { 
    type: String, 
    enum: ['education', 'finance', 'governance', 'security', 'social', 'system'],
    default: 'general'
  },
  
  // Enlaces y acciones
  link: { 
    type: String,
    maxlength: 500
  },
  actionUrl: { 
    type: String,
    maxlength: 500
  },
  actionText: { 
    type: String,
    maxlength: 50
  },
  
  // Datos adicionales
  metadata: { 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Canales de envío
  channels: [{
    type: String,
    enum: ['email', 'push', 'sms', 'in-app'],
    default: ['in-app']
  }],
  
  // Estado de envío por canal
  deliveryStatus: {
    email: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    'in-app': { 
      sent: { type: Boolean, default: true },
      sentAt: { type: Date, default: Date.now }
    }
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  readAt: { 
    type: Date 
  },
  expiresAt: { 
    type: Date 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para consultas eficientes
notificationSchema.index({ wallet: 1, read: 1, createdAt: -1 });
notificationSchema.index({ wallet: 1, type: 1, createdAt: -1 });
notificationSchema.index({ wallet: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 días TTL

// Virtuals
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

notificationSchema.virtual('isRead').get(function() {
  return this.read;
});

notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Métodos de instancia
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.archived = true;
  return this.save();
};

notificationSchema.methods.updateDeliveryStatus = function(channel, status) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = {
      ...this.deliveryStatus[channel],
      ...status,
      sentAt: status.sent ? new Date() : this.deliveryStatus[channel].sentAt
    };
  }
  return this.save();
};

// Métodos estáticos
notificationSchema.statics.findByWallet = function(wallet, options = {}) {
  const query = { wallet: wallet.toLowerCase() };
  
  if (options.unreadOnly) {
    query.read = false;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  if (options.archived !== undefined) {
    query.archived = options.archived;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.markAllAsRead = function(wallet) {
  return this.updateMany(
    { wallet: wallet.toLowerCase(), read: false },
    { 
      read: true, 
      readAt: new Date() 
    }
  );
};

notificationSchema.statics.getUnreadCount = function(wallet) {
  return this.countDocuments({ 
    wallet: wallet.toLowerCase(), 
    read: false,
    archived: false
  });
};

notificationSchema.statics.cleanupOld = function(maxAge = 90 * 24 * 60 * 60 * 1000) { // 90 días
  const cutoffDate = new Date(Date.now() - maxAge);
  return this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

// Middleware pre-save
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pre-find
notificationSchema.pre('find', function() {
  this.where({ archived: { $ne: true } });
});

notificationSchema.pre('findOne', function() {
  this.where({ archived: { $ne: true } });
});

module.exports = mongoose.model('Notification', notificationSchema); 