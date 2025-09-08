const fs = require('fs');
const path = require('path');

// Función para extraer interfaces de un archivo
function extractInterfaces(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Buscar interfaces dentro de contratos
        const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
        let match;
        const interfaces = [];
        
        while ((match = interfaceRegex.exec(content)) !== null) {
            interfaces.push({
                name: match[1],
                body: match[2]
            });
        }
        
        if (interfaces.length > 0) {
            // Crear archivo de interfaces
            const interfaceContent = interfaces.map(iface => 
                `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ninterface ${iface.name} {\n${iface.body}\n}`
            ).join('\n\n');
            
            const interfacePath = path.join(path.dirname(filePath), 'interfaces', `${path.basename(filePath, '.sol')}_Interfaces.sol`);
            
            // Crear directorio si no existe
            const interfaceDir = path.dirname(interfacePath);
            if (!fs.existsSync(interfaceDir)) {
                fs.mkdirSync(interfaceDir, { recursive: true });
            }
            
            fs.writeFileSync(interfacePath, interfaceContent, 'utf8');
            console.log(`Extracted interfaces from ${filePath} to ${interfacePath}`);
            
            // Remover interfaces del archivo original
            interfaces.forEach(iface => {
                content = content.replace(`interface ${iface.name} {${iface.body}}`, '');
            });
            
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
            extractInterfaces(filePath);
        }
    }
}

// Ejecutar el script
console.log('Extracting interfaces from Solidity files...');
processDirectory('./contracts');
console.log('Interface extraction completed!');
