export interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  success: boolean;
  status: number;
  headers: Record<string, string>;
  body: any;
}

export interface ProxyLog {
  id: string;
  timestamp: Date;
  type: 'request' | 'success' | 'error' | 'retry';
  message: string;
  proxy?: string;
  status?: number;
  url?: string;
}

class ProxyService {
  private proxyServerUrl: string;
  private forwardSecret: string | null = null;
  private logs: ProxyLog[] = [];
  private maxLogs = 100;

  constructor() {
    // Get from environment or use default
    this.proxyServerUrl = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3000';
    this.forwardSecret = import.meta.env.VITE_PROXY_SECRET || null;
  }

  /**
   * Set proxy server URL
   */
  setProxyServerUrl(url: string) {
    this.proxyServerUrl = url;
  }

  /**
   * Set forward secret
   */
  setForwardSecret(secret: string | null) {
    this.forwardSecret = secret;
  }

  /**
   * Add log entry
   */
  private addLog(type: ProxyLog['type'], message: string, proxy?: string, status?: number, url?: string) {
    const log: ProxyLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
      proxy,
      status,
      url,
    };
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ProxyLog[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Make request through proxy
   */
  async makeRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const requestUrl = `${this.proxyServerUrl}/api/proxy-request`;
    
    // Extract endpoint name from URL for cleaner log
    const endpointName = this.extractEndpointName(request.url);
    this.addLog('request', `Đang gửi yêu cầu: ${endpointName}`, undefined, undefined, request.url);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.forwardSecret) {
        headers['x-forward-secret'] = this.forwardSecret;
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: request.url,
          method: request.method || 'GET',
          headers: request.headers || {},
          body: request.body,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Lỗi ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + '...' : errorText;
            }
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      // Get response body
      const contentType = response.headers.get('content-type') || '';
      let body: any;
      
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else if (contentType.includes('text/')) {
        body = await response.text();
      } else if (contentType.includes('audio/') || contentType.includes('binary') || contentType.includes('octet-stream')) {
        body = await response.blob();
      } else {
        // Try to detect binary content
        try {
          const text = await response.text();
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        } catch {
          body = await response.blob();
        }
      }

      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Extract proxy info from response header if available (backend includes this)
      const proxyInfo = response.headers.get('x-proxy-used') || undefined;

      const result: ProxyResponse = {
        success: true,
        status: response.status,
        headers: responseHeaders,
        body,
      };

      this.addLog('success', `Thành công: ${endpointName}`, proxyInfo, response.status, request.url);
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi không xác định';
      const shortError = errorMsg.length > 80 ? errorMsg.substring(0, 80) + '...' : errorMsg;
      this.addLog('error', `Thất bại: ${shortError}`, undefined, undefined, request.url);
      throw error;
    }
  }

  /**
   * Extract endpoint name from URL for cleaner log display
   */
  private extractEndpointName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Extract meaningful endpoint name
      if (path.includes('/text-to-speech/')) {
        return 'Tạo giọng nói';
      } else if (path.includes('/voices')) {
        return 'Danh sách giọng';
      } else if (path.includes('/user')) {
        return 'Thông tin người dùng';
      } else if (path.includes('/history')) {
        return 'Lịch sử';
      }
      
      // Return last part of path or full path if short
      const parts = path.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : path;
    } catch {
      return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }
  }

  /**
   * Check proxy server health
   */
  async checkHealth(): Promise<{ status: string; proxies: number; uptime: number }> {
    try {
      const response = await fetch(`${this.proxyServerUrl}/health`);
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return await response.json();
    } catch (error) {
      throw new Error('Proxy server is not available');
    }
  }
}

export const proxyService = new ProxyService();

