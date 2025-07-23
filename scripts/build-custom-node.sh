#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Iniciando construcción del nodo personalizado BrainSafes...${NC}"

# Verificar requisitos
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git no está instalado${NC}"
    exit 1
fi

# Clonar repositorio Nitro
echo -e "${YELLOW}Clonando repositorio Nitro...${NC}"
git clone --branch v3.6.5 https://github.com/OffchainLabs/nitro.git
cd nitro
git submodule update --init --recursive --force

# Copiar archivos personalizados
echo -e "${YELLOW}Copiando archivos personalizados...${NC}"
cp ../contracts/core/BrainSafesCustomSTF.sol .
cp ../config/nodeConfig.json .

# Construir imagen de desarrollo
echo -e "${YELLOW}Construyendo imagen de desarrollo...${NC}"
docker build . --target nitro-node-dev --tag brainsafes-node-dev

# Extraer WASM module root
echo -e "${YELLOW}Extrayendo WASM module root...${NC}"
docker run --rm --entrypoint cat brainsafes-node-dev target/machines/latest/module-root.txt > module-root.txt
WASM_MODULE_ROOT=$(cat module-root.txt)

echo -e "${GREEN}WASM Module Root: ${WASM_MODULE_ROOT}${NC}"

# Extraer binarios de replay
echo -e "${YELLOW}Extrayendo binarios de replay...${NC}"
docker run --rm --name replay-binary-extractor --entrypoint sleep brainsafes-node-dev infinity &
CONTAINER_ID=$!

sleep 5

docker cp replay-binary-extractor:/home/user/target/machines/latest extracted-replay-binary
docker stop $CONTAINER_ID

mkdir -p "target/machines/${WASM_MODULE_ROOT}"
mv extracted-replay-binary/* "target/machines/${WASM_MODULE_ROOT}/"

# Actualizar Dockerfile
echo -e "${YELLOW}Actualizando Dockerfile...${NC}"
echo "
COPY target/machines/${WASM_MODULE_ROOT} ${WASM_MODULE_ROOT}
RUN ln -sfT ${WASM_MODULE_ROOT} latest
" >> Dockerfile

# Construir imagen final
echo -e "${YELLOW}Construyendo imagen final...${NC}"
docker build . --tag brainsafes-node

# Crear directorios necesarios
echo -e "${YELLOW}Creando directorios...${NC}"
mkdir -p /data/brainsafes/node

# Copiar configuración
echo -e "${YELLOW}Copiando configuración...${NC}"
cp nodeConfig.json /data/brainsafes/node/

# Actualizar WASM module root en config
echo -e "${YELLOW}Actualizando WASM module root en configuración...${NC}"
sed -i "s/wasmModuleRoot\": \"0x.*/wasmModuleRoot\": \"${WASM_MODULE_ROOT}\",/" /data/brainsafes/node/nodeConfig.json

echo -e "${GREEN}Construcción completada exitosamente!${NC}"
echo -e "${YELLOW}Para ejecutar el nodo:${NC}"
echo -e "docker run --rm -it -v /data/brainsafes/node:/home/user/.arbitrum -p 0.0.0.0:8547:8547 -p 0.0.0.0:8548:8548 brainsafes-node --conf.file /home/user/.arbitrum/nodeConfig.json" 