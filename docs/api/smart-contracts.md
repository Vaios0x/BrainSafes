# BrainSafes Smart Contracts API

## Core Contracts

### BrainSafes.sol

Principal contrato del sistema que maneja la lógica core.

#### Funciones Públicas

```solidity
function registerUser(
    string memory _name,
    string memory _email,
    string memory _ipfsProfile
) external whenNotPaused
```
Registra un nuevo usuario en la plataforma.
- **Parámetros**:
  - `_name`: Nombre del usuario
  - `_email`: Email del usuario
  - `_ipfsProfile`: Hash IPFS del perfil
- **Eventos emitidos**: `UserRegistered`

```solidity
function enrollInCourse(uint256 courseId) 
    external 
    payable 
    onlyValidUser(msg.sender) 
    onlyActiveCourse(courseId) 
    whenNotPaused
```
Inscribe a un usuario en un curso.
- **Parámetros**:
  - `courseId`: ID del curso
- **Eventos emitidos**: `StudentEnrolled`

### EnhancedEducationSystem.sol

Sistema educativo avanzado con funcionalidades de IA.

#### Funciones Públicas

```solidity
function verifyCrosschainCertificate(
    uint256 certificateId,
    bytes32 l1Hash,
    bytes32 l2Hash,
    bytes calldata proof
) external returns (bool)
```
Verifica un certificado cross-chain.
- **Parámetros**:
  - `certificateId`: ID del certificado
  - `l1Hash`: Hash en L1
  - `l2Hash`: Hash en L2
  - `proof`: Prueba de validez
- **Retorna**: `bool` - Éxito de la verificación

## AI & Oracle Contracts

### AIOracle.sol

Oráculo de IA para predicciones y verificaciones.

#### Funciones Públicas

```solidity
function predictStudentPerformance(
    address student,
    uint256 courseId
) external view returns (uint256)
```
Predice el rendimiento de un estudiante.
- **Parámetros**:
  - `student`: Dirección del estudiante
  - `courseId`: ID del curso
- **Retorna**: `uint256` - Predicción de rendimiento (0-100)

### MultiOracle.sol

Agregador de múltiples oráculos.

```solidity
function receiveOracleResponse(
    address oracle,
    bytes32 dataKey,
    uint256 value
) external onlyRole(ORACLE_MANAGER_ROLE)
```
Recibe y procesa respuestas de oráculos.
- **Parámetros**:
  - `oracle`: Dirección del oráculo
  - `dataKey`: Clave de datos
  - `value`: Valor reportado

## Bridge Contracts

### BrainSafesBridge.sol

Sistema de puentes para interoperabilidad.

```solidity
function bridgeCertificate(
    uint256 certificateId,
    uint256 targetChainId
) external nonReentrant whenNotPaused
```
Transfiere un certificado entre cadenas.
- **Parámetros**:
  - `certificateId`: ID del certificado
  - `targetChainId`: ID de la cadena destino

## Optimization Contracts

### AddressCompressor.sol

Optimización de almacenamiento de direcciones.

```solidity
function compressAddress(
    address addr
) external returns (uint256)
```
Comprime una dirección para optimizar almacenamiento.
- **Parámetros**:
  - `addr`: Dirección a comprimir
- **Retorna**: `uint256` - Dirección comprimida

## Governance Contracts

### BrainSafesGovernance.sol

Sistema de gobernanza del protocolo.

```solidity
function createProposal(
    string memory title,
    string memory description,
    address target,
    uint256 value,
    bytes memory data
) external returns (uint256)
```
Crea una nueva propuesta de gobernanza.
- **Parámetros**:
  - `title`: Título de la propuesta
  - `description`: Descripción detallada
  - `target`: Contrato objetivo
  - `value`: Valor en ETH
  - `data`: Datos de la llamada
- **Retorna**: `uint256` - ID de la propuesta

## Eventos Principales

```solidity
event UserRegistered(
    address indexed user,
    string name,
    uint256 timestamp
);

event CourseCompleted(
    uint256 indexed courseId,
    address indexed student,
    uint256 score,
    bool certificateIssued
);

event CertificateVerified(
    uint256 indexed certificateId,
    address indexed recipient
);

event AIInsightUpdated(
    address indexed user,
    uint256 performancePrediction
);
```

## Uso con Web3.js/Ethers.js

```javascript
// Ejemplo de uso con ethers.js
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = provider.getSigner();

// Conectar al contrato principal
const brainSafes = new ethers.Contract(
    BRAINSAFES_ADDRESS,
    BRAINSAFES_ABI,
    signer
);

// Registrar usuario
await brainSafes.registerUser(
    "John Doe",
    "john@example.com",
    "ipfs://QmHash..."
);

// Inscribirse en un curso
await brainSafes.enrollInCourse(courseId, {
    value: ethers.utils.parseEther("1.0")
});

// Escuchar eventos
brainSafes.on("CourseCompleted", 
    (courseId, student, score, certificateIssued) => {
    console.log(`Course ${courseId} completed by ${student}`);
});
```

## Consideraciones de Seguridad

1. **Rate Limiting**
   - Implementar límites de llamadas
   - Prevenir spam de transacciones

2. **Validación de Entrada**
   - Verificar rangos válidos
   - Sanitizar strings
   - Validar direcciones

3. **Control de Acceso**
   - Roles específicos
   - Modificadores de permisos
   - Timelock para acciones críticas

4. **Gas Optimization**
   - Batch processing
   - Storage packing
   - Caching de datos

## Integración con Arbitrum

```solidity
// Ejemplo de uso de precompilados Arbitrum
ArbSys constant arbsys = ArbSys(address(0x64));
ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));

// Enviar mensaje a L1
function sendToL1(bytes memory data) external {
    arbsys.sendTxToL1(L1_CONTRACT, data);
}

// Obtener información de gas
function getL2GasPrice() external view returns (uint256) {
    return arbGasInfo.getL2BaseFee();
}
``` 