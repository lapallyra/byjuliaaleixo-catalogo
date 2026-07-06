const fs = require('fs');
const path = require('path');

function replaceAlertsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('alert(')) return;

  // Add useAdminOrchestrator import if needed
  if (!content.includes('useAdminOrchestrator') && content.includes('alert(')) {
    // Find the last import
    const importRegex = /^import\s+.*?;?\s*$/gm;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    // figure out path to AdminOrchestratorSystem.tsx
    let relPath = '../AdminOrchestratorSystem';
    if (filePath.split('/').length > 4) {
      // it's like src/components/Admin/Settings/SettingsTab.tsx -> ../../AdminOrchestratorSystem
      relPath = '../../AdminOrchestratorSystem';
    }
    const importStr = `\nimport { useAdminOrchestrator } from "${relPath}";\n`;
    content = content.slice(0, lastImportIndex) + importStr + content.slice(lastImportIndex);
  }

  // Insert const orchestrator = useAdminOrchestrator(); in the component
  // We'll just regex for the component declaration
  const componentRegex = /const\s+([A-Z][a-zA-Z0-9_]+)\s*(?::\s*React\.FC[^=]*)?=\s*(?:\([^)]*\))?\s*=>\s*{/g;
  content = content.replace(componentRegex, (match) => {
    return `${match}\n  const orchestrator = useAdminOrchestrator();`;
  });
  
  // replace alert("...") with orchestrator.dispatchEvent(...)
  // We'll use a regex that handles backticks, double quotes, single quotes
  const alertRegex = /alert\((['"`])(.*?)(\1)\);?/g;
  content = content.replace(alertRegex, (match, quote, message) => {
    let success = !message.toLowerCase().includes('erro') && !message.toLowerCase().includes('falha');
    let title = success ? 'Sucesso' : 'Erro';
    if (message.toLowerCase().includes('obrigatório') || message.toLowerCase().includes('selecione')) {
        success = false;
        title = 'Aviso';
    }
    return `orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: ${quote}${message}${quote},
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: typeof companyId !== 'undefined' ? companyId : 'unknown',
      data: { success: ${success}, title: '${title}' }
    });`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Replaced alerts in', filePath);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx')) {
      replaceAlertsInFile(filePath);
    }
  }
}

walkDir('./src/components/Admin');
