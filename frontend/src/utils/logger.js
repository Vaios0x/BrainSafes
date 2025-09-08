import winston from 'winston';

// Configuración del logger para desarrollo
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'brainsafes-frontend' },
  transports: [
    // Logs de error
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Logs combinados
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Función helper para logging de errores de Web3
export const logWeb3Error = (error, context = '') => {
  logger.error('Web3 Error', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Función helper para logging de transacciones
export const logTransaction = (txHash, method, params = {}) => {
  logger.info('Transaction', {
    txHash,
    method,
    params,
    timestamp: new Date().toISOString()
  });
};

// Función helper para logging de eventos de usuario
export const logUserAction = (action, userId, details = {}) => {
  logger.info('User Action', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export default logger;
