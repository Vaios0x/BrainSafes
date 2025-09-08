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

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed compilation errors in ${filePath}`);
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
console.log('Fixing compilation errors in Solidity files...');
processDirectory('./contracts');
console.log('Compilation error fixes completed!');
