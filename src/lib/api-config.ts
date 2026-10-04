const isProd = import.meta.env.PROD;

const cleanUrlString = (rawUrl?: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let str = rawUrl.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  if (!str || str === 'undefined' || str === 'null') return null;

  // Handle relative path (e.g. "/api" or "/backend")
  if (str.startsWith("/")) {
    return str.replace(/\/+$/, "");
  }

  // Handle protocol-relative URLs (e.g. "//my-backend.onrender.com")
  if (str.startsWith("//")) {
    return `https:${str.replace(/\/+$/, "")}`;
  }

  // Handle full HTTP / HTTPS URLs
  const httpMatch = str.match(/(https?:\/\/[^\s"'<]+)/i);
  if (httpMatch) {
    return httpMatch[1].replace(/\/+$/, "");
  }
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str.replace(/\/+$/, "");
  }

  // Handle bare domains (e.g. "my-exam-backend.onrender.com" or "localhost:10000")
  if (str.includes(".") || str.includes("localhost") || str.includes("127.0.0.1")) {
    const isLocal = str.includes("localhost") || str.includes("127.0.0.1");
    const protocol = isLocal ? "http://" : "https://";
    return `${protocol}${str.replace(/\/+$/, "")}`;
  }

  return null;
};

// Determine API Base URL with fallback logic
const resolveApiBaseUrl = (): string => {
  const envUrl = cleanUrlString(import.meta.env.VITE_API_URL as string);
  if (envUrl !== null) {
    return envUrl;
  }
  if (!isProd) {
    return "http://localhost:10000";
  }
  if (typeof window !== 'undefined') {
    console.warn(
      `[API Config Warning] VITE_API_URL environment variable is missing or empty. Defaulting API_BASE_URL to '${window.location.origin}'. If your backend is hosted separately (e.g., on Render backend service), set VITE_API_URL in your build environment and rebuild.`
    );
    return window.location.origin;
  }
  return "";
};

export const API_BASE_URL = resolveApiBaseUrl();

const resolveSocketUrl = (): string => {
  const envSocketUrl = cleanUrlString(import.meta.env.VITE_SOCKET_URL as string);
  if (envSocketUrl !== null) {
    return envSocketUrl;
  }
  const envApiUrl = cleanUrlString(import.meta.env.VITE_API_URL as string);
  if (envApiUrl !== null && (envApiUrl.startsWith("http") || envApiUrl.startsWith("//"))) {
    return envApiUrl;
  }
  if (!isProd) {
    return "http://localhost:10000";
  }
  return typeof window !== 'undefined' ? window.location.origin : "";
};

export const SOCKET_URL = resolveSocketUrl();

export const getApiUrl = (path: string) => {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!baseUrl) {
    return normalizedPath;
  }
  return `${baseUrl}${normalizedPath}`;
};

export function getFriendlyErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";
  const msg = typeof err === "string" ? err : err?.message || String(err);

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
      if (res.status === 404) {
        throw new Error("API endpoint not found (HTTP 404). Please verify your backend server deployment and route configuration.");
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(`Backend service is temporarily unavailable or restarting (HTTP ${res.status}). Please try again in a moment.`);
      }
      const isMissingEnvApiUrl = !import.meta.env.VITE_API_URL;
      const isSameOrigin = typeof window !== 'undefined' && API_BASE_URL === window.location.origin;
      if (isMissingEnvApiUrl || isSameOrigin) {
        throw new Error(
          "Backend service unreachable or API URL misconfigured. VITE_API_URL environment variable is missing on your frontend deployment. Please set VITE_API_URL to your backend service URL on Render and rebuild."
        );
      }
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
    throw new Error(typeof rawError === "string" ? rawError : String(rawError));
  }

  return (parsed !== null && parsed !== undefined ? parsed : {}) as T;
}

/**
  Fetch wrapper with retry support for cold starts / network glitches.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retries = 4,
  delayMs = 1500
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if ((response.status === 503 || response.status === 502 || response.status === 504) && attempt < retries) {
        // Backend DB is initializing / server spinning up on free hosting
        const currentDelay = delayMs * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, currentDelay));
        continue;
      }
      return response;
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        const currentDelay = delayMs * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, currentDelay));
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
