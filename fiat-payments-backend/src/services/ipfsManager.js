const { create } = require('ipfs-http-client');
const { globSource } = require('ipfs-http-client');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');

class IPFSManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/ipfs.log' })
      ],
    });

    // Configuración de IPFS
    this.ipfsConfig = {
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'https',
      headers: {
        authorization: `Basic ${Buffer.from(
          process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
        ).toString('base64')}`
      }
    };

    // Inicializar cliente IPFS
    this.ipfs = create(this.ipfsConfig);
    
    // Cache local para metadata
    this.metadataCache = new Map();
    this.pinnedFiles = new Set();
    
    // Configuración de pinning
    this.pinningServices = [
      {
        name: 'Pinata',
        apiKey: process.env.PINATA_API_KEY,
        secretKey: process.env.PINATA_SECRET_KEY,
        endpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS'
      },
      {
        name: 'NFT.Storage',
        apiKey: process.env.NFT_STORAGE_API_KEY,
        endpoint: 'https://api.nft.storage/upload'
      }
    ];

    this.logger.info('IPFS Manager inicializado');
  }

  /**
   * Subir archivo a IPFS
   * @param {Buffer|string} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadFile(content, filename, options = {}) {
    try {
      this.logger.info(`Subiendo archivo: ${filename}`);

      const fileBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Verificar si ya existe en cache
      if (this.metadataCache.has(fileHash)) {
        this.logger.info(`Archivo encontrado en cache: ${fileHash}`);
        return this.metadataCache.get(fileHash);
      }

      // Subir a IPFS
      const result = await this.ipfs.add(fileBuffer, {
        pin: options.pin !== false,
        ...options
      });

      const uploadResult = {
        hash: result.cid.toString(),
        size: result.size,
        filename,
        url: `https://ipfs.io/ipfs/${result.cid}`,
        gateway: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
        timestamp: Date.now()
      };

      // Guardar en cache
      this.metadataCache.set(fileHash, uploadResult);

      // Pinning en servicios externos
      if (options.pin !== false) {
        await this.pinToServices(uploadResult.hash, fileBuffer, filename);
      }

      this.logger.info(`Archivo subido exitosamente: ${uploadResult.hash}`);
      return uploadResult;

    } catch (error) {
      this.logger.error(`Error subiendo archivo ${filename}:`, error.message);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
  }

  /**
   * Subir metadata JSON a IPFS
   * @param {Object} metadata - Metadata a subir
   * @param {string} name - Nombre del archivo
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadMetadata(metadata, name = 'metadata.json', options = {}) {
    try {
      this.logger.info(`Subiendo metadata: ${name}`);

      // Validar metadata
      if (!metadata || typeof metadata !== 'object') {
        throw new Error('Metadata inválida');
      }

      // Agregar timestamp si no existe
      if (!metadata.timestamp) {
        metadata.timestamp = Date.now();
      }

      // Agregar versión si no existe
      if (!metadata.version) {
        metadata.version = '1.0.0';
      }

      const jsonString = JSON.stringify(metadata, null, 2);
      const result = await this.uploadFile(jsonString, name, {
        pin: true,
        ...options
      });

      this.logger.info(`Metadata subida exitosamente: ${result.hash}`);
      return result;

    } catch (error) {
      this.logger.error(`Error subiendo metadata ${name}:`, error.message);
      throw new Error(`Error subiendo metadata: ${error.message}`);
    }
  }

  /**
   * Subir imagen a IPFS
   * @param {Buffer} imageBuffer - Buffer de la imagen
   * @param {string} filename - Nombre del archivo
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadImage(imageBuffer, filename, options = {}) {
    try {
      this.logger.info(`Subiendo imagen: ${filename}`);

      // Validar que es una imagen
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const ext = path.extname(filename).toLowerCase();
      
      if (!validExtensions.includes(ext)) {
        throw new Error(`Extensión de imagen no válida: ${ext}`);
      }

      const result = await this.uploadFile(imageBuffer, filename, {
        pin: true,
        ...options
      });

      this.logger.info(`Imagen subida exitosamente: ${result.hash}`);
      return result;

    } catch (error) {
      this.logger.error(`Error subiendo imagen ${filename}:`, error.message);
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }
  }

  /**
   * Subir directorio completo a IPFS
   * @param {string} directoryPath - Ruta del directorio
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadDirectory(directoryPath, options = {}) {
    try {
      this.logger.info(`Subiendo directorio: ${directoryPath}`);

      const result = await this.ipfs.add(globSource(directoryPath, { recursive: true }), {
        pin: options.pin !== false,
        ...options
      });

      const uploadResult = {
        hash: result.cid.toString(),
        size: result.size,
        path: directoryPath,
        url: `https://ipfs.io/ipfs/${result.cid}`,
        gateway: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
        timestamp: Date.now()
      };

      // Pinning en servicios externos
      if (options.pin !== false) {
        await this.pinToServices(uploadResult.hash);
      }

      this.logger.info(`Directorio subido exitosamente: ${uploadResult.hash}`);
      return uploadResult;

    } catch (error) {
      this.logger.error(`Error subiendo directorio ${directoryPath}:`, error.message);
      throw new Error(`Error subiendo directorio: ${error.message}`);
    }
  }

  /**
   * Pinear archivo en servicios externos
   * @param {string} hash - Hash del archivo
   * @param {Buffer} content - Contenido del archivo (opcional)
   * @param {string} filename - Nombre del archivo (opcional)
   */
  async pinToServices(hash, content = null, filename = null) {
    const pinPromises = this.pinningServices.map(service => 
      this.pinToService(service, hash, content, filename)
    );

    await Promise.allSettled(pinPromises);
  }

  /**
   * Pinear archivo en un servicio específico
   * @param {Object} service - Configuración del servicio
   * @param {string} hash - Hash del archivo
   * @param {Buffer} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   */
  async pinToService(service, hash, content = null, filename = null) {
    try {
      if (!service.apiKey) {
        this.logger.warn(`API key no configurada para ${service.name}`);
        return;
      }

      let response;
      
      if (service.name === 'Pinata') {
        response = await this.pinToPinata(service, hash, content, filename);
      } else if (service.name === 'NFT.Storage') {
        response = await this.pinToNFTStorage(service, hash, content, filename);
      }

      this.logger.info(`Archivo pineado en ${service.name}: ${hash}`);
      this.pinnedFiles.add(hash);
      
      return response;

    } catch (error) {
      this.logger.error(`Error pineando en ${service.name}:`, error.message);
    }
  }

  /**
   * Pinear en Pinata
   * @param {Object} service - Configuración del servicio
   * @param {string} hash - Hash del archivo
   * @param {Buffer} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   */
  async pinToPinata(service, hash, content, filename) {
    const formData = new FormData();
    
    if (content) {
      formData.append('file', content, filename || 'file');
    } else {
      formData.append('hashToPin', hash);
    }

    const response = await axios.post(service.endpoint, formData, {
      headers: {
        'pinata_api_key': service.apiKey,
        'pinata_secret_api_key': service.secretKey,
        ...formData.getHeaders()
      }
    });

    return response.data;
  }

  /**
   * Pinear en NFT.Storage
   * @param {Object} service - Configuración del servicio
   * @param {string} hash - Hash del archivo
   * @param {Buffer} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   */
  async pinToNFTStorage(service, hash, content, filename) {
    const response = await axios.post(service.endpoint, content, {
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/octet-stream'
      }
    });

    return response.data;
  }

  /**
   * Obtener archivo desde IPFS
   * @param {string} hash - Hash del archivo
   * @param {Object} options - Opciones adicionales
   * @returns {Buffer} Contenido del archivo
   */
  async getFile(hash, options = {}) {
    try {
      this.logger.info(`Obteniendo archivo: ${hash}`);

      const chunks = [];
      for await (const chunk of this.ipfs.cat(hash, options)) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks);
      this.logger.info(`Archivo obtenido exitosamente: ${hash}`);
      
      return content;

    } catch (error) {
      this.logger.error(`Error obteniendo archivo ${hash}:`, error.message);
      throw new Error(`Error obteniendo archivo: ${error.message}`);
    }
  }

  /**
   * Obtener metadata desde IPFS
   * @param {string} hash - Hash del archivo
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Metadata
   */
  async getMetadata(hash, options = {}) {
    try {
      this.logger.info(`Obteniendo metadata: ${hash}`);

      const content = await this.getFile(hash, options);
      const metadata = JSON.parse(content.toString());

      this.logger.info(`Metadata obtenida exitosamente: ${hash}`);
      return metadata;

    } catch (error) {
      this.logger.error(`Error obteniendo metadata ${hash}:`, error.message);
      throw new Error(`Error obteniendo metadata: ${error.message}`);
    }
  }

  /**
   * Verificar si un archivo está pineado
   * @param {string} hash - Hash del archivo
   * @returns {boolean} True si está pineado
   */
  async isPinned(hash) {
    try {
      const pins = await this.ipfs.pin.ls();
      return pins.some(pin => pin.cid.toString() === hash);
    } catch (error) {
      this.logger.error(`Error verificando pin ${hash}:`, error.message);
      return false;
    }
  }

  /**
   * Pinear archivo
   * @param {string} hash - Hash del archivo
   * @param {Object} options - Opciones adicionales
   */
  async pinFile(hash, options = {}) {
    try {
      this.logger.info(`Pineando archivo: ${hash}`);

      await this.ipfs.pin.add(hash, options);
      this.pinnedFiles.add(hash);

      this.logger.info(`Archivo pineado exitosamente: ${hash}`);

    } catch (error) {
      this.logger.error(`Error pineando archivo ${hash}:`, error.message);
      throw new Error(`Error pineando archivo: ${error.message}`);
    }
  }

  /**
   * Despinear archivo
   * @param {string} hash - Hash del archivo
   * @param {Object} options - Opciones adicionales
   */
  async unpinFile(hash, options = {}) {
    try {
      this.logger.info(`Despineando archivo: ${hash}`);

      await this.ipfs.pin.rm(hash, options);
      this.pinnedFiles.delete(hash);

      this.logger.info(`Archivo despineado exitosamente: ${hash}`);

    } catch (error) {
      this.logger.error(`Error despineando archivo ${hash}:`, error.message);
      throw new Error(`Error despineando archivo: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de IPFS
   * @returns {Object} Estadísticas
   */
  async getStats() {
    try {
      const stats = await this.ipfs.stats.repo();
      const pins = await this.ipfs.pin.ls();

      return {
        repoSize: stats.repoSize,
        numObjects: stats.numObjects,
        version: stats.version,
        pinnedFiles: pins.length,
        cacheSize: this.metadataCache.size,
        pinnedFilesSet: this.pinnedFiles.size
      };

    } catch (error) {
      this.logger.error('Error obteniendo estadísticas:', error.message);
      return null;
    }
  }

  /**
   * Limpiar cache
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupCache(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, metadata] of this.metadataCache) {
      if ((now - metadata.timestamp) > maxAge) {
        this.metadataCache.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cache limpiado: ${cleaned} entradas removidas`);
    }

    return cleaned;
  }

  /**
   * Obtener URL de gateway
   * @param {string} hash - Hash del archivo
   * @param {string} gateway - Gateway específico
   * @returns {string} URL del archivo
   */
  getGatewayUrl(hash, gateway = 'ipfs.io') {
    const gateways = {
      'ipfs.io': `https://ipfs.io/ipfs/${hash}`,
      'pinata': `https://gateway.pinata.cloud/ipfs/${hash}`,
      'cloudflare': `https://cloudflare-ipfs.com/ipfs/${hash}`,
      'dweb': `https://dweb.link/ipfs/${hash}`
    };

    return gateways[gateway] || gateways['ipfs.io'];
  }

  /**
   * Validar hash IPFS
   * @param {string} hash - Hash a validar
   * @returns {boolean} True si es válido
   */
  isValidHash(hash) {
    // Validación básica de hash IPFS (CID)
    const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/;
    return cidRegex.test(hash);
  }
}

// Instancia singleton
const ipfsManager = new IPFSManager();

module.exports = ipfsManager;
