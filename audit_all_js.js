const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsDir = 'C:\\Users\\user\\.gemini\\word-game\\js';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(jsDir);
console.log(`Auditing ${files.length} JavaScript files...`);

let hasError = false;

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  try {
    new vm.Script(code, { filename: file });
    console.log(`[PASS] ${path.relative(jsDir, file)} - Syntax Valid (${(code.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`[FAIL] ${path.relative(jsDir, file)}:`, err.message);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('ALL JS FILES PASSED SYNTAX CHECK!');
}
