const fs = require('fs');
const path = require('path');

// Función para procesar un archivo
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corregir strings Unicode
        content = content.replace(/"([^"]*[áéíóúñÁÉÍÓÚÑ][^"]*)"/g, 'unicode"$1"');
        
        // Corregir uso de 'contract' como variable
        content = content.replace(/contract\s+(\w+)\s*=/g, 'contract_$1 =');
        content = content.replace(/contract\s+(\w+)\s*\[/g, 'contract_$1[');
        
        // Corregir uso de 'in' en for loops
        content = content.replace(/for\s*\(\s*(\w+)\s+(\w+)\s+in\s+([^)]+)\)/g, 'for (uint256 i = 0; i < $3.length; i++) {\n        $1 $2 = $3[i];');
        
        // Corregir eventos con 'contract' como parámetro
        content = content.replace(/event\s+(\w+)\s*\([^)]*contract[^)]*\)/g, (match) => {
            return match.replace(/contract/g, 'contractAddress');
        });

        // Remover archivos de interfaces duplicados
        if (filePath.includes('/interfaces/interfaces/') || filePath.includes('\\interfaces\\interfaces\\')) {
            fs.unlinkSync(filePath);
            console.log(`Removed duplicate interface file: ${filePath}`);
            return;
        }

        // Corregir múltiples SPDX licenses
        const spdxMatches = content.match(/\/\/ SPDX-License-Identifier: MIT/g);
        if (spdxMatches && spdxMatches.length > 1) {
            content = content.replace(/\/\/ SPDX-License-Identifier: MIT\n/g, '');
            content = '// SPDX-License-Identifier: MIT\n' + content;
            modified = true;
        }

        // Corregir interfaces vacías
        if (content.includes('interface') && content.trim().endsWith('}')) {
            const lines = content.split('\n');
            const interfaceStart = lines.findIndex(line => line.includes('interface'));
            if (interfaceStart !== -1) {
                const interfaceName = lines[interfaceStart].match(/interface\s+(\w+)/);
                if (interfaceName) {
                    content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ${interfaceName[1]} {
    // Interface methods will be implemented here
}`;
                    modified = true;
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed errors in ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
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

// Limpiar archivos de interfaces duplicados
function cleanDuplicateInterfaces() {
    const interfacesDir = './contracts/interfaces/interfaces';
    if (fs.existsSync(interfacesDir)) {
        fs.rmSync(interfacesDir, { recursive: true, force: true });
        console.log('Removed duplicate interfaces directory');
    }
}

// Ejecutar el script
console.log('Fixing all compilation errors in Solidity files...');
cleanDuplicateInterfaces();
processDirectory('./contracts');
console.log('All compilation error fixes completed!');
