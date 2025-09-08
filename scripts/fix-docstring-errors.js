const fs = require('fs');
const path = require('path');

function fixDocstringErrors(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            fixDocstringErrors(filePath);
        } else if (file.endsWith('.sol')) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Fix @return tags without parameter names
            content = content.replace(
                /@return\s+([^@\n\r]+)/g,
                (match, description) => {
                    // Extract meaningful parameter name from description
                    const words = description.trim().split(/\s+/);
                    let paramName = 'result';
                    
                    if (words.length > 0) {
                        const firstWord = words[0].toLowerCase();
                        if (firstWord.match(/^(the|an|a)$/)) {
                            paramName = words[1] || 'result';
                        } else {
                            paramName = firstWord;
                        }
                        
                        // Clean parameter name
                        paramName = paramName.replace(/[^a-zA-Z0-9]/g, '');
                        if (!paramName || paramName.length < 2) {
                            paramName = 'result';
                        }
                    }
                    
                    return `@return ${paramName} ${description}`;
                }
            );
            
            fs.writeFileSync(filePath, content);
        }
    }
}

console.log('Fixing docstring errors...');
fixDocstringErrors('./contracts');
console.log('Docstring errors fixed!');