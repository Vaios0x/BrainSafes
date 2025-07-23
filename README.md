# BrainSafes - Plataforma Educativa en Blockchain

BrainSafes es una plataforma educativa descentralizada construida sobre tecnología blockchain que conecta estudiantes e instructores, ofreciendo certificaciones verificables, recompensas por aprendizaje y un ecosistema completo de educación basado en Web3.

## Características Principales

- **Certificaciones Verificables**: NFTs que representan logros educativos
- **Token EDU**: Economía de tokens para incentivos y gobernanza
- **Staking y Recompensas**: Sistema de incentivos para estudiantes e instructores
- **Mercado Laboral**: Conexión entre talento certificado y oportunidades laborales
- **Procesamiento de IA**: Evaluación automatizada de trabajos y asistencia educativa
- **Becas Descentralizadas**: Financiamiento para estudiantes a través de contratos inteligentes

## Novedades: Integración con Arbitrum

BrainSafes ahora está optimizado para funcionar en la red Arbitrum, ofreciendo:

- **Menor costo de transacciones**: Aprovechando la tecnología de rollup de Arbitrum
- **Mayor velocidad**: Confirmaciones más rápidas para una mejor experiencia de usuario
- **Cross-chain messaging**: Comunicación entre Ethereum (L1) y Arbitrum (L2)
- **Optimizaciones de gas**: Funciones específicas para reducir costos en Arbitrum
- **Procesamiento por lotes**: Reducción de costos mediante operaciones agrupadas

### Mejoras Técnicas Implementadas

1. **Contratos Optimizados para Arbitrum**:
   - Uso de precompilados de Arbitrum para operaciones eficientes
   - Implementación de cross-chain messaging para tokens EDU
   - Optimizaciones específicas de gas para Arbitrum

2. **Scripts de Despliegue y Puente**:
   - Soporte para Arbitrum One (mainnet) y Arbitrum Sepolia (testnet)
   - Herramientas para puente de activos entre L1 y L2
   - Estimación de gas precisa para transacciones en Arbitrum

3. **Documentación Actualizada**:
   - Guía completa de despliegue en Arbitrum
   - Instrucciones para puente de activos
   - Solución de problemas comunes

## Arquitectura Técnica

El sistema está compuesto por varios contratos inteligentes:

- **BrainSafesArbitrum.sol**: Contrato principal optimizado para Arbitrum
- **EDUToken.sol**: Token ERC-20 con staking y recompensas
- **CertificateNFT.sol**: NFTs para certificaciones educativas
- **ScholarshipManager.sol**: Gestión de becas descentralizadas
- **JobMarketplace.sol**: Mercado laboral descentralizado
- **AIOracle.sol**: Integración con sistemas de IA para evaluaciones

## Comenzando

### Requisitos Previos

- Node.js (v14+)
- npm o yarn
- Cuenta de Ethereum con ETH para despliegue
- Metamask u otra wallet compatible

### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/yourusername/BrainSafes.git
cd BrainSafes
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus claves
```

### Despliegue en Arbitrum

Para desplegar en Arbitrum Sepolia (testnet):

```bash
npx hardhat run scripts/deploy-arbitrum.js --network arbitrumSepolia
```

Para más detalles, consulta [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Uso

### Para Estudiantes

- Inscripción en cursos
- Completar tareas y evaluaciones
- Recibir certificados NFT
- Ganar tokens EDU por aprendizaje

### Para Instructores

- Crear y publicar cursos
- Evaluar trabajos de estudiantes
- Emitir certificados
- Recibir compensación en tokens EDU

### Para Empresas

- Publicar ofertas de trabajo
- Verificar certificaciones de candidatos
- Contratar talento verificado

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee [CONTRIBUTING.md](./CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviarnos pull requests.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](./LICENSE) para más detalles.

## Contacto

- Email: info@brainsafes.com
- Twitter: [@BrainSafes](https://twitter.com/BrainSafes)
- Discord: [BrainSafes Community](https://discord.gg/brainsafes) 