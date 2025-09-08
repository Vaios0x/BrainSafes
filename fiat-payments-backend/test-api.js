/**
 * @title Test API Script - BrainSafes Backend
 * @description Script para probar todas las APIs implementadas
 * @author BrainSafes Team
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuración
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TEST_NETWORK = 'arbitrumTestnet';
const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_TOKEN = 'test_jwt_token_here';

// Cliente HTTP con configuración
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Función para logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para generar datos de prueba
function generateTestData() {
  return {
    userAddress: TEST_USER_ADDRESS,
    name: 'Test User',
    email: 'test@brainsafes.com',
    ipfsProfile: 'QmTestProfileHash123456789',
    title: 'Test Certificate',
    description: 'Test certificate description',
    ipfsMetadata: 'QmTestMetadataHash123456789',
    expiresAt: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 año
    amount: 100,
    courseTitle: 'Test Course',
    courseDescription: 'Test course description',
    price: 50,
    duration: 30,
    maxStudents: 100,
    ipfsContent: 'QmTestContentHash123456789',
    skills: ['Solidity', 'JavaScript'],
    difficulty: 3,
    jobTitle: 'Test Job',
    jobDescription: 'Test job description',
    company: 'Test Company',
    location: 'Remote',
    jobType: 0,
    experienceLevel: 1,
    salaryMin: 5000,
    salaryMax: 8000,
    requiredSkills: ['Solidity'],
    preferredCertifications: ['Blockchain Developer'],
    requiredExperience: 12,
    deadlineDays: 30,
    maxApplicants: 50,
    category: 0,
    ipfsJobDetails: 'QmTestJobDetailsHash123456789',
    coverLetter: 'Test cover letter',
    resumeIPFS: 'QmTestResumeHash123456789',
    certificateTokenIds: [1, 2, 3],
    scholarshipTitle: 'Test Scholarship',
    scholarshipDescription: 'Test scholarship description',
    scholarshipAmount: 1000,
    maxRecipients: 10,
    deadline: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 días
    requirements: ['GPA > 3.5', 'Blockchain interest'],
    proposalTitle: 'Test Proposal',
    proposalDescription: 'Test proposal description',
    targets: [TEST_USER_ADDRESS],
    values: [0],
    signatures: [''],
    calldatas: ['0x'],
    proposalId: 1,
    support: true,
    reason: 'Test vote reason',
    targetNetwork: 'ethereum',
    tokenAddress: TEST_USER_ADDRESS,
    recipient: TEST_USER_ADDRESS,
    predictionType: 'performance',
    candidate: TEST_USER_ADDRESS,
    jobId: 1
  };
}

// Tests de APIs de Contratos
async function testContractAPIs() {
  log('\n🧪 Testing Contract APIs...', 'blue');
  
  const testData = generateTestData();
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Obtener perfil de usuario
  try {
    log('Testing: GET /api/contracts/brainSafes/profile/{network}/{userAddress}', 'yellow');
    const response = await apiClient.get(`/api/contracts/brainSafes/profile/${TEST_NETWORK}/${testData.userAddress}`);
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Crear perfil de usuario
  try {
    log('Testing: POST /api/contracts/brainSafes/profile', 'yellow');
    const response = await apiClient.post('/api/contracts/brainSafes/profile', {
      network: TEST_NETWORK,
      userAddress: testData.userAddress,
      name: testData.name,
      email: testData.email,
      ipfsProfile: testData.ipfsProfile
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 3: Obtener balance EDU
  try {
    log('Testing: GET /api/contracts/eduToken/balance/{network}/{userAddress}', 'yellow');
    const response = await apiClient.get(`/api/contracts/eduToken/balance/${TEST_NETWORK}/${testData.userAddress}`);
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 4: Transferir EDU tokens
  try {
    log('Testing: POST /api/contracts/eduToken/transfer', 'yellow');
    const response = await apiClient.post('/api/contracts/eduToken/transfer', {
      network: TEST_NETWORK,
      fromAddress: testData.userAddress,
      toAddress: testData.userAddress,
      amount: testData.amount
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 5: Emitir certificado
  try {
    log('Testing: POST /api/contracts/certificateNFT/issue', 'yellow');
    const response = await apiClient.post('/api/contracts/certificateNFT/issue', {
      network: TEST_NETWORK,
      recipient: testData.userAddress,
      title: testData.title,
      description: testData.description,
      ipfsMetadata: testData.ipfsMetadata,
      expiresAt: testData.expiresAt
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 6: Crear curso
  try {
    log('Testing: POST /api/contracts/courseNFT/create', 'yellow');
    const response = await apiClient.post('/api/contracts/courseNFT/create', {
      network: TEST_NETWORK,
      title: testData.courseTitle,
      description: testData.courseDescription,
      price: testData.price,
      duration: testData.duration,
      maxStudents: testData.maxStudents,
      ipfsContent: testData.ipfsContent,
      skills: testData.skills,
      difficulty: testData.difficulty
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 7: Publicar oferta de trabajo
  try {
    log('Testing: POST /api/contracts/jobMarketplace/post', 'yellow');
    const response = await apiClient.post('/api/contracts/jobMarketplace/post', {
      network: TEST_NETWORK,
      title: testData.jobTitle,
      description: testData.jobDescription,
      company: testData.company,
      location: testData.location,
      jobType: testData.jobType,
      experienceLevel: testData.experienceLevel,
      salaryMin: testData.salaryMin,
      salaryMax: testData.salaryMax,
      requiredSkills: testData.requiredSkills,
      preferredCertifications: testData.preferredCertifications,
      requiredExperience: testData.requiredExperience,
      deadlineDays: testData.deadlineDays,
      maxApplicants: testData.maxApplicants,
      category: testData.category,
      ipfsJobDetails: testData.ipfsJobDetails
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 8: Crear beca
  try {
    log('Testing: POST /api/contracts/scholarshipManager/create', 'yellow');
    const response = await apiClient.post('/api/contracts/scholarshipManager/create', {
      network: TEST_NETWORK,
      title: testData.scholarshipTitle,
      description: testData.scholarshipDescription,
      amount: testData.scholarshipAmount,
      maxRecipients: testData.maxRecipients,
      deadline: testData.deadline,
      requirements: testData.requirements
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 9: Crear propuesta de gobierno
  try {
    log('Testing: POST /api/contracts/governance/proposal', 'yellow');
    const response = await apiClient.post('/api/contracts/governance/proposal', {
      network: TEST_NETWORK,
      title: testData.proposalTitle,
      description: testData.proposalDescription,
      targets: testData.targets,
      values: testData.values,
      signatures: testData.signatures,
      calldatas: testData.calldatas
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 10: Iniciar transferencia bridge
  try {
    log('Testing: POST /api/contracts/bridge/transfer', 'yellow');
    const response = await apiClient.post('/api/contracts/bridge/transfer', {
      network: TEST_NETWORK,
      targetNetwork: testData.targetNetwork,
      tokenAddress: testData.tokenAddress,
      amount: testData.amount,
      recipient: testData.recipient
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 11: Obtener predicción de IA
  try {
    log('Testing: GET /api/contracts/aiOracle/prediction/{network}/{userAddress}/{predictionType}', 'yellow');
    const response = await apiClient.get(`/api/contracts/aiOracle/prediction/${TEST_NETWORK}/${testData.userAddress}/${testData.predictionType}`);
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 12: Información de red
  try {
    log('Testing: GET /api/contracts/network/{network}', 'yellow');
    const response = await apiClient.get(`/api/contracts/network/${TEST_NETWORK}`);
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 Contract APIs Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Tests de Webhooks
async function testWebhooks() {
  log('\n🔗 Testing Webhooks...', 'blue');
  
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Registrar webhook
  try {
    log('Testing: POST /api/webhooks', 'yellow');
    const response = await apiClient.post('/api/webhooks', {
      url: 'https://test-webhook.com/webhook',
      secret: 'test_secret',
      events: ['user.profile_created', 'token.transfer'],
      options: {
        timeout: 10000,
        retries: 3
      }
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Listar webhooks
  try {
    log('Testing: GET /api/webhooks', 'yellow');
    const response = await apiClient.get('/api/webhooks');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 3: Eventos disponibles
  try {
    log('Testing: GET /api/webhooks/events', 'yellow');
    const response = await apiClient.get('/api/webhooks/events');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 Webhooks Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Tests de Webhooks Blockchain
async function testBlockchainWebhooks() {
  log('\n⛓️ Testing Blockchain Webhooks...', 'blue');
  
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Registrar evento blockchain
  try {
    log('Testing: POST /api/blockchain-webhooks/event', 'yellow');
    const response = await apiClient.post('/api/blockchain-webhooks/event', {
      eventType: 'CertificateIssued',
      eventData: {
        tokenId: '123',
        recipient: TEST_USER_ADDRESS,
        issuer: TEST_USER_ADDRESS,
        title: 'Test Certificate'
      },
      metadata: {
        txHash: '0x' + '0'.repeat(64),
        blockNumber: 12345678,
        network: TEST_NETWORK,
        contractAddress: TEST_USER_ADDRESS
      }
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Obtener eventos
  try {
    log('Testing: GET /api/blockchain-webhooks/events', 'yellow');
    const response = await apiClient.get('/api/blockchain-webhooks/events');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 3: Estadísticas
  try {
    log('Testing: GET /api/blockchain-webhooks/stats', 'yellow');
    const response = await apiClient.get('/api/blockchain-webhooks/stats');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 4: Tipos de eventos
  try {
    log('Testing: GET /api/blockchain-webhooks/event-types', 'yellow');
    const response = await apiClient.get('/api/blockchain-webhooks/event-types');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 5: Salud del sistema
  try {
    log('Testing: GET /api/blockchain-webhooks/health', 'yellow');
    const response = await apiClient.get('/api/blockchain-webhooks/health');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 Blockchain Webhooks Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Tests de IPFS
async function testIPFS() {
  log('\n🌐 Testing IPFS APIs...', 'blue');
  
  const testData = generateTestData();
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Subir archivo
  try {
    log('Testing: POST /api/ipfs/upload', 'yellow');
    const formData = new FormData();
    formData.append('file', Buffer.from('Test file content'), 'test.txt');
    formData.append('pin', 'true');
    
    const response = await apiClient.post('/api/ipfs/upload', formData, {
      headers: formData.getHeaders()
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Subir metadata
  try {
    log('Testing: POST /api/ipfs/upload-metadata', 'yellow');
    const response = await apiClient.post('/api/ipfs/upload-metadata', {
      metadata: {
        name: 'Test NFT',
        description: 'Test NFT Description',
        attributes: []
      },
      name: 'test-metadata.json',
      pin: true
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 3: Subir NFT
  try {
    log('Testing: POST /api/ipfs/upload-nft', 'yellow');
    const formData = new FormData();
    formData.append('image', Buffer.from('fake image data'), 'test-image.png');
    formData.append('name', 'Test NFT');
    formData.append('description', 'Test NFT Description');
    
    const response = await apiClient.post('/api/ipfs/upload-nft', formData, {
      headers: formData.getHeaders()
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 4: Obtener estadísticas IPFS
  try {
    log('Testing: GET /api/ipfs/stats', 'yellow');
    const response = await apiClient.get('/api/ipfs/stats');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 IPFS Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Tests de Notificaciones
async function testNotifications() {
  log('\n🔔 Testing Notifications APIs...', 'blue');
  
  const testData = generateTestData();
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Obtener notificaciones
  try {
    log('Testing: GET /api/notifications', 'yellow');
    const response = await apiClient.get('/api/notifications', {
      params: { wallet: testData.userAddress }
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Enviar notificación
  try {
    log('Testing: POST /api/notifications/send', 'yellow');
    const response = await apiClient.post('/api/notifications/send', {
      type: 'welcome',
      recipient: 'test@example.com',
      channels: ['email', 'in-app'],
      data: {
        name: 'Test User',
        walletAddress: testData.userAddress
      }
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 3: Obtener notificaciones in-app
  try {
    log('Testing: GET /api/notifications/in-app', 'yellow');
    const response = await apiClient.get('/api/notifications/in-app', {
      params: { userId: testData.userAddress }
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 4: Obtener templates
  try {
    log('Testing: GET /api/notifications/templates', 'yellow');
    const response = await apiClient.get('/api/notifications/templates');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 5: Obtener estadísticas
  try {
    log('Testing: GET /api/notifications/stats', 'yellow');
    const response = await apiClient.get('/api/notifications/stats');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 6: Enviar notificaciones en lote
  try {
    log('Testing: POST /api/notifications/bulk', 'yellow');
    const response = await apiClient.post('/api/notifications/bulk', {
      notifications: [
        {
          type: 'course_enrolled',
          recipient: 'user1@example.com',
          channels: ['email'],
          data: { courseTitle: 'Test Course' }
        },
        {
          type: 'certificate_issued',
          recipient: 'user2@example.com',
          channels: ['email'],
          data: { certificateTitle: 'Test Certificate' }
        }
      ]
    });
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 Notifications Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Tests de Utilidades
async function testUtilities() {
  log('\n🔧 Testing Utilities...', 'blue');
  
  let successCount = 0;
  let totalTests = 0;

  // Test 1: Health check
  try {
    log('Testing: GET /health', 'yellow');
    const response = await apiClient.get('/health');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  // Test 2: Metrics
  try {
    log('Testing: GET /metrics', 'yellow');
    const response = await apiClient.get('/metrics');
    log(`✅ Success: ${response.status}`, 'green');
    successCount++;
  } catch (error) {
    log(`❌ Error: ${error.response?.status || error.message}`, 'red');
  }
  totalTests++;

  log(`\n📊 Utilities Test Results: ${successCount}/${totalTests} passed`, successCount === totalTests ? 'green' : 'yellow');
  return { successCount, totalTests };
}

// Función principal
async function runAllTests() {
  log('🧠 BrainSafes API Test Suite', 'blue');
  log('================================', 'blue');
  
  const startTime = Date.now();
  
  try {
    // Ejecutar todos los tests
    const contractResults = await testContractAPIs();
    const webhookResults = await testWebhooks();
    const blockchainWebhookResults = await testBlockchainWebhooks();
    const ipfsResults = await testIPFS();
    const notificationResults = await testNotifications();
    const utilityResults = await testUtilities();
    
    // Calcular resultados totales
    const totalSuccess = contractResults.successCount + webhookResults.successCount + 
                        blockchainWebhookResults.successCount + ipfsResults.successCount +
                        notificationResults.successCount + utilityResults.successCount;
    const totalTests = contractResults.totalTests + webhookResults.totalTests + 
                      blockchainWebhookResults.totalTests + ipfsResults.totalTests +
                      notificationResults.totalTests + utilityResults.totalTests;
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Mostrar resumen final
    log('\n📋 Test Summary', 'blue');
    log('===============', 'blue');
    log(`Contract APIs: ${contractResults.successCount}/${contractResults.totalTests}`, 
        contractResults.successCount === contractResults.totalTests ? 'green' : 'yellow');
    log(`Webhooks: ${webhookResults.successCount}/${webhookResults.totalTests}`, 
        webhookResults.successCount === webhookResults.totalTests ? 'green' : 'yellow');
    log(`Blockchain Webhooks: ${blockchainWebhookResults.successCount}/${blockchainWebhookResults.totalTests}`, 
        blockchainWebhookResults.successCount === blockchainWebhookResults.totalTests ? 'green' : 'yellow');
    log(`IPFS: ${ipfsResults.successCount}/${ipfsResults.totalTests}`, 
        ipfsResults.successCount === ipfsResults.totalTests ? 'green' : 'yellow');
    log(`Notifications: ${notificationResults.successCount}/${notificationResults.totalTests}`, 
        notificationResults.successCount === notificationResults.totalTests ? 'green' : 'yellow');
    log(`Utilities: ${utilityResults.successCount}/${utilityResults.totalTests}`, 
        utilityResults.successCount === utilityResults.totalTests ? 'green' : 'yellow');
    log(`\nTotal: ${totalSuccess}/${totalTests} tests passed`, 
        totalSuccess === totalTests ? 'green' : 'yellow');
    log(`Duration: ${duration.toFixed(2)} seconds`, 'blue');
    
    if (totalSuccess === totalTests) {
      log('\n🎉 All tests passed! The BrainSafes API is working correctly.', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed. Please check the implementation.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Test suite failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testContractAPIs,
  testWebhooks,
  testBlockchainWebhooks,
  testIPFS,
  testNotifications,
  testUtilities,
  runAllTests
};
