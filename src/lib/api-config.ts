const isProd = import.meta.env.PROD;
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || (isProd ? "/api" : "http://localhost:10000");
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || (isProd ? "/" : "http://localhost:10000");

export const getApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export async function safeJsonResponse<T = any>(res: Response): Promise<T> {
  const rawText = await res.text();
  let parsed: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("[safeJsonResponse] JSON parse error on response body:", rawText.slice(0, 200));
    }
  }

  if (!res.ok) {
    const errorMsg =
      (parsed && typeof parsed === "object" && (parsed.message || parsed.error)) ||
      `HTTP Error ${res.status}: ${res.statusText || "Server error"}`;
    throw new Error(errorMsg);
  }

  return (parsed !== null ? parsed : {}) as T;
}

export const config = {
  // Environment
  NODE_ENV: import.meta.env.MODE,

  // API + Socket URLs
  API_BASE_URL,
  SOCKET_URL,

  // Helper
  getApiUrl,
};
