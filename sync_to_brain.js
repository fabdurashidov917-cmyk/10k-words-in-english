const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\user\\.gemini\\word-game';
const destDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\265084ad-49a2-474f-9cb7-e67280f41819\\word-game';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip temporary scratch test files
    if (entry.name.startsWith('test_') || entry.name.startsWith('audit_') || entry.name.endsWith('.log') || entry.name === 'dom_dump.txt' || entry.name === 'find_browser.ps1') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Synced: ${path.relative(srcDir, srcPath)}`);
    }
  }
}

console.log('Synchronizing word-game to brain artifact mirror...');
copyDir(srcDir, destDir);
console.log('✓ Brain artifact mirror fully synchronized!');
