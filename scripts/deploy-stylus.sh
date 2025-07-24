#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Stylus contracts deployment...${NC}"

# Build Rust contracts
echo -e "${YELLOW}Building Rust contracts...${NC}"
cd contracts/ai
cargo build --release
cargo stylus check

# Optimize WASM output
echo -e "${YELLOW}Optimizing WASM binaries...${NC}"
wasm-opt -O4 -o target/wasm32-unknown-unknown/release/ai_processor_opt.wasm target/wasm32-unknown-unknown/release/ai_processor.wasm
wasm-opt -O4 -o target/wasm32-unknown-unknown/release/off_chain_compute_opt.wasm target/wasm32-unknown-unknown/release/off_chain_compute.wasm

# Deploy to Arbitrum Stylus
echo -e "${YELLOW}Deploying to Arbitrum Stylus...${NC}"
cargo stylus deploy \
    --private-key=$PRIVATE_KEY \
    --constructor-args="0x1234...5678" \
    target/wasm32-unknown-unknown/release/ai_processor_opt.wasm

cargo stylus deploy \
    --private-key=$PRIVATE_KEY \
    --constructor-args="0x1234...5678" \
    target/wasm32-unknown-unknown/release/off_chain_compute_opt.wasm

# Verify contracts
echo -e "${YELLOW}Verifying contracts...${NC}"
cargo stylus verify \
    --address=$(cat .deployment/ai_processor_address.txt) \
    target/wasm32-unknown-unknown/release/ai_processor_opt.wasm

cargo stylus verify \
    --address=$(cat .deployment/off_chain_compute_address.txt) \
    target/wasm32-unknown-unknown/release/off_chain_compute_opt.wasm

echo -e "${GREEN}Deployment completed successfully!${NC}" 