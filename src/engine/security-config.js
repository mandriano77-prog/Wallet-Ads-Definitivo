const crypto = require('crypto');

const PRODUCTION_SECRET_PLACEHOLDERS = new Set([
  'change-me-in-production',
  'change-me-portal-secret',
  'nudj-secret-change-me-in-prod'
]);

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function envFlag(name) {
  return /^(1|true|yes|on)$/i.test(String(process.env[name] || '').trim());
}

function requiredSecret(name, options = {}) {
  const fallback = options.fallback;
  const allowFallbackInDev = options.allowFallbackInDev !== false;
  const value = String(process.env[name] || '').trim();
  if (value && !PRODUCTION_SECRET_PLACEHOLDERS.has(value)) return value;

  if (!isProduction() && allowFallbackInDev) {
    if (fallback) return fallback;
    return crypto.createHash('sha256').update(`dev:${name}`).digest('hex');
  }

  throw new Error(`${name} must be set to a strong, non-placeholder value in production`);
}

function debugEndpointsEnabled() {
  if (envFlag('ENABLE_DEBUG_ENDPOINTS')) return true;
  return !isProduction();
}

function requireDebugAccess(req, res, next) {
  if (debugEndpointsEnabled()) return next();
  return res.status(404).json({ error: 'Not found' });
}

function parseCorsOrigins() {
  const raw = String(process.env.CORS_ORIGINS || '').trim();
  const origins = raw
    ? raw.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const domains = [
    process.env.CUSTOM_DOMAIN,
    process.env.PORTAL_BASE_URL,
    process.env.APP_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
  ];

  for (const value of domains) {
    const normalized = normalizeOrigin(value);
    if (normalized && !origins.includes(normalized)) origins.push(normalized);
  }

  return origins;
}

function normalizeOrigin(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.origin;
    } catch {
      return null;
    }
  }
  const host = value.replace(/^\/+/, '').replace(/\/+$/, '').split('/')[0];
  return host ? `https://${host}` : null;
}

function corsOptions() {
  if (!isProduction()) return {};
  const origins = parseCorsOrigins();
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    }
  };
}

function assertProductionConfig() {
  if (!isProduction()) return;
  requiredSecret('JWT_SECRET', { allowFallbackInDev: false });
  requiredSecret('PORTAL_JWT_SECRET', { allowFallbackInDev: false });
  if (!process.env.CUSTOM_DOMAIN && !process.env.APP_URL && !process.env.RAILWAY_PUBLIC_DOMAIN) {
    throw new Error('CUSTOM_DOMAIN, APP_URL or RAILWAY_PUBLIC_DOMAIN must be set in production');
  }
}

module.exports = {
  isProduction,
  envFlag,
  requiredSecret,
  debugEndpointsEnabled,
  requireDebugAccess,
  corsOptions,
  assertProductionConfig
};
