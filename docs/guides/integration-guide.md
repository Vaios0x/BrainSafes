# Guía de Integración para Desarrolladores

## Introducción

Esta guía te ayudará a integrar BrainSafes en tu aplicación. Cubriremos la configuración del entorno, despliegue de contratos, integración frontend y uso de las APIs.

## Índice

1. [Configuración del Entorno](#configuración-del-entorno)
2. [Despliegue de Contratos](#despliegue-de-contratos)
3. [Integración Frontend](#integración-frontend)
4. [Uso de APIs](#uso-de-apis)
5. [Integración de IA](#integración-de-ia)
6. [Bridge Multi-chain](#bridge-multi-chain)
7. [Certificados NFT](#certificados-nft)

## Configuración del Entorno

### Requisitos Previos

```bash
# Node.js v16+ y npm
node -v
npm -v

# Hardhat y dependencias
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install --save-dev @arbitrum/sdk @arbitrum/nitro-contracts

# Dependencias frontend
npm install @brainsafes/sdk ethers react @brainsafes/react
```

### Configuración de Red

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161
    },
    arbitrumGoerli: {
      url: process.env.ARBITRUM_GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 421613
    }
  }
};
```

## Despliegue de Contratos

### Core Contracts

```bash
# Compilar contratos
npx hardhat compile

# Desplegar en Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum
```

### Script de Despliegue

```javascript
// scripts/deploy.js
async function main() {
    // Desplegar contratos core
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    const brainSafes = await BrainSafes.deploy();
    await brainSafes.deployed();
    
    // Desplegar sistema educativo
    const Education = await ethers.getContractFactory("EnhancedEducationSystem");
    const education = await Education.deploy(brainSafes.address);
    
    // Configurar roles y permisos
    await brainSafes.grantRole(ADMIN_ROLE, education.address);
    
    console.log("BrainSafes desplegado en:", brainSafes.address);
    console.log("Education System desplegado en:", education.address);
}
```

## Integración Frontend

### Configuración React

```typescript
// src/config/web3.ts
import { BrainSafesProvider } from '@brainsafes/react';

export function Web3Provider({ children }) {
    return (
        <BrainSafesProvider
            network="arbitrum"
            config={{
                rpcUrl: process.env.REACT_APP_RPC_URL,
                contracts: {
                    core: CORE_ADDRESS,
                    education: EDUCATION_ADDRESS
                }
            }}
        >
            {children}
        </BrainSafesProvider>
    );
}
```

### Hooks y Componentes

```typescript
// src/hooks/useCourses.ts
import { useBrainSafes } from '@brainsafes/react';

export function useCourses() {
    const { contracts } = useBrainSafes();
    
    const enrollInCourse = async (courseId: number) => {
        const tx = await contracts.education.enrollInCourse(courseId);
        await tx.wait();
    };
    
    return { enrollInCourse };
}
```

## Uso de APIs

### REST API

```typescript
import { BrainSafesAPI } from '@brainsafes/sdk';

const api = new BrainSafesAPI({
    apiKey: process.env.API_KEY,
    network: 'arbitrum'
});

// Obtener cursos
const courses = await api.courses.list({
    category: 'blockchain',
    page: 1,
    limit: 10
});

// Verificar certificado
const certificate = await api.certificates.verify('cert_123');
```

### WebSocket API

```typescript
import { BrainSafesWebSocket } from '@brainsafes/sdk';

const ws = new BrainSafesWebSocket({
    apiKey: process.env.API_KEY
});

// Suscribirse a eventos
ws.subscribe('course_updates', {
    courseId: 123,
    onUpdate: (data) => {
        console.log('Nueva actualización:', data);
    }
});
```

## Integración de IA

### Configuración del Procesador IA

```rust
// src/ai_processor.rs
use stylus_sdk::prelude::*;

#[derive(Debug)]
pub struct AIProcessor {
    owner: Address,
    model_configs: StorageMap<U256, ModelConfig>,
}

impl AIProcessor {
    pub fn process_inference(
        &mut self,
        model_id: U256,
        input: Vec<u8>
    ) -> Result<InferenceResult, Error> {
        // Implementación
    }
}
```

### Uso en Frontend

```typescript
// Predicción de rendimiento
const prediction = await api.ai.predictPerformance({
    studentId: '0x123...',
    courseId: 1
});

// Ruta de aprendizaje personalizada
const path = await api.ai.generateLearningPath({
    studentId: '0x123...',
    interests: ['blockchain', 'ai']
});
```

## Bridge Multi-chain

### Configuración del Bridge

```typescript
// scripts/deploy-bridge.ts
async function deployBridge() {
    const Bridge = await ethers.getContractFactory("BrainSafesBridge");
    const bridge = await Bridge.deploy(
        L1_CONTRACT,
        L2_CONTRACT,
        GATEWAY_ADDRESS
    );
    
    await bridge.initialize();
    console.log("Bridge desplegado en:", bridge.address);
}
```

### Uso del Bridge

```typescript
// Transferir certificado
const bridge = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, signer);

await bridge.bridgeCertificate(
    certificateId,
    targetChainId,
    { gasLimit: 1000000 }
);

// Escuchar eventos
bridge.on("CertificateBridged", (certificateId, fromChain, toChain) => {
    console.log(`Certificado ${certificateId} transferido`);
});
```

## Certificados NFT

### Emisión de Certificados

```typescript
// Mint certificado
const tx = await contracts.certificates.mintCertificate(
    studentAddress,
    courseId,
    {
        name: "Blockchain Developer",
        description: "Completed advanced blockchain course",
        image: "ipfs://QmHash...",
        attributes: [
            { trait_type: "Score", value: 95 },
            { trait_type: "Level", value: "Advanced" }
        ]
    }
);

// Verificar certificado
const isValid = await contracts.certificates.verifyCertificate(
    certificateId
);
```

### Integración con OpenSea

```typescript
// metadata/certificate-metadata.json
{
    "name": "BrainSafes Certificate",
    "description": "Educational achievement certificate",
    "image": "ipfs://QmHash...",
    "external_url": "https://brainsafes.com/certificates/123",
    "attributes": [
        {
            "trait_type": "Course",
            "value": "Blockchain Development"
        },
        {
            "trait_type": "Issuer",
            "value": "BrainSafes Academy"
        },
        {
            "trait_type": "Score",
            "value": 95,
            "max_value": 100
        }
    ]
}
```

## Consideraciones de Seguridad

1. **Rate Limiting**
```typescript
const rateLimiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite por IP
});
app.use('/api/', rateLimiter);
```

2. **Validación de Entrada**
```typescript
function validateCertificateData(data: any): boolean {
    if (!data.studentId || !ethers.utils.isAddress(data.studentId)) {
        throw new Error('Invalid student address');
    }
    // Más validaciones...
    return true;
}
```

3. **Manejo de Errores**
```typescript
try {
    await contracts.education.enrollInCourse(courseId);
} catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
        // Manejar error específico
    }
    throw error;
}
```

## Monitoreo y Logging

```typescript
// Configurar monitoreo
const monitor = new BrainSafesMonitor({
    contracts: {
        core: CORE_ADDRESS,
        education: EDUCATION_ADDRESS
    },
    alerts: {
        discord: DISCORD_WEBHOOK,
        email: ADMIN_EMAIL
    }
});

// Monitorear eventos
monitor.watchEvents(['CertificateIssued', 'CourseCompleted']);

// Log de transacciones
monitor.on('transaction', async (tx) => {
    await logger.log({
        type: 'transaction',
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        timestamp: Date.now()
    });
});
``` 