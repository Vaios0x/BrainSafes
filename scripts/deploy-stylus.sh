#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Iniciando despliegue de contratos Stylus...${NC}"

# Verificar requisitos
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: Cargo no está instalado${NC}"
    exit 1
fi

if ! command -v rustc &> /dev/null; then
    echo -e "${RED}Error: Rust no está instalado${NC}"
    exit 1
fi

if ! command -v cargo-stylus &> /dev/null; then
    echo -e "${YELLOW}Instalando cargo-stylus...${NC}"
    cargo install --force cargo-stylus
fi

# Configurar toolchain de Rust
echo -e "${YELLOW}Configurando toolchain de Rust...${NC}"
rustup default 1.70.0
rustup target add wasm32-unknown-unknown

# Compilar contrato
echo -e "${YELLOW}Compilando contrato AIProcessor...${NC}"
cd contracts/ai
cargo build --target wasm32-unknown-unknown --release

# Verificar compilación
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Falló la compilación${NC}"
    exit 1
fi

# Verificar contrato
echo -e "${YELLOW}Verificando contrato...${NC}"
cargo stylus check

# Exportar ABI
echo -e "${YELLOW}Exportando ABI...${NC}"
cargo stylus export-abi > ../../artifacts/AIProcessor.json

# Estimar gas
echo -e "${YELLOW}Estimando gas de despliegue...${NC}"
ESTIMATED_GAS=$(cargo stylus deploy --dry-run | grep "Estimated gas:" | cut -d':' -f2)
echo -e "Gas estimado: ${ESTIMATED_GAS}"

# Desplegar contrato
echo -e "${YELLOW}Desplegando contrato...${NC}"
cargo stylus deploy --private-key $PRIVATE_KEY

# Verificar despliegue
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Falló el despliegue${NC}"
    exit 1
fi

# Obtener dirección del contrato
CONTRACT_ADDRESS=$(cargo stylus info | grep "Contract address:" | cut -d':' -f2)
echo -e "${GREEN}Contrato desplegado en: ${CONTRACT_ADDRESS}${NC}"

# Verificar contrato en Arbiscan
echo -e "${YELLOW}Verificando contrato en Arbiscan...${NC}"
cargo stylus verify --address $CONTRACT_ADDRESS

echo -e "${GREEN}¡Despliegue completado exitosamente!${NC}"

# Guardar información del despliegue
echo -e "${YELLOW}Guardando información del despliegue...${NC}"
cat > ../../deployments/stylus.json << EOF
{
    "network": "arbitrum",
    "contracts": {
        "AIProcessor": {
            "address": "${CONTRACT_ADDRESS}",
            "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
            "version": "$(cargo pkgid | cut -d'#' -f2)",
            "compiler": "$(rustc --version)"
        }
    }
}
EOF

echo -e "${GREEN}Información del despliegue guardada en deployments/stylus.json${NC}" 