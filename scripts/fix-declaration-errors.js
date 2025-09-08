const fs = require('fs');

// Función para corregir errores de declaraciones
function fixDeclarationErrors(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corregir declaraciones duplicadas en DataAvailabilityCommittee.sol
        if (content.includes('mapping(address => bool) confirmations;') && content.includes('uint256 confirmations;')) {
            content = content.replace(/mapping\(address => bool\) confirmations;/g, 'mapping(address => bool) confirmationsMap;');
            modified = true;
        }

        // Corregir declaraciones duplicadas en MockChainlinkOracle.sol
        if (content.includes('uint8 private decimals = 18;') && content.includes('function decimals()')) {
            content = content.replace(/uint8 private decimals = 18;/g, 'uint8 private _decimals = 18;');
            modified = true;
        }

        // Corregir shadowing en NitroUtils.sol
        if (content.includes('function isContract(address addr) internal view returns (bool isContract)')) {
            content = content.replace(/returns \(bool isContract\)/g, 'returns (bool)');
            modified = true;
        }

        // Corregir shadowing en BadgeNFT.sol y CertificateNFT.sol
        if (content.includes('string memory tokenURI) external onlyRole(MINTER_ROLE)')) {
            content = content.replace(/string memory tokenURI\)/g, 'string memory uri)');
            modified = true;
        }

        // Corregir shadowing en DeFiIntegration.sol
        if (content.includes('uint96 deposit = deposits[msg.sender];')) {
            content = content.replace(/uint96 deposit =/g, 'uint96 userDeposit =');
            modified = true;
        }

        // Corregir shadowing en BrainSafesGovernance.sol
        if (content.includes('function getDelegate(address delegate)')) {
            content = content.replace(/function getDelegate\(address delegate\)/g, 'function getDelegate(address delegateAddress)');
            modified = true;
        }

        // Corregir shadowing en TransactionMonitor.sol
        if (content.includes('Transaction storage tx =')) {
            content = content.replace(/Transaction storage tx =/g, 'Transaction storage transaction =');
            modified = true;
        }
        if (content.includes('Transaction memory tx,')) {
            content = content.replace(/Transaction memory tx,/g, 'Transaction memory transaction,');
            modified = true;
        }

        // Corregir shadowing en CostOptimizer.sol
        if (content.includes('uint256 batches,')) {
            content = content.replace(/uint256 batches,/g, 'uint256 batchCount,');
            modified = true;
        }

        // Corregir shadowing en TimeBoostSystem.sol
        if (content.includes('uint256 totalTimeSkipped,')) {
            content = content.replace(/uint256 totalTimeSkipped,/g, 'uint256 skippedTime,');
            modified = true;
        }
        if (content.includes('uint256 avgBoostFactor,')) {
            content = content.replace(/uint256 avgBoostFactor,/g, 'uint256 boostFactor,');
            modified = true;
        }

        // Corregir shadowing en AchievementNFT.sol
        if (content.includes('string memory uri,')) {
            content = content.replace(/string memory uri,/g, 'string memory tokenUri,');
            modified = true;
        }

        // Corregir shadowing en CourseNFT.sol
        if (content.includes('string memory tokenURI')) {
            content = content.replace(/string memory tokenURI\)/g, 'string memory uri)');
            modified = true;
        }

        // Corregir shadowing en EnhancedStaking.sol
        if (content.includes('StakeInfo storage stake =')) {
            content = content.replace(/StakeInfo storage stake =/g, 'StakeInfo storage userStake =');
            modified = true;
        }

        // Agregar imports faltantes en BrainSafesBridge.sol
        if (content.includes('IERC20(eduToken)') && !content.includes('import "@openzeppelin/contracts/token/ERC20/IERC20.sol"')) {
            content = content.replace(/pragma solidity \^0\.8\.19;/g, `pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed declaration errors in ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Lista de archivos con errores de declaraciones
const filesWithDeclarationErrors = [
    'contracts/data/DataAvailabilityCommittee.sol',
    'contracts/mocks/MockChainlinkOracle.sol',
    'contracts/utils/NitroUtils.sol',
    'contracts/education/BadgeNFT.sol',
    'contracts/education/CertificateNFT.sol',
    'contracts/finance/DeFiIntegration.sol',
    'contracts/governance/BrainSafesGovernance.sol',
    'contracts/monitoring/TransactionMonitor.sol',
    'contracts/optimizations/CostOptimizer.sol',
    'contracts/optimizations/TimeBoostSystem.sol',
    'contracts/tokens/AchievementNFT.sol',
    'contracts/tokens/CourseNFT.sol',
    'contracts/tokens/EnhancedStaking.sol',
    'contracts/bridge/BrainSafesBridge.sol'
];

// Ejecutar el script
console.log('Fixing declaration errors...');
filesWithDeclarationErrors.forEach(file => {
    if (fs.existsSync(file)) {
        fixDeclarationErrors(file);
    }
});
console.log('Declaration error fixes completed!');
