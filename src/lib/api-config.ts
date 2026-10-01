const isProd = import.meta.env.PROD;

// Determine API Base URL with fallback logic
const resolveApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (!isProd) {
    return "http://localhost:10000";
  }
  // In production if VITE_API_URL is missing, default to relative "/api" or current origin
  return "/api";
};

export const API_BASE_URL = resolveApiBaseUrl();

const resolveSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL as string;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  return isProd ? "/" : "http://localhost:10000";
};

export const SOCKET_URL = resolveSocketUrl();

export const getApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export function getFriendlyErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";
  const msg = typeof err === "string" ? err : err.message || String(err);

  if (
    msg === "Failed to fetch" ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    msg.includes("TypeError: Failed to fetch")
  ) {
    return "Unable to connect to the server. Please check your internet connection or try again later.";
  }

  return msg;
}

export async function safeJsonResponse<T = any>(res: Response): Promise<T> {
  const rawText = await res.text();
  const trimmed = rawText ? rawText.trim() : "";
  let parsed: any = null;

  if (trimmed.length > 0) {
    if (trimmed.startsWith("<")) {
      throw new Error(
        "Backend service unreachable or API URL misconfigured. The server returned an HTML page instead of JSON."
      );
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      console.error("[safeJsonResponse] JSON parse error on response body:", trimmed.slice(0, 200));
      throw new Error("Invalid response format received from server.");
    }
  }

  if (!res.ok) {
    const rawError =
      (parsed && typeof parsed === "object" && (parsed.message || parsed.error)) ||
      `HTTP Error ${res.status}: ${res.statusText || "Server error"}`;
    throw new Error(rawError);
  }

  return (parsed !== null ? parsed : {}) as T;
}

/**
  Fetch wrapper with retry support for cold starts / network glitches.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retries = 2,
  delayMs = 1500
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 && attempt < retries) {
        // Backend DB is initializing / server spinning up
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      return response;
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

export const config = {
  // Environment
  NODE_ENV: import.meta.env.MODE,

  // API + Socket URLs
  API_BASE_URL,
  SOCKET_URL,

  // Helper
  getApiUrl,
  getFriendlyErrorMessage,
};
