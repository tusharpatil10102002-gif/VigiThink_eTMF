// VigiThink eTMF: Centralized Dynamic API & Asset URL Resolver
// Supports both root deployment (/) and subdirectory deployment (/etmf/) on Hostinger & Cloud providers

export const resolveApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // 1. If explicit backend API URL provided in environment
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    const cleanBase = envApi.replace(/\/$/, '');
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanPath}`;
  }

  // 2. If running under /etmf subpath (e.g. https://vigithink.com/etmf/)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/etmf')) {
    if (endpoint.startsWith('/api')) {
      return `/etmf${endpoint}`;
    }
    if (endpoint.startsWith('/uploads')) {
      return `/etmf${endpoint}`;
    }
  }

  // 3. Default standard path
  return endpoint;
};

export const apiFetch = (endpoint, options) => {
  return fetch(resolveApiUrl(endpoint), options);
};
