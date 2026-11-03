// Serves the production build the way hosts like Vercel and Netlify do: /reviews returns reviews.html.
// Run with: npm run serve:web
const { createReadStream, existsSync, statSync } = require('fs');
const { createServer } = require('http');
const { extname, join, normalize, sep } = require('path');

const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 8081);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
};

function resolveFile(pathname) {
  const path = normalize(join(DIST, decodeURIComponent(pathname)));
  if (path !== DIST && !path.startsWith(DIST + sep)) return undefined;

  const candidates = [path, `${path}.html`, join(path, 'index.html')];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const file = resolveFile(pathname);
  const target = file ?? join(DIST, '+not-found.html');

  response.writeHead(file === undefined ? 404 : 200, {
    'Content-Type': CONTENT_TYPES[extname(target)] ?? 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/_expo/static/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(target).pipe(response);
});

server.listen(PORT, () => console.log(`Serving dist on http://localhost:${PORT}`));
