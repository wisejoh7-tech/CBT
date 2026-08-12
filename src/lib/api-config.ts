export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || "http://localhost:5000";

export const getApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export const config = {
  // Environment
  NODE_ENV: import.meta.env.MODE,

  // API + Socket URLs
  API_BASE_URL,
  SOCKET_URL,

  // Helper
  getApiUrl,
};
