# Arquitectura General de BrainSafes

```mermaid
graph TD;
  User((Usuario))
  BrainSafes["BrainSafes (Core)"]
  ScholarshipManager["ScholarshipManager"]
  JobMarketplace["JobMarketplace"]
  CertificateNFT["CertificateNFT"]
  EDUToken["EDUToken"]
  AIOracle["AIOracle"]
  Cache["DistributedCache"]
  Multicall["EnhancedMulticall"]
  Compressor["AddressCompressor"]
  Security["SecurityManager"]

  User-->|Interacción|BrainSafes
  BrainSafes-->|Becas|ScholarshipManager
  BrainSafes-->|Marketplace|JobMarketplace
  BrainSafes-->|Certificados|CertificateNFT
  BrainSafes-->|Token|EDUToken
  BrainSafes-->|Oráculo IA|AIOracle
  BrainSafes-->|Cache|Cache
  BrainSafes-->|Multicall|Multicall
  BrainSafes-->|Compresión|Compressor
  BrainSafes-->|Seguridad|Security
  JobMarketplace-->|Pagos|EDUToken
  ScholarshipManager-->|Pagos|EDUToken
  CertificateNFT-->|Verificación|AIOracle
```

## Descripción
- **BrainSafes (Core):** Orquesta la lógica principal y coordina los módulos.
- **ScholarshipManager:** Gestión de becas, aplicaciones y pagos.
- **JobMarketplace:** Publicación de empleos, aplicaciones y contratos de trabajo.
- **CertificateNFT:** Emisión y verificación de certificados NFT.
- **EDUToken:** Token ERC20 para pagos, recompensas y staking.
- **AIOracle:** Oráculo de IA para predicciones, recomendaciones y validaciones.
- **DistributedCache:** Cache distribuido para resultados costosos.
- **EnhancedMulticall:** Ejecución de múltiples llamadas en batch.
- **AddressCompressor:** Compresión de direcciones para optimización de gas.
- **SecurityManager:** Gestión de roles y seguridad. 