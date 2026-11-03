const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const baseDir = 'C:\\Users\\user\\.gemini\\word-game';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(baseDir, reqPath.replace(/\//g, path.sep));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8088, () => {
  console.log('Test HTTP Server listening on http://localhost:8088');

  // Launch Chrome headless with remote debugging to capture console logs
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--enable-logging=stderr',
    '--v=1',
    '--dump-dom',
    'http://localhost:8088/index.html'
  ];

  console.log('Launching Chrome to fetch and execute index.html...');
  const child = spawn(chromePath, args);

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  child.on('close', code => {
    console.log(`Chrome finished with code ${code}.`);
    console.log(`DOM length rendered: ${stdout.length} characters.`);
    
    // Look for any JavaScript uncaught errors in stderr
    const hasJsError = /Uncaught (Error|TypeError|ReferenceError|SyntaxError)/i.test(stderr);
    if (hasJsError) {
      console.error('DETECTED JAVASCRIPT RUNTIME ERROR IN CHROME:');
      console.error(stderr);
    } else {
      console.log('✓ ZERO JAVASCRIPT RUNTIME ERRORS IN CHROME!');
    }

    server.close(() => {
      console.log('HTTP Server closed. Test complete.');
      process.exit(hasJsError ? 1 : 0);
    });
  });

  setTimeout(() => {
    console.log('Timeout reached. Killing Chrome if still running.');
    child.kill();
  }, 12000);
});
