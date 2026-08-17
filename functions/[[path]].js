import legacyRedirects from '../data/legacy-redirects.json';

const REDIRECTS_BY_LOWERCASE = Object.fromEntries(
  Object.entries(legacyRedirects).map(([source, destination]) => [source.toLowerCase(), destination])
);

const ONE_HOUR = 3600;
const ONE_DAY = 86400;
const ONE_WEEK = 604800;
const ONE_YEAR = 31536000;

const IMMUTABLE_ASSET_EXTENSIONS = new Set([
  'avif', 'webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico',
  'css', 'js', 'mjs', 'json', 'map', 'woff', 'woff2', 'ttf', 'otf',
  'eot', 'mp4', 'webm', 'mp3', 'wav', 'pdf', 'zip', 'xml', 'txt',
  'webmanifest'
]);

const HTML_EXTENSIONS = new Set(['html', 'htm']);

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  let path = pathname.replace(/\/+/g, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  try { path = decodeURI(path); } catch (_) {}
  return path;
}

function extensionOf(pathname) {
  const last = pathname.split('/').pop() || '';
  const dot = last.lastIndexOf('.');
  return dot === -1 ? '' : last.slice(dot + 1).toLowerCase();
}

function buildRedirectUrl(requestUrl, destination) {
  const url = new URL(requestUrl);
  const target = new URL(destination, url.origin);
  target.search = url.search;
  return target.toString();
}

function withHeaders(response, requestPath) {
  const headers = new Headers(response.headers);
  const ext = extensionOf(requestPath);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (HTML_EXTENSIONS.has(ext) || ext === '' || requestPath.endsWith('/')) {
    headers.set('Cache-Control', `public, max-age=${ONE_HOUR}, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`);
  } else if (IMMUTABLE_ASSET_EXTENSIONS.has(ext)) {
    if (['xml', 'txt', 'webmanifest', 'json'].includes(ext)) {
      headers.set('Cache-Control', `public, max-age=${ONE_HOUR}, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_WEEK}`);
    } else {
      headers.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function serveAsset(env, request, candidatePath) {
  const url = new URL(request.url);
  url.pathname = candidatePath;
  const assetRequest = new Request(url.toString(), request);
  return env.ASSETS.fetch(assetRequest);
}

async function tryAsset(env, request, candidatePath) {
  const response = await serveAsset(env, request, candidatePath);
  return response.status === 404 ? null : response;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const exactRedirect = legacyRedirects[pathname];
  if (exactRedirect) {
    return Response.redirect(buildRedirectUrl(request.url, exactRedirect), 301);
  }

  const lowerPath = pathname.toLowerCase();
  const lowercaseRedirect = REDIRECTS_BY_LOWERCASE[lowerPath];
  if (!exactRedirect && lowercaseRedirect) {
    return Response.redirect(buildRedirectUrl(request.url, lowercaseRedirect), 301);
  }

  let response = await tryAsset(env, request, pathname);

  if (!response && pathname.endsWith('/') && pathname !== '/') {
    response = await tryAsset(env, request, `${pathname}index.html`);
  }

  if (!response && !extensionOf(pathname)) {
    response = await tryAsset(env, request, `${pathname}/index.html`);
    if (!response) response = await tryAsset(env, request, `${pathname}.html`);
  }

  if (!response && HTML_EXTENSIONS.has(extensionOf(pathname))) {
    const cleanPath = pathname.replace(/\.html?$/i, '/');
    response = await tryAsset(env, request, `${cleanPath}index.html`);
  }

  if (!response) {
    response = await next();
  }

  return withHeaders(response, pathname);
}
