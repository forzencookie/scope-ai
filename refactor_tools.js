const fs = require('fs');
const path = require('path');

function processFile(filePath, rule) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean up previous failed attempts
  content = content.replace(/allowedCompanyTypes:\s*\[\s*.*?\s*\]\s*,?\s*/g, '');
  
  const defineToolRegex = /defineTool<.*?>\(\{\s*([\s\S]*?)\s*\}\)/g;
  
  const newContent = content.replace(defineToolRegex, (match, body) => {
    let toolRule = rule;
    
    // Check tool name property
    if (body.includes("'calculate_self_employment_fees'") || body.includes('"calculate_self_employment_fees"')) toolRule = ['ef', 'hb', 'kb'];
    if (body.includes("'register_owner_withdrawal'") || body.includes('"register_owner_withdrawal"')) toolRule = ['ef', 'hb', 'kb'];
    if (body.includes("'optimize_312'") || body.includes('"optimize_312"')) toolRule = ['ab'];
    if (body.includes("'prepare_ink2'") || body.includes('"prepare_ink2"')) toolRule = ['ab'];
    
    const property = `\n  allowedCompanyTypes: ${JSON.stringify(toolRule)},`;
    
    if (body.includes('requiresConfirmation:')) {
      return match.replace(/(requiresConfirmation:\s*.*?,)/, `$1${property}`);
    } else if (body.includes('category:')) {
      return match.replace(/(category:\s*.*?,)/, `$1${property}`);
    } else if (body.includes('name:')) {
      return match.replace(/(name:\s*.*?,)/, `$1${property}`);
    } else {
      return match.replace(/\{\s*/, `{\n  allowedCompanyTypes: ${JSON.stringify(toolRule)},`);
    }
  });

  let cleanedContent = newContent.replace(/\?\? undefined/g, '');
  
  if (content !== cleanedContent) {
    fs.writeFileSync(filePath, cleanedContent);
    console.log(`Updated ${filePath}`);
  }
}

const baseDir = '/Users/rice/Development/startups/scope-ai/src/lib/ai-tools';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('index.ts') && !fullPath.endsWith('types.ts') && !fullPath.endsWith('registry.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = getFiles(baseDir);

allFiles.forEach(file => {
  const relativePath = path.relative(baseDir, file);
  const parts = relativePath.split(path.sep);
  const domain = parts[0];
  const filename = parts[parts.length - 1];

  let rule = [];

  if (filename.includes('shareholders') || 
      filename.includes('board') || 
      filename.includes('k10') || 
      filename.includes('dividend') ||
      (domain === 'parter' && filename.includes('compliance'))) {
    rule = ['ab'];
  }
  
  if (filename.includes('partners')) {
    rule = ['hb', 'kb'];
  }

  if (filename.includes('periodiseringsfonder') || filename.includes('self-employment')) {
    rule = ['ef', 'hb', 'kb'];
  }

  processFile(file, rule);
});
