// VigiThink eTMF: Centralized Dynamic API & Asset URL Resolver
// Supports both root deployment (/) and subdirectory deployment (/etmf/) on Hostinger & Cloud providers

export const resolveApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // Normalize leading slash
  let clean = String(endpoint).trim();
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }

  const isUnderEtmf = typeof window !== 'undefined' && window.location.pathname.startsWith('/etmf');

  // 1. If explicit backend API URL provided in environment
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    const cleanBase = envApi.replace(/\/$/, '');
    return `${cleanBase}${clean}`;
  }

  // 2. If running under /etmf subpath (e.g. https://vigithink.com/etmf/)
  if (isUnderEtmf) {
    if (clean.startsWith('/etmf/')) {
      return clean;
    }
    return `/etmf${clean}`;
  }

  // 3. Default standard path
  return clean;
};

export const apiFetch = (endpoint, options) => {
  return fetch(resolveApiUrl(endpoint), options);
};
