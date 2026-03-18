const fs = require('fs');
const path = require('path');

const manifestPath = path.join(process.cwd(), 'src', 'lib', 'ai-tools', 'manifest.json');
const outputPath = path.join(process.cwd(), 'src', 'data', 'ai-knowledge', 'ai_tools.md');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Group by domain
const byDomain = {};
manifest.forEach(tool => {
    const domain = tool.domain || 'common';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(tool);
});

let md = '# AI Tools Manual\n\n';
md += 'Använd detta dokument för att hitta rätt verktyg för en uppgift. När du hittat ett verktyg du vill använda, anropa `search_tools` med verktygets namn för att få den fullständiga specifikationen (parametrar).\n\n';

for (const [domain, tools] of Object.entries(byDomain)) {
    md += `## ${domain.charAt(0).toUpperCase() + domain.slice(1)}\n\n`;
    tools.forEach(tool => {
        md += `- **${tool.name}**: ${tool.description}\n`;
    });
    md += '\n';
}

fs.writeFileSync(outputPath, md);
console.log('Generated ai_tools.md');
