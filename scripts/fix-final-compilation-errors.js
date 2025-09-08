const fs = require('fs');

// Función para corregir errores finales
function fixFinalCompilationErrors(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corregir shadowing en CourseNFT.sol
        if (content.includes('string memory tokenURI')) {
            content = content.replace(/string memory tokenURI\)/g, 'string memory uri)');
            modified = true;
        }

        // Corregir documentación en BrainSafesGovernance.sol
        if (content.includes('@param delegate') && content.includes('function getDelegate(address delegateAddress)')) {
            content = content.replace(/@param delegate/g, '@param delegateAddress');
            modified = true;
        }

        // Agregar import de IBrainSafesL2 en BrainSafesBridge.sol
        if (content.includes('IBrainSafesL2') && !content.includes('import "../interfaces/IBrainSafesL2.sol"')) {
            content = content.replace(/import "@openzeppelin\/contracts\/token\/ERC721\/IERC721.sol";/g, `import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IBrainSafesL2.sol";`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed final compilation errors in ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Lista de archivos con errores finales
const filesWithFinalErrors = [
    'contracts/tokens/CourseNFT.sol',
    'contracts/governance/BrainSafesGovernance.sol',
    'contracts/bridge/BrainSafesBridge.sol'
];

// Ejecutar el script
console.log('Fixing final compilation errors...');
filesWithFinalErrors.forEach(file => {
    if (fs.existsSync(file)) {
        fixFinalCompilationErrors(file);
    }
});
console.log('Final compilation error fixes completed!');
