const DEPLOY_BASE = '/Projects/projecttracking3';

export function getRouterBasename() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname.startsWith(`${DEPLOY_BASE}/`) || window.location.pathname === DEPLOY_BASE
    ? DEPLOY_BASE
    : undefined;
}

export function getAppBasePath() {
  return `${getRouterBasename() ?? ''}/`;
}

export function getApiBasePath() {
  return `${getRouterBasename() ?? ''}/api`;
}
