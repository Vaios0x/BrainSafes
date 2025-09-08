const crypto = require('crypto');
const axios = require('axios');
const winston = require('winston');
const { ethers } = require('ethers');
const webhookManager = require('./webhookManager');
const advancedNotificationManager = require('./advancedNotificationManager');

/**
 * @title BlockchainWebhookManager - Sistema especializado de webhooks para eventos blockchain
 * @description Gestiona webhooks específicos para eventos de contratos inteligentes
 * @author BrainSafes Team
 */
class BlockchainWebhookManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/blockchain-webhooks.log' })
      ],
    });

    // Configuración de eventos blockchain
    this.blockchainEvents = new Map();
    this.eventProcessors = new Map();
    this.pendingEvents = [];
    this.isProcessing = false;

    // Configurar procesadores de eventos
    this.setupEventProcessors();
    
    // Iniciar procesamiento de eventos
    this.startEventProcessing();
  }

  /**
   * Configurar procesadores de eventos para cada tipo de contrato
   */
  setupEventProcessors() {
    // Eventos de BrainSafes Core
    this.eventProcessors.set('UserProfileCreated', this.processUserProfileCreated.bind(this));
    this.eventProcessors.set('UserProfileUpdated', this.processUserProfileUpdated.bind(this));
    this.eventProcessors.set('RoleGranted', this.processRoleGranted.bind(this));
    this.eventProcessors.set('RoleRevoked', this.processRoleRevoked.bind(this));

    // Eventos de EDU Token
    this.eventProcessors.set('Transfer', this.processTokenTransfer.bind(this));
    this.eventProcessors.set('Mint', this.processTokenMint.bind(this));
    this.eventProcessors.set('Burn', this.processTokenBurn.bind(this));
    this.eventProcessors.set('Approval', this.processTokenApproval.bind(this));

    // Eventos de Certificate NFT
    this.eventProcessors.set('CertificateIssued', this.processCertificateIssued.bind(this));
    this.eventProcessors.set('CertificateRevoked', this.processCertificateRevoked.bind(this));
    this.eventProcessors.set('CertificateTransferred', this.processCertificateTransferred.bind(this));

    // Eventos de Course NFT
    this.eventProcessors.set('CourseCreated', this.processCourseCreated.bind(this));
    this.eventProcessors.set('StudentEnrolled', this.processStudentEnrolled.bind(this));
    this.eventProcessors.set('CourseCompleted', this.processCourseCompleted.bind(this));

    // Eventos de Job Marketplace
    this.eventProcessors.set('JobPosted', this.processJobPosted.bind(this));
    this.eventProcessors.set('JobApplicationSubmitted', this.processJobApplicationSubmitted.bind(this));
    this.eventProcessors.set('ApplicationStatusUpdated', this.processApplicationStatusUpdated.bind(this));
    this.eventProcessors.set('HiringContractCreated', this.processHiringContractCreated.bind(this));
    this.eventProcessors.set('SuccessfulHire', this.processSuccessfulHire.bind(this));

    // Eventos de Scholarship Manager
    this.eventProcessors.set('ScholarshipCreated', this.processScholarshipCreated.bind(this));
    this.eventProcessors.set('ScholarshipAwarded', this.processScholarshipAwarded.bind(this));
    this.eventProcessors.set('ScholarshipExpired', this.processScholarshipExpired.bind(this));

    // Eventos de Governance
    this.eventProcessors.set('ProposalCreated', this.processProposalCreated.bind(this));
    this.eventProcessors.set('VoteCast', this.processVoteCast.bind(this));
    this.eventProcessors.set('ProposalExecuted', this.processProposalExecuted.bind(this));
    this.eventProcessors.set('ProposalCanceled', this.processProposalCanceled.bind(this));

    // Eventos de Bridge
    this.eventProcessors.set('TransferInitiated', this.processTransferInitiated.bind(this));
    this.eventProcessors.set('TransferCompleted', this.processTransferCompleted.bind(this));
    this.eventProcessors.set('TransferFailed', this.processTransferFailed.bind(this));
    this.eventProcessors.set('MessageSent', this.processMessageSent.bind(this));

    // Eventos de AI Oracle
    this.eventProcessors.set('PredictionUpdated', this.processPredictionUpdated.bind(this));
    this.eventProcessors.set('JobMatchCalculated', this.processJobMatchCalculated.bind(this));
    this.eventProcessors.set('AIAnalysisCompleted', this.processAIAnalysisCompleted.bind(this));

    this.logger.info('Procesadores de eventos blockchain configurados');
  }

  /**
   * Registrar evento blockchain para procesamiento
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  async registerBlockchainEvent(eventType, eventData, metadata = {}) {
    const eventId = crypto.randomUUID();
    const timestamp = Date.now();

    const blockchainEvent = {
      id: eventId,
      eventType,
      eventData,
      metadata: {
        ...metadata,
        timestamp,
        processed: false,
        retryCount: 0
      }
    };

    this.blockchainEvents.set(eventId, blockchainEvent);
    this.pendingEvents.push(eventId);

    this.logger.info(`Evento blockchain registrado: ${eventType}`, {
      eventId,
      eventType,
      timestamp
    });

    // Procesar inmediatamente si no está en proceso
    if (!this.isProcessing) {
      this.processPendingEvents();
    }
  }

  /**
   * Procesar eventos pendientes
   */
  async processPendingEvents() {
    if (this.isProcessing || this.pendingEvents.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.pendingEvents.length > 0) {
        const eventId = this.pendingEvents.shift();
        const event = this.blockchainEvents.get(eventId);

        if (!event) {
          continue;
        }

        try {
          await this.processBlockchainEvent(event);
          event.metadata.processed = true;
          event.metadata.processedAt = Date.now();

          this.logger.info(`Evento blockchain procesado: ${event.eventType}`, {
            eventId,
            eventType: event.eventType
          });

        } catch (error) {
          event.metadata.retryCount++;
          event.metadata.lastError = error.message;

          this.logger.error(`Error procesando evento blockchain: ${event.eventType}`, {
            eventId,
            eventType: event.eventType,
            error: error.message,
            retryCount: event.metadata.retryCount
          });

          // Reintentar si no se han agotado los intentos
          if (event.metadata.retryCount < 3) {
            this.pendingEvents.push(eventId);
            await this.delay(5000 * event.metadata.retryCount); // Exponential backoff
          } else {
            this.logger.error(`Evento blockchain falló después de 3 intentos: ${event.eventType}`, {
              eventId,
              eventType: event.eventType
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Procesar evento blockchain individual
   * @param {Object} event - Evento a procesar
   */
  async processBlockchainEvent(event) {
    const processor = this.eventProcessors.get(event.eventType);
    
    if (!processor) {
      this.logger.warn(`No hay procesador para el evento: ${event.eventType}`);
      return;
    }

    // Procesar evento específico
    await processor(event.eventData, event.metadata);

    // Enviar webhook genérico de blockchain
    await webhookManager.sendEvent('blockchain.event', {
      eventType: event.eventType,
      eventData: event.eventData,
      metadata: event.metadata
    });
  }

  /**
   * Iniciar procesamiento de eventos
   */
  startEventProcessing() {
    setInterval(() => {
      this.processPendingEvents();
    }, 1000); // Revisar cada segundo

    this.logger.info('Procesamiento de eventos blockchain iniciado');
  }

  // ========== PROCESADORES DE EVENTOS ESPECÍFICOS ==========

  /**
   * Procesar creación de perfil de usuario
   */
  async processUserProfileCreated(eventData, metadata) {
    const webhookData = {
      userAddress: eventData.userAddress,
      name: eventData.name,
      email: eventData.email,
      ipfsProfile: eventData.ipfsProfile,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    };

    // Enviar webhook
    await webhookManager.sendEvent('user.profile_created', webhookData);

    // Procesar notificaciones avanzadas
    try {
      await advancedNotificationManager.processBlockchainEvent('user.profile_created', webhookData, metadata);
    } catch (error) {
      this.logger.error('Error procesando notificaciones para user.profile_created:', error.message);
    }
  }

  /**
   * Procesar actualización de perfil de usuario
   */
  async processUserProfileUpdated(eventData, metadata) {
    await webhookManager.sendEvent('user.profile_updated', {
      userAddress: eventData.userAddress,
      updatedFields: eventData.updatedFields,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar asignación de rol
   */
  async processRoleGranted(eventData, metadata) {
    await webhookManager.sendEvent('user.role_granted', {
      userAddress: eventData.userAddress,
      role: eventData.role,
      granter: eventData.granter,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar revocación de rol
   */
  async processRoleRevoked(eventData, metadata) {
    await webhookManager.sendEvent('user.role_revoked', {
      userAddress: eventData.userAddress,
      role: eventData.role,
      revoker: eventData.revoker,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar transferencia de tokens
   */
  async processTokenTransfer(eventData, metadata) {
    await webhookManager.sendEvent('token.transfer', {
      from: eventData.from,
      to: eventData.to,
      amount: eventData.amount,
      tokenAddress: eventData.tokenAddress,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar mint de tokens
   */
  async processTokenMint(eventData, metadata) {
    await webhookManager.sendEvent('token.minted', {
      to: eventData.to,
      amount: eventData.amount,
      tokenAddress: eventData.tokenAddress,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar burn de tokens
   */
  async processTokenBurn(eventData, metadata) {
    await webhookManager.sendEvent('token.burned', {
      from: eventData.from,
      amount: eventData.amount,
      tokenAddress: eventData.tokenAddress,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar aprobación de tokens
   */
  async processTokenApproval(eventData, metadata) {
    await webhookManager.sendEvent('token.approval', {
      owner: eventData.owner,
      spender: eventData.spender,
      amount: eventData.amount,
      tokenAddress: eventData.tokenAddress,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar emisión de certificado
   */
  async processCertificateIssued(eventData, metadata) {
    const webhookData = {
      tokenId: eventData.tokenId,
      recipient: eventData.recipient,
      issuer: eventData.issuer,
      title: eventData.title,
      description: eventData.description,
      ipfsMetadata: eventData.ipfsMetadata,
      expiresAt: eventData.expiresAt,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    };

    // Enviar webhook
    await webhookManager.sendEvent('certificate.issued', webhookData);

    // Procesar notificaciones avanzadas
    try {
      await advancedNotificationManager.processBlockchainEvent('certificate.issued', webhookData, metadata);
    } catch (error) {
      this.logger.error('Error procesando notificaciones para certificate.issued:', error.message);
    }
  }

  /**
   * Procesar revocación de certificado
   */
  async processCertificateRevoked(eventData, metadata) {
    await webhookManager.sendEvent('certificate.revoked', {
      tokenId: eventData.tokenId,
      revoker: eventData.revoker,
      reason: eventData.reason,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar transferencia de certificado
   */
  async processCertificateTransferred(eventData, metadata) {
    await webhookManager.sendEvent('certificate.transferred', {
      tokenId: eventData.tokenId,
      from: eventData.from,
      to: eventData.to,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar creación de curso
   */
  async processCourseCreated(eventData, metadata) {
    await webhookManager.sendEvent('course.created', {
      courseId: eventData.courseId,
      instructor: eventData.instructor,
      title: eventData.title,
      description: eventData.description,
      price: eventData.price,
      duration: eventData.duration,
      maxStudents: eventData.maxStudents,
      ipfsContent: eventData.ipfsContent,
      skills: eventData.skills,
      difficulty: eventData.difficulty,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar inscripción de estudiante
   */
  async processStudentEnrolled(eventData, metadata) {
    const webhookData = {
      courseId: eventData.courseId,
      student: eventData.student,
      instructor: eventData.instructor,
      enrollmentFee: eventData.enrollmentFee,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    };

    // Enviar webhook
    await webhookManager.sendEvent('course.enrolled', webhookData);

    // Procesar notificaciones avanzadas
    try {
      await advancedNotificationManager.processBlockchainEvent('course.enrolled', webhookData, metadata);
    } catch (error) {
      this.logger.error('Error procesando notificaciones para course.enrolled:', error.message);
    }
  }

  /**
   * Procesar finalización de curso
   */
  async processCourseCompleted(eventData, metadata) {
    await webhookManager.sendEvent('course.completed', {
      courseId: eventData.courseId,
      student: eventData.student,
      score: eventData.score,
      certificateIssued: eventData.certificateIssued,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar publicación de oferta de trabajo
   */
  async processJobPosted(eventData, metadata) {
    await webhookManager.sendEvent('marketplace.job_posted', {
      jobId: eventData.jobId,
      employer: eventData.employer,
      title: eventData.title,
      company: eventData.company,
      location: eventData.location,
      salaryMax: eventData.salaryMax,
      category: eventData.category,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar aplicación a oferta de trabajo
   */
  async processJobApplicationSubmitted(eventData, metadata) {
    await webhookManager.sendEvent('marketplace.application_submitted', {
      applicationId: eventData.applicationId,
      jobId: eventData.jobId,
      applicant: eventData.applicant,
      aiMatchScore: eventData.aiMatchScore,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar actualización de estado de aplicación
   */
  async processApplicationStatusUpdated(eventData, metadata) {
    await webhookManager.sendEvent('marketplace.application_status_updated', {
      applicationId: eventData.applicationId,
      oldStatus: eventData.oldStatus,
      newStatus: eventData.newStatus,
      humanScore: eventData.humanScore,
      feedback: eventData.feedback,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar creación de contrato de trabajo
   */
  async processHiringContractCreated(eventData, metadata) {
    await webhookManager.sendEvent('marketplace.hiring_contract_created', {
      contractId: eventData.contractId,
      jobId: eventData.jobId,
      employer: eventData.employer,
      employee: eventData.employee,
      salary: eventData.salary,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar contratación exitosa
   */
  async processSuccessfulHire(eventData, metadata) {
    await webhookManager.sendEvent('marketplace.successful_hire', {
      jobId: eventData.jobId,
      employer: eventData.employer,
      employee: eventData.employee,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar creación de beca
   */
  async processScholarshipCreated(eventData, metadata) {
    await webhookManager.sendEvent('scholarship.created', {
      scholarshipId: eventData.scholarshipId,
      title: eventData.title,
      amount: eventData.amount,
      maxRecipients: eventData.maxRecipients,
      deadline: eventData.deadline,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar adjudicación de beca
   */
  async processScholarshipAwarded(eventData, metadata) {
    await webhookManager.sendEvent('scholarship.awarded', {
      scholarshipId: eventData.scholarshipId,
      recipient: eventData.recipient,
      amount: eventData.amount,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar expiración de beca
   */
  async processScholarshipExpired(eventData, metadata) {
    await webhookManager.sendEvent('scholarship.expired', {
      scholarshipId: eventData.scholarshipId,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar creación de propuesta
   */
  async processProposalCreated(eventData, metadata) {
    await webhookManager.sendEvent('governance.proposal_created', {
      proposalId: eventData.proposalId,
      proposer: eventData.proposer,
      title: eventData.title,
      description: eventData.description,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar voto en propuesta
   */
  async processVoteCast(eventData, metadata) {
    await webhookManager.sendEvent('governance.vote_cast', {
      proposalId: eventData.proposalId,
      voter: eventData.voter,
      support: eventData.support,
      reason: eventData.reason,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar ejecución de propuesta
   */
  async processProposalExecuted(eventData, metadata) {
    await webhookManager.sendEvent('governance.proposal_executed', {
      proposalId: eventData.proposalId,
      executor: eventData.executor,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar cancelación de propuesta
   */
  async processProposalCanceled(eventData, metadata) {
    await webhookManager.sendEvent('governance.proposal_canceled', {
      proposalId: eventData.proposalId,
      canceler: eventData.canceler,
      reason: eventData.reason,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar inicio de transferencia bridge
   */
  async processTransferInitiated(eventData, metadata) {
    await webhookManager.sendEvent('bridge.transfer_initiated', {
      transferId: eventData.transferId,
      sourceNetwork: eventData.sourceNetwork,
      targetNetwork: eventData.targetNetwork,
      tokenAddress: eventData.tokenAddress,
      amount: eventData.amount,
      sender: eventData.sender,
      recipient: eventData.recipient,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar finalización de transferencia bridge
   */
  async processTransferCompleted(eventData, metadata) {
    await webhookManager.sendEvent('bridge.transfer_completed', {
      transferId: eventData.transferId,
      sourceNetwork: eventData.sourceNetwork,
      targetNetwork: eventData.targetNetwork,
      tokenAddress: eventData.tokenAddress,
      amount: eventData.amount,
      recipient: eventData.recipient,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar fallo de transferencia bridge
   */
  async processTransferFailed(eventData, metadata) {
    await webhookManager.sendEvent('bridge.transfer_failed', {
      transferId: eventData.transferId,
      sourceNetwork: eventData.sourceNetwork,
      targetNetwork: eventData.targetNetwork,
      reason: eventData.reason,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar envío de mensaje bridge
   */
  async processMessageSent(eventData, metadata) {
    await webhookManager.sendEvent('bridge.message_sent', {
      messageId: eventData.messageId,
      sourceNetwork: eventData.sourceNetwork,
      targetNetwork: eventData.targetNetwork,
      message: eventData.message,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar actualización de predicción de IA
   */
  async processPredictionUpdated(eventData, metadata) {
    await webhookManager.sendEvent('ai.prediction_updated', {
      userAddress: eventData.userAddress,
      predictionType: eventData.predictionType,
      oldPrediction: eventData.oldPrediction,
      newPrediction: eventData.newPrediction,
      confidence: eventData.confidence,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar cálculo de match de trabajo con IA
   */
  async processJobMatchCalculated(eventData, metadata) {
    await webhookManager.sendEvent('ai.job_match_calculated', {
      jobId: eventData.jobId,
      candidate: eventData.candidate,
      matchScore: eventData.matchScore,
      matchingSkills: eventData.matchingSkills,
      missingSkills: eventData.missingSkills,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  /**
   * Procesar análisis de IA completado
   */
  async processAIAnalysisCompleted(eventData, metadata) {
    await webhookManager.sendEvent('ai.analysis_completed', {
      analysisId: eventData.analysisId,
      analysisType: eventData.analysisType,
      result: eventData.result,
      confidence: eventData.confidence,
      timestamp: metadata.timestamp,
      txHash: metadata.txHash,
      blockNumber: metadata.blockNumber
    });
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Obtener estadísticas de eventos blockchain
   */
  getStats() {
    const stats = {
      totalEvents: this.blockchainEvents.size,
      pendingEvents: this.pendingEvents.length,
      processedEvents: 0,
      failedEvents: 0,
      eventTypes: new Map()
    };

    for (const [id, event] of this.blockchainEvents) {
      if (event.metadata.processed) {
        stats.processedEvents++;
      } else if (event.metadata.retryCount >= 3) {
        stats.failedEvents++;
      }

      const eventType = event.eventType;
      stats.eventTypes.set(eventType, (stats.eventTypes.get(eventType) || 0) + 1);
    }

    return {
      ...stats,
      eventTypes: Object.fromEntries(stats.eventTypes)
    };
  }

  /**
   * Limpiar eventos antiguos
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupOldEvents(maxAge = 24 * 60 * 60 * 1000) { // 24 horas
    const now = Date.now();
    let cleaned = 0;

    for (const [id, event] of this.blockchainEvents) {
      if (event.metadata.processed && (now - event.metadata.processedAt) > maxAge) {
        this.blockchainEvents.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Limpiados ${cleaned} eventos blockchain antiguos`);
    }

    return cleaned;
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancia singleton
const blockchainWebhookManager = new BlockchainWebhookManager();

module.exports = blockchainWebhookManager;
