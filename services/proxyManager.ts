/**
 * Proxy Manager - Manages proxy list in localStorage and syncs with backend
 */

const PROXY_STORAGE_KEY = "elevenlabs_proxy_list";
const PROXY_SERVER_URL_KEY = "elevenlabs_proxy_server_url";
const PROXY_SECRET_KEY = "elevenlabs_proxy_secret";
const PROXY_ENABLED_KEY = "elevenlabs_proxy_enabled";

export interface ProxyItem {
  id: string;
  value: string; // Format: ip:port:user:pass or http://user:pass@ip:port
}

/**
 * Save proxy list to localStorage
 */
export function saveProxiesToStorage(proxies: ProxyItem[]): void {
  try {
    localStorage.setItem(PROXY_STORAGE_KEY, JSON.stringify(proxies));
  } catch (error) {
    console.error("Failed to save proxies to localStorage:", error);
  }
}

/**
 * Load proxy list from localStorage
 */
export function loadProxiesFromStorage(): ProxyItem[] {
  try {
    const stored = localStorage.getItem(PROXY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load proxies from localStorage:", error);
  }
  return [];
}

/**
 * Save proxy server URL to localStorage
 */
export function saveProxyServerUrl(url: string): void {
  try {
    localStorage.setItem(PROXY_SERVER_URL_KEY, url);
  } catch (error) {
    console.error("Failed to save proxy server URL:", error);
  }
}

/**
 * Load proxy server URL from localStorage
 */
export function loadProxyServerUrl(): string {
  try {
    return (
      localStorage.getItem(PROXY_SERVER_URL_KEY) || "http://localhost:3000"
    );
  } catch (error) {
    console.error("Failed to load proxy server URL:", error);
    return "http://localhost:3000";
  }
}

/**
 * Save forward secret to localStorage
 */
export function saveForwardSecret(secret: string): void {
  try {
    localStorage.setItem(PROXY_SECRET_KEY, secret);
  } catch (error) {
    console.error("Failed to save forward secret:", error);
  }
}

/**
 * Load forward secret from localStorage
 */
export function loadForwardSecret(): string {
  try {
    return localStorage.getItem(PROXY_SECRET_KEY) || "";
  } catch (error) {
    console.error("Failed to load forward secret:", error);
    return "";
  }
}

/**
 * Save proxy enabled state to localStorage
 */
export function saveProxyEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PROXY_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error("Failed to save proxy enabled state:", error);
  }
}

/**
 * Load proxy enabled state from localStorage
 */
export function loadProxyEnabled(): boolean {
  try {
    const stored = localStorage.getItem(PROXY_ENABLED_KEY);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error("Failed to load proxy enabled state:", error);
    return false;
  }
}

/**
 * Sync proxies to backend server
 */
export async function syncProxiesToBackend(
  proxies: ProxyItem[],
  serverUrl: string,
  forwardSecret?: string
): Promise<void> {
  try {
    const proxyStrings = proxies.map((p) => p.value).join("\n");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add forward secret header if provided
    if (forwardSecret) {
      headers["x-forward-secret"] = forwardSecret;
    }

    // Send to backend API endpoint to update proxy list
    const response = await fetch(`${serverUrl}/api/proxies`, {
      method: "POST",
      headers,
      body: JSON.stringify({ proxies: proxyStrings }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to sync proxies to backend");
    }
  } catch (error) {
    console.error("Failed to sync proxies to backend:", error);
    // Don't throw - allow local storage to work even if backend sync fails
  }
}
