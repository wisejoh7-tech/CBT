// src/lib/api-config.ts

// For Desktop and Mobile apps, we need a hardcoded or environment-driven URL
// because relative paths like '/api' only work when served by Nginx on the same domain.

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:10000"; // dev fallback

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:10000"; // dev fallback

export { API_BASE_URL, SOCKET_URL };

// Helper to build full API paths
export const getApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

