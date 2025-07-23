# Guía de Despliegue de BrainSafes en Arbitrum

Esta guía proporciona instrucciones detalladas para desplegar el ecosistema BrainSafes en las redes Arbitrum One (mainnet) y Arbitrum Sepolia (testnet).

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Despliegue en Arbitrum Sepolia (Testnet)](#despliegue-en-arbitrum-sepolia-testnet)
4. [Despliegue en Arbitrum One (Mainnet)](#despliegue-en-arbitrum-one-mainnet)
5. [Verificación de Contratos](#verificación-de-contratos)
6. [Puente de Activos entre L1 y L2](#puente-de-activos-entre-l1-y-l2)
7. [Configuración Post-Despliegue](#configuración-post-despliegue)
8. [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- Node.js (v14 o superior)
- npm (v7 o superior)
- Git
- Cuenta de Infura o Alchemy
- Metamask u otra wallet compatible con Arbitrum
- ETH en la red Ethereum y Arbitrum para pagar gas

## Configuración del Entorno

1. **Clonar el repositorio**

```bash
git clone https://github.com/yourusername/BrainSafes.git
cd BrainSafes
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# Claves privadas (NO COMPARTAS ESTAS CLAVES)
PRIVATE_KEY=tu_clave_privada_aqui
ETHERSCAN_API_KEY=tu_clave_api_etherscan
ARBISCAN_API_KEY=tu_clave_api_arbiscan

# URLs de RPC
L1_RPC_URL=https://mainnet.infura.io/v3/tu_clave_infura
L2_RPC_URL_ARBITRUM_ONE=https://arb1.arbitrum.io/rpc
L2_RPC_URL_ARBITRUM_SEPOLIA=https://sepolia-rollup.arbitrum.io/rpc

# Configuración de Infura/Alchemy
INFURA_API_KEY=tu_clave_infura
ALCHEMY_API_KEY=tu_clave_alchemy

# Direcciones de contratos en L1 (si existen)
L1_CONTRACT_ADDRESS=0x...
L1_EDU_TOKEN_ADDRESS=0x...
```

4. **Compilar contratos**

```bash
npx hardhat compile
```

## Despliegue en Arbitrum Sepolia (Testnet)

1. **Asegúrate de tener ETH en Arbitrum Sepolia**

Puedes obtener ETH para testnet desde el [faucet oficial de Arbitrum](https://faucet.arbitrum.io/).

2. **Ejecutar script de despliegue para testnet**

```bash
npx hardhat run scripts/deploy-arbitrum.js --network arbitrumSepolia
```

Este comando desplegará todos los contratos en Arbitrum Sepolia y guardará las direcciones en un archivo JSON.

3. **Verificar el despliegue**

Revisa el archivo de despliegue generado (`deployment-arbitrum-sepolia-[timestamp].json`) para confirmar que todos los contratos se han desplegado correctamente.

## Despliegue en Arbitrum One (Mainnet)

> ⚠️ **ADVERTENCIA**: El despliegue en mainnet implica costos reales. Asegúrate de haber probado todo en testnet primero.

1. **Asegúrate de tener suficiente ETH en Arbitrum One**

Puedes transferir ETH desde Ethereum a Arbitrum usando el [puente oficial de Arbitrum](https://bridge.arbitrum.io/).

2. **Ejecutar script de despliegue para mainnet**

```bash
npx hardhat run scripts/deploy-arbitrum.js --network arbitrumOne
```

3. **Verificar el despliegue**

Revisa el archivo de despliegue generado (`deployment-arbitrum-mainnet-[timestamp].json`) para confirmar que todos los contratos se han desplegado correctamente.

## Verificación de Contratos

Para verificar los contratos en Arbiscan:

1. **Verificar contratos principales**

```bash
npx hardhat verify --network arbitrumSepolia DIRECCIÓN_DEL_CONTRATO
```

Reemplaza `DIRECCIÓN_DEL_CONTRATO` con la dirección del contrato que deseas verificar. Para contratos con argumentos de constructor, añade los argumentos después de la dirección.

2. **Verificar contratos proxy**

Para contratos proxy, necesitas verificar tanto el proxy como la implementación:

```bash
npx hardhat verify --network arbitrumSepolia DIRECCIÓN_DE_IMPLEMENTACIÓN
```

## Puente de Activos entre L1 y L2

Para transferir tokens entre Ethereum (L1) y Arbitrum (L2):

1. **Configurar el archivo .env para el puente**

```
# Configuración para el puente
BRIDGE_OPTION=1  # 1=ETH L1->L2, 2=ETH L2->L1, 3=EDU L1->L2, 4=EDU L2->L1
BRIDGE_AMOUNT=0.1  # Cantidad en ETH/EDU
DEPLOYMENT_FILE_PATH=./deployment-arbitrum-sepolia-[timestamp].json
```

2. **Ejecutar el script de puente**

```bash
npx hardhat run scripts/bridge-assets.js --network arbitrumSepolia
```

3. **Para finalizar un retiro de L2 a L1**

Después del período de disputa (7 días en mainnet, menos en testnet):

```
BRIDGE_OPTION=6
TX_HASH=0x...  # Hash de la transacción de retiro
```

Y ejecuta el script nuevamente:

```bash
npx hardhat run scripts/bridge-assets.js --network arbitrumSepolia
```

## Configuración Post-Despliegue

Después del despliegue, realiza las siguientes configuraciones:

1. **Configurar roles y permisos**

```bash
npx hardhat run scripts/setup-roles.js --network arbitrumSepolia
```

2. **Inicializar parámetros del sistema**

```bash
npx hardhat run scripts/initialize-system.js --network arbitrumSepolia
```

## Optimizaciones para Arbitrum

BrainSafes incluye varias optimizaciones específicas para Arbitrum:

1. **Uso de precompilados de Arbitrum**

Los contratos utilizan los precompilados de Arbitrum para operaciones más eficientes:

- `ArbSys` para información del sistema y mensajería cross-chain
- Optimizaciones de gas específicas para Arbitrum

2. **Procesamiento por lotes**

Para reducir costos de gas, se implementan funciones de procesamiento por lotes:

- `batchTransfer` para transferencias múltiples en una sola transacción
- `batchReward` para distribuir recompensas a múltiples usuarios

3. **Cross-chain messaging**

Los tokens EDU pueden transferirse entre L1 y L2 mediante:

- `bridgeToL1` para enviar tokens de L2 a L1
- `bridgeToL2` para enviar tokens de L1 a L2

## Solución de Problemas

### Problemas comunes y soluciones

1. **Error: "Nonce too high"**

Resetea la cuenta en Metamask:
- Ve a Configuración > Avanzado > Resetear Cuenta

2. **Error: "Insufficient funds for gas"**

Asegúrate de tener suficiente ETH en la red correspondiente.

3. **Error: "Contract creation failed"**

Verifica que el contrato compile correctamente y que no haya errores en el código.

4. **Error en mensajes cross-chain**

Los mensajes entre L1 y L2 pueden tardar. Para verificar el estado:

```bash
BRIDGE_OPTION=5
npx hardhat run scripts/bridge-assets.js --network arbitrumSepolia
```

### Recursos adicionales

- [Documentación oficial de Arbitrum](https://docs.arbitrum.io/)
- [Arbitrum SDK](https://github.com/OffchainLabs/arbitrum-sdk)
- [Foro de Arbitrum](https://research.arbitrum.io/)

## Contacto y Soporte

Si encuentras problemas durante el despliegue, contacta al equipo de BrainSafes:

- Email: support@brainsafes.com
- Discord: [BrainSafes Discord](https://discord.gg/brainsafes)
- GitHub Issues: [Reportar un problema](https://github.com/yourusername/BrainSafes/issues) 