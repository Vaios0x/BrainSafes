#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Iniciando optimización del binario WASM...${NC}"

# Verificar requisitos
if ! command -v wasm-opt &> /dev/null; then
    echo -e "${YELLOW}Instalando wasm-opt...${NC}"
    npm install -g wasm-opt
fi

if ! command -v wasm-strip &> /dev/null; then
    echo -e "${YELLOW}Instalando wabt...${NC}"
    npm install -g wabt
fi

# Directorio del binario WASM
WASM_DIR="contracts/ai/target/wasm32-unknown-unknown/release"
WASM_FILE="$WASM_DIR/brainsafes_ai.wasm"
OPTIMIZED_FILE="$WASM_DIR/brainsafes_ai.optimized.wasm"

# Verificar que existe el binario
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}Error: No se encuentra el binario WASM${NC}"
    echo -e "${YELLOW}Compilando proyecto...${NC}"
    cd contracts/ai
    cargo build --target wasm32-unknown-unknown --release
    cd ../..
fi

echo -e "${YELLOW}Eliminando símbolos de debug...${NC}"
wasm-strip "$WASM_FILE"

echo -e "${YELLOW}Optimizando binario...${NC}"
wasm-opt -Oz \
    --strip-debug \
    --strip-producers \
    --vacuum \
    --dce \
    --memory-packing \
    --merge-blocks \
    --remove-unused-names \
    --remove-unused-brs \
    --remove-unused-module-elements \
    -o "$OPTIMIZED_FILE" \
    "$WASM_FILE"

# Verificar tamaño
ORIGINAL_SIZE=$(stat -f%z "$WASM_FILE")
OPTIMIZED_SIZE=$(stat -f%z "$OPTIMIZED_FILE")
REDUCTION=$((100 - (OPTIMIZED_SIZE * 100 / ORIGINAL_SIZE)))

echo -e "${GREEN}Optimización completada:${NC}"
echo -e "Tamaño original: $ORIGINAL_SIZE bytes"
echo -e "Tamaño optimizado: $OPTIMIZED_SIZE bytes"
echo -e "Reducción: $REDUCTION%"

# Mover archivo optimizado
mv "$OPTIMIZED_FILE" "$WASM_FILE"
echo -e "${GREEN}Archivo optimizado guardado como $WASM_FILE${NC}"

# Verificar que el binario es válido
echo -e "${YELLOW}Verificando binario...${NC}"
if ! cargo stylus check; then
    echo -e "${RED}Error: El binario optimizado no es válido${NC}"
    exit 1
fi

echo -e "${GREEN}¡Optimización completada exitosamente!${NC}" 