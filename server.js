const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const HOST = '0.0.0.0';
const STATE_FILE = path.join(__dirname, 'state.json');
const STATIC_ROOT = __dirname;

// MIME types for static files
const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2',
};

function serveStatic(req, res) {
  let filePath = path.join(STATIC_ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  filePath = path.normalize(filePath);

  // Security: don't serve files outside the project
  if (!filePath.startsWith(STATIC_ROOT)) { res.writeHead(403); res.end(); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API: GET state
  if (req.method === 'GET' && req.url === '/api/state') {
    try {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(data);
    } catch (e) {
      // File doesn't exist yet — return null so the client uses defaults
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end('null');
    }
    return;
  }

  // API: POST state
  if (req.method === 'POST' && req.url === '/api/state') {
    try {
      const body = await readBody(req);
      // Validate it's proper JSON
      JSON.parse(body);
      fs.writeFileSync(STATE_FILE, body, 'utf8');
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end('{"ok":true}');
    } catch (e) {
      res.writeHead(400, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error: e.message}));
    }
    return;
  }

  // Everything else: static files
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Floor Plan server running at http://localhost:${PORT}`);
});
