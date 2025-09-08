# 🧠 BrainSafes API Documentation

## 📋 Índice

1. [Introducción](#introducción)
2. [Configuración](#configuración)
3. [Autenticación](#autenticación)
4. [APIs de Contratos](#apis-de-contratos)
5. [Sistema de Webhooks](#sistema-de-webhooks)
6. [Webhooks Blockchain](#webhooks-blockchain)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Códigos de Error](#códigos-de-error)
9. [Rate Limiting](#rate-limiting)
10. [Monitoreo](#monitoreo)

## 🚀 Introducción

BrainSafes es un ecosistema blockchain completo que incluye:

- **Contratos Core**: Gestión de usuarios, roles y permisos
- **EDU Token**: Token nativo del ecosistema
- **Certificate NFT**: Certificados digitales verificables
- **Course NFT**: Gestión de cursos y educación
- **Job Marketplace**: Mercado de trabajo descentralizado
- **Scholarship Manager**: Gestión de becas
- **Governance**: Sistema de gobierno descentralizado
- **Bridge**: Puente cross-chain
- **AI Oracle**: Oráculos con inteligencia artificial

## ⚙️ Configuración

### Variables de Entorno Requeridas

```bash
# Redes Blockchain
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_PRIVATE_KEY=your_private_key
ARBITRUM_TESTNET_RPC_URL=https://goerli-rollup.arbitrum.io/rpc
ARBITRUM_TESTNET_PRIVATE_KEY=your_testnet_private_key

# Direcciones de Contratos
BRAINSAFES_ADDRESS=0x...
EDUTOKEN_ADDRESS=0x...
CERTIFICATE_NFT_ADDRESS=0x...
COURSE_NFT_ADDRESS=0x...
JOB_MARKETPLACE_ADDRESS=0x...
SCHOLARSHIP_MANAGER_ADDRESS=0x...
GOVERNANCE_ADDRESS=0x...
BRIDGE_ADDRESS=0x...
AI_ORACLE_ADDRESS=0x...

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=5
```

## 🔐 Autenticación

Todas las APIs requieren autenticación mediante JWT Bearer Token:

```bash
Authorization: Bearer <your_jwt_token>
```

## 📜 APIs de Contratos

### BrainSafes Core

#### Obtener Perfil de Usuario
```http
GET /api/contracts/brainSafes/profile/{network}/{userAddress}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "ipfsProfile": "Qm...",
    "reputation": "850",
    "totalEarned": "1000",
    "totalSpent": "150",
    "joinTimestamp": "1640995200",
    "isActive": true,
    "achievements": ["1", "2", "3"]
  }
}
```

#### Crear Perfil de Usuario
```http
POST /api/contracts/brainSafes/profile
```

**Body:**
```json
{
  "network": "arbitrum",
  "userAddress": "0x1234...",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "ipfsProfile": "Qm..."
}
```

#### Verificar Rol
```http
GET /api/contracts/brainSafes/role/{network}/{userAddress}/{role}
```

### EDU Token

#### Obtener Balance
```http
GET /api/contracts/eduToken/balance/{network}/{userAddress}
```

#### Transferir Tokens
```http
POST /api/contracts/eduToken/transfer
```

**Body:**
```json
{
  "network": "arbitrum",
  "fromAddress": "0x1234...",
  "toAddress": "0x5678...",
  "amount": 100
}
```

#### Mint Tokens (Admin)
```http
POST /api/contracts/eduToken/mint
```

### Certificate NFT

#### Obtener Certificados de Usuario
```http
GET /api/contracts/certificateNFT/user/{network}/{userAddress}
```

#### Emitir Certificado
```http
POST /api/contracts/certificateNFT/issue
```

**Body:**
```json
{
  "network": "arbitrum",
  "recipient": "0x1234...",
  "title": "Certificado de Blockchain",
  "description": "Certificado por completar curso de blockchain",
  "ipfsMetadata": "Qm...",
  "expiresAt": 1672531200
}
```

#### Revocar Certificado
```http
POST /api/contracts/certificateNFT/revoke
```

### Course NFT

#### Obtener Cursos de Instructor
```http
GET /api/contracts/courseNFT/instructor/{network}/{instructorAddress}
```

#### Crear Curso
```http
POST /api/contracts/courseNFT/create
```

**Body:**
```json
{
  "network": "arbitrum",
  "title": "Curso de Solidity",
  "description": "Aprende Solidity desde cero",
  "price": 50,
  "duration": 30,
  "maxStudents": 100,
  "ipfsContent": "Qm...",
  "skills": ["Solidity", "Smart Contracts"],
  "difficulty": 3
}
```

#### Inscribirse en Curso
```http
POST /api/contracts/courseNFT/enroll
```

### Job Marketplace

#### Obtener Ofertas de Trabajo
```http
GET /api/contracts/jobMarketplace/jobs/{network}
```

#### Publicar Oferta de Trabajo
```http
POST /api/contracts/jobMarketplace/post
```

**Body:**
```json
{
  "network": "arbitrum",
  "title": "Desarrollador Blockchain",
  "description": "Buscamos desarrollador experto en Solidity",
  "company": "BrainSafes",
  "location": "Remoto",
  "jobType": 0,
  "experienceLevel": 2,
  "salaryMin": 5000,
  "salaryMax": 8000,
  "requiredSkills": ["Solidity", "JavaScript"],
  "preferredCertifications": ["Blockchain Developer"],
  "requiredExperience": 24,
  "deadlineDays": 30,
  "maxApplicants": 50,
  "category": 0,
  "ipfsJobDetails": "Qm..."
}
```

#### Aplicar a Oferta
```http
POST /api/contracts/jobMarketplace/apply
```

### Scholarship Manager

#### Obtener Becas
```http
GET /api/contracts/scholarshipManager/scholarships/{network}
```

#### Crear Beca
```http
POST /api/contracts/scholarshipManager/create
```

### Governance

#### Obtener Propuestas
```http
GET /api/contracts/governance/proposals/{network}
```

#### Crear Propuesta
```http
POST /api/contracts/governance/proposal
```

#### Votar en Propuesta
```http
POST /api/contracts/governance/vote
```

### Bridge

#### Iniciar Transferencia Cross-Chain
```http
POST /api/contracts/bridge/transfer
```

### AI Oracle

#### Obtener Predicción de IA
```http
GET /api/contracts/aiOracle/prediction/{network}/{userAddress}/{predictionType}
```

#### Calcular Match de Trabajo
```http
GET /api/contracts/aiOracle/jobMatch/{network}/{candidate}/{jobId}
```

### Utilidades

#### Información de Red
```http
GET /api/contracts/network/{network}
```

#### Información de Transacción
```http
GET /api/contracts/transaction/{network}/{txHash}
```

#### Eventos de Contrato
```http
GET /api/contracts/events/{network}/{contractName}/{eventName}
```

## 🔗 Sistema de Webhooks

### Registrar Webhook
```http
POST /api/webhooks
```

**Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "secret": "your_webhook_secret",
  "events": ["user.profile_created", "token.transfer"],
  "options": {
    "timeout": 10000,
    "retries": 3,
    "headers": {
      "Custom-Header": "value"
    }
  }
}
```

### Listar Webhooks
```http
GET /api/webhooks
```

### Eliminar Webhook
```http
DELETE /api/webhooks/{id}
```

### Probar Webhook
```http
POST /api/webhooks/test
```

### Eventos Disponibles
```http
GET /api/webhooks/events
```

## ⛓️ Webhooks Blockchain

### Registrar Evento Blockchain
```http
POST /api/blockchain-webhooks/event
```

**Body:**
```json
{
  "eventType": "CertificateIssued",
  "eventData": {
    "tokenId": "123",
    "recipient": "0x1234...",
    "issuer": "0x5678...",
    "title": "Certificado de Blockchain"
  },
  "metadata": {
    "txHash": "0x...",
    "blockNumber": 12345678,
    "network": "arbitrum",
    "contractAddress": "0x..."
  }
}
```

### Obtener Eventos con Filtros
```http
GET /api/blockchain-webhooks/events?eventType=CertificateIssued&network=arbitrum&limit=10
```

### Estadísticas de Eventos
```http
GET /api/blockchain-webhooks/stats
```

### Limpiar Eventos Antiguos
```http
POST /api/blockchain-webhooks/cleanup
```

### Tipos de Eventos Disponibles
```http
GET /api/blockchain-webhooks/event-types
```

### Probar Evento
```http
POST /api/blockchain-webhooks/test
```

### Salud del Sistema
```http
GET /api/blockchain-webhooks/health
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Crear Usuario y Emitir Certificado

```javascript
// 1. Crear perfil de usuario
const createProfile = await fetch('/api/contracts/brainSafes/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    network: 'arbitrum',
    userAddress: '0x1234...',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    ipfsProfile: 'Qm...'
  })
});

// 2. Emitir certificado
const issueCertificate = await fetch('/api/contracts/certificateNFT/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    network: 'arbitrum',
    recipient: '0x1234...',
    title: 'Certificado de Blockchain',
    description: 'Certificado por completar curso',
    ipfsMetadata: 'Qm...',
    expiresAt: 1672531200
  })
});
```

### Ejemplo 2: Publicar Oferta de Trabajo y Aplicar

```javascript
// 1. Publicar oferta
const postJob = await fetch('/api/contracts/jobMarketplace/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    network: 'arbitrum',
    title: 'Desarrollador Blockchain',
    description: 'Buscamos desarrollador experto',
    company: 'BrainSafes',
    location: 'Remoto',
    jobType: 0,
    experienceLevel: 2,
    salaryMin: 5000,
    salaryMax: 8000,
    requiredSkills: ['Solidity', 'JavaScript'],
    preferredCertifications: ['Blockchain Developer'],
    requiredExperience: 24,
    deadlineDays: 30,
    maxApplicants: 50,
    category: 0,
    ipfsJobDetails: 'Qm...'
  })
});

// 2. Aplicar a oferta
const applyToJob = await fetch('/api/contracts/jobMarketplace/apply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    network: 'arbitrum',
    jobId: 1,
    coverLetter: 'Me interesa mucho esta posición...',
    resumeIPFS: 'Qm...',
    certificateTokenIds: [1, 2, 3]
  })
});
```

### Ejemplo 3: Configurar Webhook para Eventos

```javascript
// Registrar webhook para eventos de certificados
const registerWebhook = await fetch('/api/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    url: 'https://my-app.com/webhooks/certificates',
    secret: 'my_webhook_secret',
    events: ['certificate.issued', 'certificate.revoked'],
    options: {
      timeout: 10000,
      retries: 3
    }
  })
});
```

## ❌ Códigos de Error

### Errores HTTP Comunes

- `400 Bad Request`: Datos de entrada inválidos
- `401 Unauthorized`: Token de autenticación inválido o faltante
- `403 Forbidden`: Sin permisos para realizar la acción
- `404 Not Found`: Recurso no encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error interno del servidor

### Errores Específicos de Blockchain

- `CONTRACT_NOT_FOUND`: Contrato no encontrado en la red especificada
- `INSUFFICIENT_BALANCE`: Saldo insuficiente para la transacción
- `TRANSACTION_FAILED`: Transacción falló en la blockchain
- `GAS_ESTIMATION_FAILED`: Error estimando gas para la transacción
- `NETWORK_ERROR`: Error de conexión con la red blockchain

## 🚦 Rate Limiting

El sistema implementa rate limiting para proteger contra abuso:

- **APIs de Contratos**: 100 requests por 15 minutos
- **Webhooks**: 50 requests por 15 minutos
- **Autenticación**: 10 requests por 15 minutos

### Headers de Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📊 Monitoreo

### Métricas Disponibles

- **Transacciones por minuto**
- **Tasa de éxito de transacciones**
- **Tiempo de respuesta promedio**
- **Uso de gas promedio**
- **Eventos de webhook procesados**

### Endpoints de Monitoreo

```http
GET /health                    # Salud general del sistema
GET /metrics                   # Métricas Prometheus
GET /api/analytics/overview    # Resumen de analytics
GET /api/webhooks/stats        # Estadísticas de webhooks
GET /api/blockchain-webhooks/health  # Salud de webhooks blockchain
```

### Alertas Configuradas

- **Tasa de errores alta** (>5%)
- **Uptime bajo** (<95%)
- **Eventos de webhook fallidos** (>10%)
- **Transacciones fallidas** (>20%)

## 🔧 Configuración de Desarrollo

### Instalación

```bash
npm install
```

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar las variables:

```bash
cp .env.example .env
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

### Ejecutar Tests

```bash
npm test
npm run test:coverage
```

### Documentación Swagger

Acceder a la documentación interactiva en:
```
http://localhost:4000/api/docs
```

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email**: support@brainsafes.com
- **Documentación**: https://docs.brainsafes.com
- **GitHub**: https://github.com/brainsafes/api
- **Discord**: https://discord.gg/brainsafes

---

**© 2024 BrainSafes. Todos los derechos reservados.**
