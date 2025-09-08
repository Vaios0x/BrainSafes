const fs = require('fs');

// Función para corregir errores finales específicos
function fixFinalErrors(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corregir strings Unicode restantes
        const unicodeFixes = [
            ['"Cantidad inválida"', 'unicode"Cantidad inválida"'],
            ['"No está activa"', 'unicode"No está activa"'],
            ['"Dirección no registrada"', 'unicode"Dirección no registrada"']
        ];

        unicodeFixes.forEach(([oldStr, newStr]) => {
            if (content.includes(oldStr)) {
                content = content.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
                modified = true;
            }
        });

        // Corregir for loop malformado en AEPFeeRouter.sol
        if (content.includes('_getActiveRecipients(.length; i++)')) {
            content = content.replace(/_getActiveRecipients\(\.length; i\+\+\)/g, '_getActiveRecipients().length; i++)');
            modified = true;
        }

        // Corregir referencias a 'contract' como variable
        if (content.includes('contract.employer')) {
            content = content.replace(/contract\./g, 'contract_.');
            modified = true;
        }

        if (content.includes('contract.id')) {
            content = content.replace(/contract\./g, 'contract_.');
            modified = true;
        }

        // Corregir eventos fuera de interfaces
        if (content.includes('event BatchProcessed') && !content.includes('interface')) {
            content = content.replace(/event BatchProcessed\([^)]+\);/g, '');
            modified = true;
        }

        if (content.includes('event DataRequested') && !content.includes('interface')) {
            content = content.replace(/event DataRequested\([^)]+\);/g, '');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed final errors in ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Lista de archivos con errores finales
const filesWithFinalErrors = [
    'contracts/fees/AEPFeeRouter.sol',
    'contracts/interfaces/IAIProcessor.sol',
    'contracts/interfaces/IChronicleOracle.sol',
    'contracts/interfaces/ISupraOracle.sol',
    'contracts/marketplace/JobMarketplace.sol',
    'contracts/marketplace/SmartLaborContracts.sol',
    'contracts/social/CommunityRewards.sol',
    'contracts/social/MentorshipProgram.sol',
    'contracts/tokens/EDUToken.sol',
    'contracts/utils/AddressCompressor.sol'
];

// Ejecutar el script
console.log('Fixing final compilation errors...');
filesWithFinalErrors.forEach(file => {
    if (fs.existsSync(file)) {
        fixFinalErrors(file);
    }
});
console.log('Final error fixes completed!');
