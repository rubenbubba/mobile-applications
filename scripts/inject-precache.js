// Runs after `expo export`. Writes the list of built files and a content-based version into dist/sw.js.
const { createHash } = require('crypto');
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join, relative, sep } = require('path');

const DIST = join(__dirname, '..', 'dist');
const SW_PATH = join(DIST, 'sw.js');

const EXCLUDED = [
  /^sw\.js$/,
  /^\(app\)\//, // Duplicates of the clean routes.
  /\[.+\]/, // Route templates. The real pages come from generateStaticParams.
  /^\+not-found\.html$/,
  /^assets\/node_modules\/expo-router\//, // Only used by the dev-only error and sitemap screens.
  /^assets\/node_modules\/@react-navigation\//, // Default header icons. The app has no default headers.
  /\.map$/,
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function toUrl(file) {
  const clean = file.endsWith('.html') && file !== 'offline.html' ? file.replace(/(index)?\.html$/, '') : file;
  return encodeURI(`/${clean}`).replace(/\/$/, '') || '/';
}

const files = walk(DIST)
  .map((path) => ({ path, file: relative(DIST, path).split(sep).join('/') }))
  .filter(({ file }) => !EXCLUDED.some((pattern) => pattern.test(file)))
  .sort((a, b) => a.file.localeCompare(b.file));

const hash = createHash('sha256');
for (const { path, file } of files) {
  hash.update(file);
  hash.update(readFileSync(path));
}
const version = hash.digest('hex').slice(0, 12);
const urls = files.map(({ file }) => toUrl(file));

const source = readFileSync(SW_PATH, 'utf8');
const built = source
  .replace("const BUILD_VERSION = 'dev';", `const BUILD_VERSION = '${version}';`)
  .replace('const PRECACHE_URLS = [];', `const PRECACHE_URLS = ${JSON.stringify(urls)};`);

if (built === source) {
  throw new Error('Could not find the placeholders in dist/sw.js. Did public/sw.js change?');
}

writeFileSync(SW_PATH, built);
console.log(`Service worker ${version}: ${urls.length} files precached.`);
