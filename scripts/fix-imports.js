const fs = require('fs');
const path = require('path');

// Mapeo de imports a corregir
const importMappings = {
    '@api3/contracts/v0.8/interfaces/IApi3Oracle.sol': '../interfaces/IApi3Oracle.sol',
    '@api3/contracts/v0.8/interfaces/IApi3ServerV1.sol': '../interfaces/IApi3ServerV1.sol',
    '@arbitrum/nitro-contracts/src/precompiles/NodeInterface.sol': '../interfaces/INodeInterface.sol',
    '@arbitrum/nitro-contracts/src/libraries/NitroUtils.sol': '../utils/NitroUtils.sol',
    '@gelatonetwork/relay-context/contracts/vendor/GelatoRelayContext.sol': '../interfaces/IGelatoRelayContext.sol'
};

// Función para procesar un archivo
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Reemplazar imports
        for (const [oldImport, newImport] of Object.entries(importMappings)) {
            if (content.includes(oldImport)) {
                content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
                modified = true;
                console.log(`Fixed import in ${filePath}: ${oldImport} -> ${newImport}`);
            }
        }

        // Actualizar declaraciones de variables
        if (content.includes('NodeInterface constant nodeInterface')) {
            content = content.replace(/NodeInterface constant nodeInterface/g, 'INodeInterface constant nodeInterface');
            modified = true;
            console.log(`Fixed NodeInterface declaration in ${filePath}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.sol')) {
            processFile(filePath);
        }
    }
}

// Ejecutar el script
console.log('Fixing imports in Solidity files...');
processDirectory('./contracts');
console.log('Import fixes completed!');
