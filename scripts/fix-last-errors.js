const fs = require('fs');

// Función para corregir los últimos errores
function fixLastErrors(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corregir strings Unicode restantes
        const unicodeFixes = [
            ['"Mentoría no finalizada"', 'unicode"Mentoría no finalizada"'],
            ['"Índice no válido"', 'unicode"Índice no válido"']
        ];

        unicodeFixes.forEach(([oldStr, newStr]) => {
            if (content.includes(oldStr)) {
                content = content.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
                modified = true;
            }
        });

        // Corregir for loop malformado en AEPFeeRouter.sol
        if (content.includes('_getActiveRecipients([i]) {')) {
            content = content.replace(/_getActiveRecipients\(\[i\]\) \{/g, '_getActiveRecipients()[i];');
            modified = true;
        }

        // Corregir referencias a 'contract' como variable
        if (content.includes('_calculateNextPayment(contract)')) {
            content = content.replace(/_calculateNextPayment\(contract\)/g, '_calculateNextPayment(contract_)');
            modified = true;
        }

        // Corregir interfaces malformadas - remover eventos fuera de interfaces
        if (content.includes('event DataReceived') && !content.includes('interface')) {
            content = content.replace(/event DataReceived\([^)]+\);/g, '');
            modified = true;
        }

        // Corregir interfaces vacías
        if (content.trim() === '}') {
            content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPlaceholder {
    // Placeholder interface
}`;
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed last errors in ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Lista de archivos con errores finales
const filesWithLastErrors = [
    'contracts/fees/AEPFeeRouter.sol',
    'contracts/interfaces/IAIProcessor.sol',
    'contracts/interfaces/IChronicleOracle.sol',
    'contracts/interfaces/ISupraOracle.sol',
    'contracts/marketplace/SmartLaborContracts.sol',
    'contracts/social/MentorshipProgram.sol',
    'contracts/utils/AddressCompressor.sol'
];

// Ejecutar el script
console.log('Fixing last compilation errors...');
filesWithLastErrors.forEach(file => {
    if (fs.existsSync(file)) {
        fixLastErrors(file);
    }
});
console.log('Last error fixes completed!');
