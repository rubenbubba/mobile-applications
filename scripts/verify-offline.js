// Proves that the installed app works with no server at all. Cypress can't test this, because its
// proxy sits between the service worker and the network. This drives real Chrome and shuts the server down.
// Run after `npm run build:web` with: npm run test:offline
const { spawn } = require('child_process');
const { createReadStream, existsSync, mkdtempSync, readFileSync, statSync } = require('fs');
const { createServer } = require('http');
const { tmpdir } = require('os');
const { extname, join } = require('path');

const DIST = join(__dirname, '..', 'dist');
const SERVER_PORT = 8090;
const DEBUG_PORT = 9335;
const ORIGIN = `http://localhost:${SERVER_PORT}`;
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Changing the served worker's bytes is what makes the browser treat it as a new version.
let swSuffix = '';

function startServer() {
  const sockets = new Set();
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url, ORIGIN);

    if (pathname === '/sw.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' });
      response.end(`${readFileSync(join(DIST, 'sw.js'), 'utf8')}${swSuffix}`);
      return;
    }

    const base = join(DIST, decodeURIComponent(pathname));
    const file = [base, `${base}.html`, join(base, 'index.html')].find((path) => existsSync(path) && statSync(path).isFile());

    if (file === undefined) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  return new Promise((resolve) => {
    server.listen(SERVER_PORT, () =>
      resolve(() =>
        new Promise((done) => {
          for (const socket of sockets) socket.destroy();
          server.close(done);
        }),
      ),
    );
  });
}

// Up to 30 seconds: a cold Chrome start on a busy CI machine can take longer than 15.
async function connect() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await sleep(250);
    try {
      const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      const page = targets.find((target) => target.type === 'page');
      if (page !== undefined) {
        const socket = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve) => socket.addEventListener('open', resolve));
        return socket;
      }
    } catch {
      // Chrome is still starting.
    }
  }
  throw new Error('Chrome did not start');
}

async function main() {
  const chromePath = CHROME_PATHS.find((path) => existsSync(path));
  if (chromePath === undefined) throw new Error('Chrome not found. Set CHROME_PATH.');
  if (!existsSync(join(DIST, 'sw.js'))) throw new Error('dist/sw.js not found. Run npm run build:web first.');

  const stopServer = await startServer();
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${mkdtempSync(join(tmpdir(), 'vitrine-offline-'))}`,
      '--no-first-run',
      // Linux CI machines block Chrome's sandbox. Only switched off there, never on a developer's machine.
      ...(process.env.CI ? ['--no-sandbox'] : []),
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const failures = [];
  const check = (name, passed, detail = '') => {
    console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
    if (!passed) failures.push(name);
  };

  try {
    const socket = await connect();
    let nextId = 0;
    const pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (pending.has(message.id)) {
        pending.get(message.id)(message.result);
        pending.delete(message.id);
      }
    });
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        nextId += 1;
        pending.set(nextId, resolve);
        socket.send(JSON.stringify({ id: nextId, method, params }));
      });
    const evaluate = async (expression) =>
      (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
    const waitFor = async (expression, timeout = 15000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(expression)) return true;
        await sleep(150);
      }
      return false;
    };
    const visible = (testId) => `(() => { const el = [...document.querySelectorAll('[data-testid="${testId}"]')].find((item) => item.offsetParent !== null); return el !== undefined; })()`;
    const navigate = async (path) => {
      await send('Page.navigate', { url: `${ORIGIN}${path}` });
      await sleep(400);
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('vitrine-session', JSON.stringify({ state: { user: { id: 'demo-user', email: 'demo@vitrine.example', name: 'Demo' }, isAuthenticated: true }, version: 0 }));`,
    });

    console.log('Online: first visit');
    await navigate('/');
    check('dashboard loads online', await waitFor(visible('health-hero')));
    check('service worker controls the page', await waitFor('navigator.serviceWorker.controller !== null', 25000));

    const score = await evaluate(`document.querySelector('[data-testid="overall-score"]')?.textContent`);
    const cached = await evaluate(`caches.keys().then((names) => Promise.all(names.map((name) => caches.open(name).then((cache) => cache.keys())))).then((lists) => lists.flat().map((request) => new URL(request.url).pathname))`);
    check('all main pages are saved', ['/', '/issues', '/website', '/seo', '/performance', '/reviews', '/settings', '/offline.html'].every((path) => cached.includes(path)), `${cached.length} files`);
    check('the icon font is saved', cached.some((path) => path.includes('Ionicons')));

    console.log('\nUpdate: publishing a new version');
    swSuffix = '\n// new version';
    await evaluate(`navigator.serviceWorker.getRegistration().then((registration) => registration.update()).then(() => true)`);
    check('the app offers the new version', await waitFor(visible('update-banner'), 25000));
    await evaluate(`window.__beforeUpdate = true; document.querySelector('[data-testid="apply-update"]').click(); true`);
    check('Reload switches to the new version', await waitFor(`window.__beforeUpdate === undefined && document.readyState === 'complete'`));
    check('the dashboard works after updating', await waitFor(visible('health-hero')));
    check('no update is left waiting', await waitFor(`navigator.serviceWorker.getRegistration().then((registration) => registration.waiting === null && navigator.serviceWorker.controller !== null)`));

    console.log('\nOffline: stopping the server');
    await stopServer();
    await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    const serverGone = await fetch(`${ORIGIN}/`).then(() => false, () => true);
    check('the server is really gone', serverGone);

    await navigate('/');
    check('dashboard opens after a reload', await waitFor(visible('health-hero')));
    check('previous results are still shown', (await evaluate(`document.querySelector('[data-testid="overall-score"]')?.textContent`)) === score, `score ${score}`);
    check('offline banner is shown', await waitFor(visible('offline-banner')));
    check('icons still render', await evaluate(`document.fonts.check('16px ionicons')`));

    await navigate('/reviews');
    check('a saved page opens directly', await waitFor(visible('rating-summary')));

    await navigate('/details/certificate-expiring');
    check('an issue page opens directly', await waitFor(visible('issue-detail')));

    await navigate('/this-page-was-never-saved');
    check('an unsaved page gets the offline page', await waitFor(`document.body.innerText.includes("You're offline")`));

    socket.close();
  } finally {
    chrome.kill();
    await stopServer().catch(() => {});
  }

  console.log(failures.length === 0 ? '\nAll offline checks passed.' : `\n${failures.length} offline checks failed.`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
