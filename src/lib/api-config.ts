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
