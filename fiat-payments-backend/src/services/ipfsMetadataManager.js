const ipfsManager = require('./ipfsManager');
const winston = require('winston');
const crypto = require('crypto');

class IPFSMetadataManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/ipfs-metadata.log' })
      ],
    });

    // Cache para metadata de contratos
    this.contractMetadataCache = new Map();
    this.nftMetadataCache = new Map();
    
    // Configuración de metadata estándar
    this.metadataStandards = {
      erc721: {
        name: 'string',
        description: 'string',
        image: 'string',
        external_url: 'string',
        attributes: 'array'
      },
      erc1155: {
        name: 'string',
        description: 'string',
        image: 'string',
        external_url: 'string',
        attributes: 'array'
      },
      profile: {
        name: 'string',
        email: 'string',
        bio: 'string',
        avatar: 'string',
        skills: 'array',
        experience: 'array',
        education: 'array'
      },
      course: {
        title: 'string',
        description: 'string',
        instructor: 'string',
        duration: 'number',
        difficulty: 'string',
        topics: 'array',
        requirements: 'array',
        outcomes: 'array',
        thumbnail: 'string'
      },
      certificate: {
        title: 'string',
        description: 'string',
        issuer: 'string',
        recipient: 'string',
        courseId: 'string',
        score: 'number',
        issuedAt: 'string',
        expiresAt: 'string',
        signature: 'string'
      }
    };

    this.logger.info('IPFS Metadata Manager inicializado');
  }

  /**
   * Generar metadata estándar para NFT
   * @param {string} type - Tipo de NFT (certificate, course, achievement, etc.)
   * @param {Object} data - Datos del NFT
   * @returns {Object} Metadata estándar
   */
  generateNFTMetadata(type, data) {
    const baseMetadata = {
      name: data.name || data.title,
      description: data.description,
      image: data.image || `ipfs://${data.imageHash}`,
      external_url: `https://brainsafes.com/nft/${type}/${data.tokenId || data.id}`,
      attributes: data.attributes || [],
      created_at: new Date().toISOString(),
      version: '1.0.0'
    };

    // Agregar campos específicos según el tipo
    switch (type) {
      case 'certificate':
        return {
          ...baseMetadata,
          certificate_type: 'educational',
          issuer: data.issuer,
          recipient: data.recipient,
          course_id: data.courseId,
          score: data.score,
          issued_at: data.issuedAt,
          expires_at: data.expiresAt,
          signature: data.signature,
          blockchain: 'arbitrum',
          contract_address: data.contractAddress
        };

      case 'course':
        return {
          ...baseMetadata,
          course_type: 'educational',
          instructor: data.instructor,
          duration: data.duration,
          difficulty: data.difficulty,
          topics: data.topics || [],
          requirements: data.requirements || [],
          outcomes: data.outcomes || [],
          thumbnail: data.thumbnail,
          price: data.price,
          max_students: data.maxStudents
        };

      case 'achievement':
        return {
          ...baseMetadata,
          achievement_type: data.achievementType,
          criteria: data.criteria,
          rarity: data.rarity,
          points: data.points,
          unlocked_at: data.unlockedAt
        };

      case 'profile':
        return {
          ...baseMetadata,
          profile_type: 'user',
          email: data.email,
          bio: data.bio,
          avatar: data.avatar,
          skills: data.skills || [],
          experience: data.experience || [],
          education: data.education || [],
          social_links: data.socialLinks || {},
          reputation_score: data.reputationScore
        };

      default:
        return baseMetadata;
    }
  }

  /**
   * Subir metadata de NFT a IPFS
   * @param {string} type - Tipo de NFT
   * @param {Object} data - Datos del NFT
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadNFTMetadata(type, data, options = {}) {
    try {
      this.logger.info(`Subiendo metadata de NFT tipo ${type}`);

      // Generar metadata estándar
      const metadata = this.generateNFTMetadata(type, data);
      
      // Generar nombre único para el archivo
      const filename = `${type}_${data.tokenId || data.id}_${Date.now()}.json`;
      
      // Subir a IPFS
      const result = await ipfsManager.uploadMetadata(metadata, filename, {
        pin: true,
        ...options
      });

      // Guardar en cache
      const cacheKey = `${type}_${data.tokenId || data.id}`;
      this.nftMetadataCache.set(cacheKey, {
        ...result,
        metadata,
        type,
        tokenId: data.tokenId || data.id
      });

      this.logger.info(`Metadata de NFT subida exitosamente: ${result.hash}`);
      
      return {
        ...result,
        metadata,
        tokenURI: `ipfs://${result.hash}/${filename}`,
        type
      };

    } catch (error) {
      this.logger.error(`Error subiendo metadata de NFT ${type}:`, error.message);
      throw new Error(`Error subiendo metadata de NFT: ${error.message}`);
    }
  }

  /**
   * Subir metadata de perfil de usuario
   * @param {Object} profileData - Datos del perfil
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadProfileMetadata(profileData, options = {}) {
    try {
      this.logger.info(`Subiendo metadata de perfil para ${profileData.walletAddress}`);

      const metadata = {
        name: profileData.name,
        email: profileData.email,
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        education: profileData.education || [],
        social_links: profileData.socialLinks || {},
        reputation_score: profileData.reputationScore || 0,
        wallet_address: profileData.walletAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      };

      const filename = `profile_${profileData.walletAddress}_${Date.now()}.json`;
      
      const result = await ipfsManager.uploadMetadata(metadata, filename, {
        pin: true,
        ...options
      });

      // Guardar en cache
      this.contractMetadataCache.set(profileData.walletAddress, {
        ...result,
        metadata,
        type: 'profile'
      });

      this.logger.info(`Metadata de perfil subida exitosamente: ${result.hash}`);
      
      return {
        ...result,
        metadata,
        profileURI: `ipfs://${result.hash}/${filename}`,
        type: 'profile'
      };

    } catch (error) {
      this.logger.error(`Error subiendo metadata de perfil:`, error.message);
      throw new Error(`Error subiendo metadata de perfil: ${error.message}`);
    }
  }

  /**
   * Subir metadata de curso
   * @param {Object} courseData - Datos del curso
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadCourseMetadata(courseData, options = {}) {
    try {
      this.logger.info(`Subiendo metadata de curso: ${courseData.title}`);

      const metadata = {
        title: courseData.title,
        description: courseData.description,
        instructor: courseData.instructor,
        duration: courseData.duration,
        difficulty: courseData.difficulty,
        topics: courseData.topics || [],
        requirements: courseData.requirements || [],
        outcomes: courseData.outcomes || [],
        thumbnail: courseData.thumbnail || '',
        price: courseData.price,
        max_students: courseData.maxStudents,
        course_id: courseData.courseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: '1.0.0'
      };

      const filename = `course_${courseData.courseId}_${Date.now()}.json`;
      
      const result = await ipfsManager.uploadMetadata(metadata, filename, {
        pin: true,
        ...options
      });

      // Guardar en cache
      const cacheKey = `course_${courseData.courseId}`;
      this.contractMetadataCache.set(cacheKey, {
        ...result,
        metadata,
        type: 'course'
      });

      this.logger.info(`Metadata de curso subida exitosamente: ${result.hash}`);
      
      return {
        ...result,
        metadata,
        courseURI: `ipfs://${result.hash}/${filename}`,
        type: 'course'
      };

    } catch (error) {
      this.logger.error(`Error subiendo metadata de curso:`, error.message);
      throw new Error(`Error subiendo metadata de curso: ${error.message}`);
    }
  }

  /**
   * Subir metadata de certificado
   * @param {Object} certificateData - Datos del certificado
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la subida
   */
  async uploadCertificateMetadata(certificateData, options = {}) {
    try {
      this.logger.info(`Subiendo metadata de certificado: ${certificateData.title}`);

      const metadata = {
        title: certificateData.title,
        description: certificateData.description,
        issuer: certificateData.issuer,
        recipient: certificateData.recipient,
        course_id: certificateData.courseId,
        score: certificateData.score,
        issued_at: certificateData.issuedAt,
        expires_at: certificateData.expiresAt,
        signature: certificateData.signature,
        token_id: certificateData.tokenId,
        contract_address: certificateData.contractAddress,
        blockchain: 'arbitrum',
        created_at: new Date().toISOString(),
        version: '1.0.0'
      };

      const filename = `certificate_${certificateData.tokenId}_${Date.now()}.json`;
      
      const result = await ipfsManager.uploadMetadata(metadata, filename, {
        pin: true,
        ...options
      });

      // Guardar en cache
      const cacheKey = `certificate_${certificateData.tokenId}`;
      this.nftMetadataCache.set(cacheKey, {
        ...result,
        metadata,
        type: 'certificate'
      });

      this.logger.info(`Metadata de certificado subida exitosamente: ${result.hash}`);
      
      return {
        ...result,
        metadata,
        tokenURI: `ipfs://${result.hash}/${filename}`,
        type: 'certificate'
      };

    } catch (error) {
      this.logger.error(`Error subiendo metadata de certificado:`, error.message);
      throw new Error(`Error subiendo metadata de certificado: ${error.message}`);
    }
  }

  /**
   * Obtener metadata desde IPFS
   * @param {string} hash - Hash IPFS
   * @param {string} type - Tipo de metadata (opcional)
   * @returns {Object} Metadata
   */
  async getMetadata(hash, type = null) {
    try {
      this.logger.info(`Obteniendo metadata: ${hash}`);

      // Verificar cache primero
      const cacheKey = type ? `${type}_${hash}` : hash;
      if (this.contractMetadataCache.has(cacheKey)) {
        this.logger.info(`Metadata encontrada en cache: ${cacheKey}`);
        return this.contractMetadataCache.get(cacheKey);
      }

      const metadata = await ipfsManager.getMetadata(hash);
      
      // Guardar en cache
      if (type) {
        this.contractMetadataCache.set(cacheKey, {
          hash,
          metadata,
          type
        });
      }

      this.logger.info(`Metadata obtenida exitosamente: ${hash}`);
      return metadata;

    } catch (error) {
      this.logger.error(`Error obteniendo metadata ${hash}:`, error.message);
      throw new Error(`Error obteniendo metadata: ${error.message}`);
    }
  }

  /**
   * Validar metadata según estándar
   * @param {Object} metadata - Metadata a validar
   * @param {string} type - Tipo de metadata
   * @returns {Object} Resultado de validación
   */
  validateMetadata(metadata, type) {
    const standard = this.metadataStandards[type];
    if (!standard) {
      return {
        valid: false,
        error: `Tipo de metadata no soportado: ${type}`
      };
    }

    const errors = [];
    
    for (const [field, expectedType] of Object.entries(standard)) {
      if (!metadata.hasOwnProperty(field)) {
        errors.push(`Campo requerido faltante: ${field}`);
        continue;
      }

      const actualType = Array.isArray(metadata[field]) ? 'array' : typeof metadata[field];
      if (actualType !== expectedType) {
        errors.push(`Tipo incorrecto para ${field}: esperado ${expectedType}, obtenido ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata
    };
  }

  /**
   * Actualizar metadata existente
   * @param {string} hash - Hash IPFS original
   * @param {Object} updates - Actualizaciones a aplicar
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la actualización
   */
  async updateMetadata(hash, updates, options = {}) {
    try {
      this.logger.info(`Actualizando metadata: ${hash}`);

      // Obtener metadata original
      const originalMetadata = await this.getMetadata(hash);
      
      // Aplicar actualizaciones
      const updatedMetadata = {
        ...originalMetadata,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Generar nuevo hash
      const filename = `updated_${Date.now()}.json`;
      const result = await ipfsManager.uploadMetadata(updatedMetadata, filename, {
        pin: true,
        ...options
      });

      this.logger.info(`Metadata actualizada exitosamente: ${result.hash}`);
      
      return {
        ...result,
        originalHash: hash,
        metadata: updatedMetadata
      };

    } catch (error) {
      this.logger.error(`Error actualizando metadata ${hash}:`, error.message);
      throw new Error(`Error actualizando metadata: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de metadata
   * @returns {Object} Estadísticas
   */
  getStats() {
    const stats = {
      contractMetadataCache: this.contractMetadataCache.size,
      nftMetadataCache: this.nftMetadataCache.size,
      totalCacheEntries: this.contractMetadataCache.size + this.nftMetadataCache.size,
      supportedTypes: Object.keys(this.metadataStandards)
    };

    // Contar por tipo
    const typeCounts = {};
    for (const [key, value] of this.contractMetadataCache) {
      const type = value.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    stats.typeCounts = typeCounts;
    return stats;
  }

  /**
   * Limpiar cache
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupCache(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
    const now = Date.now();
    let cleaned = 0;

    // Limpiar cache de contratos
    for (const [key, value] of this.contractMetadataCache) {
      if ((now - value.timestamp) > maxAge) {
        this.contractMetadataCache.delete(key);
        cleaned++;
      }
    }

    // Limpiar cache de NFTs
    for (const [key, value] of this.nftMetadataCache) {
      if ((now - value.timestamp) > maxAge) {
        this.nftMetadataCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cache de metadata limpiado: ${cleaned} entradas removidas`);
    }

    return cleaned;
  }
}

// Instancia singleton
const ipfsMetadataManager = new IPFSMetadataManager();

module.exports = ipfsMetadataManager;
