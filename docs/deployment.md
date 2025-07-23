# Guía de Despliegue y Migración

## Requisitos previos
- Node.js >= 18
- Hardhat
- Wallet con fondos en testnet/mainnet
- Variables de entorno configuradas

## Despliegue en Arbitrum Testnet/Mainnet
1. Clona el repositorio y navega al directorio.
2. Instala dependencias:
   ```bash
   npm ci
   ```
3. Configura `.env` con las claves y endpoints necesarios.
4. Despliega contratos:
   ```bash
   npx hardhat run scripts/deploy-arbitrum.js --network arbitrum-sepolia
   ```
5. Verifica contratos:
   ```bash
   npx hardhat verify --network arbitrum-sepolia <address> <constructor_args>
   ```

## Migración y upgrades
- Usa los scripts de migración y Hardhat Upgrades para actualizar contratos.
- Haz pruebas exhaustivas en testnet antes de migrar a mainnet.

## Troubleshooting
- Consulta `docs/troubleshooting.md` para problemas comunes. 