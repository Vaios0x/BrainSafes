const { ethers } = require('ethers');
const winston = require('winston');
const webhookManager = require('./webhookManager');

class BlockchainEventListener {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/blockchain-events.log' })
      ],
    });

    // Configuración de providers
    this.providers = new Map();
    this.contracts = new Map();
    this.eventFilters = new Map();
    this.isListening = false;
    this.lastProcessedBlock = new Map();

    // Configurar providers
    this.setupProviders();
  }

  /**
   * Configurar providers para diferentes redes
   */
  setupProviders() {
    const networks = {
      arbitrum: {
        rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
        name: 'Arbitrum One'
      },
      arbitrumTestnet: {
        rpc: process.env.ARBITRUM_TESTNET_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
        chainId: 421613,
        name: 'Arbitrum Goerli'
      },
      ethereum: {
        rpc: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
        chainId: 1,
        name: 'Ethereum Mainnet'
      }
    };

    for (const [network, config] of Object.entries(networks)) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        this.providers.set(network, {
          provider,
          config,
          lastBlock: 0
        });
        this.logger.info(`Provider configurado para ${config.name}`);
      } catch (error) {
        this.logger.error(`Error configurando provider para ${network}:`, error.message);
      }
    }
  }

  /**
   * Agregar contrato para escuchar eventos
   * @param {string} network - Red del contrato
   * @param {string} contractAddress - Dirección del contrato
   * @param {Array} abi - ABI del contrato
   * @param {Object} options - Opciones adicionales
   */
  addContract(network, contractAddress, abi, options = {}) {
    const providerData = this.providers.get(network);
    if (!providerData) {
      throw new Error(`Provider no encontrado para la red: ${network}`);
    }

    const contract = new ethers.Contract(contractAddress, abi, providerData.provider);
    const contractId = `${network}:${contractAddress}`;

    this.contracts.set(contractId, {
      contract,
      network,
      address: contractAddress,
      abi,
      options: {
        fromBlock: options.fromBlock || 'latest',
        confirmations: options.confirmations || 1,
        ...options
      }
    });

    this.logger.info(`Contrato agregado: ${contractId}`);
    return contractId;
  }

  /**
   * Configurar filtros de eventos para un contrato
   * @param {string} contractId - ID del contrato
   * @param {Array} eventNames - Nombres de eventos a escuchar
   */
  setupEventFilters(contractId, eventNames) {
    const contractData = this.contracts.get(contractId);
    if (!contractData) {
      throw new Error(`Contrato no encontrado: ${contractId}`);
    }

    const filters = [];
    
    for (const eventName of eventNames) {
      try {
        const filter = contractData.contract.filters[eventName]();
        filters.push({
          eventName,
          filter,
          contractId
        });
        this.logger.info(`Filtro configurado para evento ${eventName} en ${contractId}`);
      } catch (error) {
        this.logger.error(`Error configurando filtro para ${eventName}:`, error.message);
      }
    }

    this.eventFilters.set(contractId, filters);
  }

  /**
   * Iniciar escucha de eventos
   */
  async startListening() {
    if (this.isListening) {
      this.logger.warn('Ya se está escuchando eventos blockchain');
      return;
    }

    this.isListening = true;
    this.logger.info('Iniciando escucha de eventos blockchain');

    // Configurar listeners para cada contrato
    for (const [contractId, contractData] of this.contracts) {
      await this.setupContractListener(contractId, contractData);
    }

    // Configurar listeners para eventos específicos
    this.setupSpecificEventListeners();
  }

  /**
   * Configurar listener para un contrato específico
   * @param {string} contractId - ID del contrato
   * @param {Object} contractData - Datos del contrato
   */
  async setupContractListener(contractId, contractData) {
    const filters = this.eventFilters.get(contractId) || [];
    
    for (const filterData of filters) {
      try {
        contractData.contract.on(filterData.filter, async (...args) => {
          await this.handleEvent(contractId, filterData.eventName, args);
        });

        this.logger.info(`Listener configurado para ${filterData.eventName} en ${contractId}`);
      } catch (error) {
        this.logger.error(`Error configurando listener para ${filterData.eventName}:`, error.message);
      }
    }
  }

  /**
   * Configurar listeners para eventos específicos de BrainSafes
   */
  setupSpecificEventListeners() {
    // Eventos de usuarios
    this.setupUserEventListeners();
    
    // Eventos de cursos
    this.setupCourseEventListeners();
    
    // Eventos de certificados
    this.setupCertificateEventListeners();
    
    // Eventos de gobierno
    this.setupGovernanceEventListeners();
    
    // Eventos de marketplace
    this.setupMarketplaceEventListeners();
    
    // Eventos de bridge
    this.setupBridgeEventListeners();
  }

  /**
   * Configurar listeners para eventos de usuarios
   */
  setupUserEventListeners() {
    const userEvents = [
      'UserRegistered',
      'ProfileUpdated',
      'AchievementUnlocked',
      'RewardDistributed'
    ];

    for (const eventName of userEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseUserEvent(eventName, args);
        await webhookManager.sendEvent(`user.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Configurar listeners para eventos de cursos
   */
  setupCourseEventListeners() {
    const courseEvents = [
      'CourseCreated',
      'StudentEnrolled',
      'CourseCompleted',
      'CourseUpdated'
    ];

    for (const eventName of courseEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseCourseEvent(eventName, args);
        await webhookManager.sendEvent(`course.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Configurar listeners para eventos de certificados
   */
  setupCertificateEventListeners() {
    const certificateEvents = [
      'CertificateIssued',
      'CertificateRevoked',
      'CertificateTransferred'
    ];

    for (const eventName of certificateEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseCertificateEvent(eventName, args);
        await webhookManager.sendEvent(`certificate.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Configurar listeners para eventos de gobierno
   */
  setupGovernanceEventListeners() {
    const governanceEvents = [
      'ProposalCreated',
      'VoteCast',
      'ProposalExecuted',
      'ProposalCanceled'
    ];

    for (const eventName of governanceEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseGovernanceEvent(eventName, args);
        await webhookManager.sendEvent(`governance.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Configurar listeners para eventos de marketplace
   */
  setupMarketplaceEventListeners() {
    const marketplaceEvents = [
      'JobPosted',
      'ApplicationSubmitted',
      'JobCompleted',
      'PaymentProcessed'
    ];

    for (const eventName of marketplaceEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseMarketplaceEvent(eventName, args);
        await webhookManager.sendEvent(`marketplace.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Configurar listeners para eventos de bridge
   */
  setupBridgeEventListeners() {
    const bridgeEvents = [
      'TransferInitiated',
      'TransferCompleted',
      'TransferFailed',
      'MessageSent'
    ];

    for (const eventName of bridgeEvents) {
      this.registerEventProcessor(eventName, async (contractId, args) => {
        const eventData = this.parseBridgeEvent(eventName, args);
        await webhookManager.sendEvent(`bridge.${eventName.toLowerCase()}`, eventData, {
          contractId,
          network: this.getNetworkFromContractId(contractId)
        });
      });
    }
  }

  /**
   * Registrar procesador de eventos
   * @param {string} eventName - Nombre del evento
   * @param {Function} processor - Función procesadora
   */
  registerEventProcessor(eventName, processor) {
    if (!this.eventProcessors) {
      this.eventProcessors = new Map();
    }
    this.eventProcessors.set(eventName, processor);
  }

  /**
   * Manejar evento recibido
   * @param {string} contractId - ID del contrato
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   */
  async handleEvent(contractId, eventName, args) {
    try {
      this.logger.info(`Evento recibido: ${eventName} en ${contractId}`);

      // Procesar evento específico si existe procesador
      const processor = this.eventProcessors?.get(eventName);
      if (processor) {
        await processor(contractId, args);
      }

      // Enviar evento genérico
      const eventData = {
        contractId,
        eventName,
        args: this.serializeArgs(args),
        timestamp: Date.now(),
        blockNumber: args[args.length - 1]?.blockNumber,
        transactionHash: args[args.length - 1]?.transactionHash
      };

      await webhookManager.sendEvent('blockchain.event', eventData, {
        contractId,
        network: this.getNetworkFromContractId(contractId)
      });

    } catch (error) {
      this.logger.error(`Error procesando evento ${eventName}:`, error.message);
    }
  }

  /**
   * Serializar argumentos del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Array} Argumentos serializados
   */
  serializeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        if (arg._isBigNumber) {
          return arg.toString();
        }
        if (arg.toJSON) {
          return arg.toJSON();
        }
        return JSON.parse(JSON.stringify(arg));
      }
      return arg;
    });
  }

  /**
   * Obtener red desde ID del contrato
   * @param {string} contractId - ID del contrato
   * @returns {string} Nombre de la red
   */
  getNetworkFromContractId(contractId) {
    return contractId.split(':')[0];
  }

  /**
   * Parsear evento de usuario
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseUserEvent(eventName, args) {
    switch (eventName) {
      case 'UserRegistered':
        return {
          user: args[0],
          name: args[1],
          timestamp: args[2]?.toString()
        };
      case 'ProfileUpdated':
        return {
          user: args[0],
          newScore: args[1]?.toString()
        };
      case 'AchievementUnlocked':
        return {
          user: args[0],
          achievementId: args[1]?.toString(),
          reward: args[2]?.toString()
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Parsear evento de curso
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseCourseEvent(eventName, args) {
    switch (eventName) {
      case 'CourseCreated':
        return {
          courseId: args[0]?.toString(),
          instructor: args[1],
          title: args[2],
          price: args[3]?.toString()
        };
      case 'StudentEnrolled':
        return {
          courseId: args[0]?.toString(),
          student: args[1],
          timestamp: args[2]?.toString()
        };
      case 'CourseCompleted':
        return {
          courseId: args[0]?.toString(),
          student: args[1],
          score: args[2]?.toString(),
          certificateIssued: args[3]
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Parsear evento de certificado
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseCertificateEvent(eventName, args) {
    switch (eventName) {
      case 'CertificateIssued':
        return {
          tokenId: args[0]?.toString(),
          student: args[1],
          courseId: args[2]?.toString(),
          issuer: args[3]
        };
      case 'CertificateRevoked':
        return {
          tokenId: args[0]?.toString(),
          reason: args[1]
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Parsear evento de gobierno
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseGovernanceEvent(eventName, args) {
    switch (eventName) {
      case 'ProposalCreated':
        return {
          proposalId: args[0]?.toString(),
          proposer: args[1],
          description: args[2]
        };
      case 'VoteCast':
        return {
          proposalId: args[0]?.toString(),
          voter: args[1],
          support: args[2],
          weight: args[3]?.toString()
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Parsear evento de marketplace
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseMarketplaceEvent(eventName, args) {
    switch (eventName) {
      case 'JobPosted':
        return {
          jobId: args[0]?.toString(),
          employer: args[1],
          title: args[2],
          salary: args[3]?.toString()
        };
      case 'ApplicationSubmitted':
        return {
          jobId: args[0]?.toString(),
          applicant: args[1],
          applicationId: args[2]?.toString()
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Parsear evento de bridge
   * @param {string} eventName - Nombre del evento
   * @param {Array} args - Argumentos del evento
   * @returns {Object} Datos del evento
   */
  parseBridgeEvent(eventName, args) {
    switch (eventName) {
      case 'TransferInitiated':
        return {
          transferId: args[0]?.toString(),
          from: args[1],
          to: args[2],
          amount: args[3]?.toString(),
          fromChain: args[4]?.toString(),
          toChain: args[5]?.toString()
        };
      case 'TransferCompleted':
        return {
          transferId: args[0]?.toString(),
          status: args[1]
        };
      default:
        return { args: this.serializeArgs(args) };
    }
  }

  /**
   * Detener escucha de eventos
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    
    // Remover todos los listeners
    for (const [contractId, contractData] of this.contracts) {
      contractData.contract.removeAllListeners();
    }

    this.logger.info('Escucha de eventos blockchain detenida');
  }

  /**
   * Obtener estadísticas de eventos
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      isListening: this.isListening,
      totalContracts: this.contracts.size,
      totalEventFilters: Array.from(this.eventFilters.values()).flat().length,
      networks: Array.from(this.providers.keys()),
      lastProcessedBlocks: Object.fromEntries(this.lastProcessedBlock)
    };
  }
}

// Instancia singleton
const blockchainEventListener = new BlockchainEventListener();

module.exports = blockchainEventListener;
