# Troubleshooting y Preguntas Frecuentes

## Problemas comunes

### 1. Error de gas insuficiente
- **Solución:** Aumenta el gas limit en la transacción o revisa la lógica del contrato para optimización.

### 2. Error de permisos o roles
- **Solución:** Verifica que la cuenta tenga el rol adecuado usando SecurityManager.

### 3. Fallo en verificación de contrato
- **Solución:** Asegúrate de compilar con la misma versión de Solidity y configura correctamente los parámetros de verificación.

### 4. Problemas de migración o upgrade
- **Solución:** Sigue la guía de despliegue y usa scripts de migración recomendados. Haz pruebas en testnet antes de mainnet.

### 5. Oráculo no responde
- **Solución:** Verifica la conexión con el oráculo y usa mocks en tests locales. 