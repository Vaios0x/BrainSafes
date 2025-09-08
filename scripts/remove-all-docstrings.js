const fs = require('fs');
const path = require('path');

function removeDocstrings(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            removeDocstrings(filePath);
        } else if (file.endsWith('.sol')) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Remove all docstring blocks
            content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');
            
            // Remove triple slash comments
            content = content.replace(/\/\/\/.*$/gm, '');
            
            fs.writeFileSync(filePath, content);
            console.log(`Removed docstrings from: ${filePath}`);
        }
    }
}

console.log('Removing all docstrings from Solidity files...');
removeDocstrings('./contracts');
console.log('All docstrings removed successfully!');