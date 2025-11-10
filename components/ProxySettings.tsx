import React, { useState, useEffect, useRef } from "react";
import { Toggle } from "./Toggle";
import { proxyService } from "../services/proxyService";
import type { ProxyLog } from "../types";
import type { Translations } from "../translations";
import { RefreshCwIcon } from "./icons/RefreshCwIcon";
import { Trash2Icon } from "./icons/Trash2Icon";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";
import { AlertCircleIcon } from "./icons/AlertCircleIcon";
import { InfoIcon } from "./icons/InfoIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { Input } from "antd";
import {
  saveProxiesToStorage,
  loadProxiesFromStorage,
  saveProxyServerUrl,
  loadProxyServerUrl,
  saveForwardSecret,
  loadForwardSecret,
  saveProxyEnabled,
  syncProxiesToBackend,
  type ProxyItem,
} from "../services/proxyManager";

interface ProxySettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  proxyServerUrl: string;
  onProxyServerUrlChange: (url: string) => void;
  forwardSecret: string;
  onForwardSecretChange: (secret: string) => void;
  t: Translations["vi"] | Translations["en"];
}

export const ProxySettings: React.FC<ProxySettingsProps> = ({
  enabled,
  onEnabledChange,
  proxyServerUrl,
  onProxyServerUrlChange,
  forwardSecret,
  onForwardSecretChange,
  t,
}) => {
  const [logs, setLogs] = useState<ProxyLog[]>([]);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    proxies: number;
    uptime: number;
  } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [newProxyValue, setNewProxyValue] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  // Load proxies from storage on mount and sync to backend
  useEffect(() => {
    const loaded = loadProxiesFromStorage();
    setProxies(loaded);
    
    // Sync existing proxies to backend on mount (if server URL is configured)
    if (loaded.length > 0 && proxyServerUrl) {
      syncProxiesToBackend(loaded, proxyServerUrl, forwardSecret || undefined).catch((error) => {
        console.error("Failed to sync proxies to backend on mount:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save proxies when changed
  useEffect(() => {
    if (proxies.length > 0) {
      saveProxiesToStorage(proxies);
    }
  }, [proxies]);

  // Sync proxies to backend when changed (if proxy server URL is configured)
  // Use debounce to avoid spamming backend with requests
  useEffect(() => {
    // Clear previous timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (proxies.length > 0 && proxyServerUrl) {
      // Debounce sync by 500ms to avoid multiple rapid updates
      syncTimeoutRef.current = window.setTimeout(() => {
        syncProxiesToBackend(proxies, proxyServerUrl, forwardSecret || undefined).catch((error) => {
          console.error("Failed to sync proxies to backend:", error);
          // Don't show error to user - silent fail
        });
      }, 500);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [proxies, proxyServerUrl, forwardSecret]);

  // Save settings to localStorage when changed
  useEffect(() => {
    saveProxyServerUrl(proxyServerUrl);
  }, [proxyServerUrl]);

  useEffect(() => {
    saveForwardSecret(forwardSecret);
  }, [forwardSecret]);

  useEffect(() => {
    saveProxyEnabled(enabled);
  }, [enabled]);

  // Update proxy service configuration
  useEffect(() => {
    proxyService.setProxyServerUrl(proxyServerUrl);
    proxyService.setForwardSecret(forwardSecret || null);
  }, [proxyServerUrl, forwardSecret]);

  // Poll logs
  useEffect(() => {
    const updateLogs = () => {
      setLogs(proxyService.getLogs());
    };

    updateLogs();
    logIntervalRef.current = window.setInterval(updateLogs, 500);

    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    try {
      const health = await proxyService.checkHealth();
      setHealthStatus(health);
    } catch (error: any) {
      setHealthError(error.message);
      setHealthStatus(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleClearLogs = () => {
    proxyService.clearLogs();
    setLogs([]);
  };

  const handleAddProxy = () => {
    if (!newProxyValue.trim()) return;

    const newProxy: ProxyItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      value: newProxyValue.trim(),
    };

    setProxies((prev) => [...prev, newProxy]);
    setNewProxyValue("");
  };

  const handleDeleteProxy = (id: string) => {
    setProxies((prev) => prev.filter((p) => p.id !== id));
  };

  const parseProxyLines = (text: string): string[] => {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((line) => {
        // Accept ip:port:user:pass or http(s)://user:pass@host:port
        const simple = /^[^:\s]+:\d{2,5}:[^:\s]+:[^:\s]+$/; // host:port:user:pass
        const urlLike = /^(https?:\/\/)?[^:\s]+:[^@\s]+@[^:\s]+:\d{2,5}$/i;
        return simple.test(line) || urlLike.test(line);
      });
  };

  const handleImportBulk = () => {
    const lines = parseProxyLines(bulkInput);
    if (lines.length === 0) return;
    setProxies((prev) => {
      const existing = new Set(prev.map((p) => p.value.trim().toLowerCase()));
      const toAdd: ProxyItem[] = [];
      for (const v of lines) {
        const key = v.trim().toLowerCase();
        if (!existing.has(key)) {
          existing.add(key);
          toAdd.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            value: v,
          });
        }
      }
      return [...prev, ...toAdd];
    });
    setBulkInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const lines = parseProxyLines(text);
      if (lines.length === 0) return;
      setProxies((prev) => {
        const existing = new Set(prev.map((p) => p.value.trim().toLowerCase()));
        const toAdd: ProxyItem[] = [];
        for (const v of lines) {
          const key = v.trim().toLowerCase();
          if (!existing.has(key)) {
            existing.add(key);
            toAdd.push({
              id:
                Date.now().toString() + Math.random().toString(36).substr(2, 9),
              value: v,
            });
          }
        }
        return [...prev, ...toAdd];
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getLogIcon = (type: ProxyLog["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
      case "retry":
        return <RefreshCwIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <InfoIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogBgColor = (type: ProxyLog["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50";
      case "error":
        return "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50";
      case "retry":
        return "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50";
      default:
        return "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50";
    }
  };

  const getLogTypeText = (type: ProxyLog["type"]) => {
    switch (type) {
      case "success":
        return "✓ Thành công";
      case "error":
        return "✗ Lỗi";
      case "retry":
        return "↻ Thử lại";
      default:
        return "→ Yêu cầu";
    }
  };

  const formatProxyDisplay = (proxy?: string) => {
    if (!proxy) return null;
    
    // Format: user:pass@host:port or just host:port
    try {
      if (proxy.includes('@')) {
        const [auth, rest] = proxy.split('@');
        const [user] = auth.split(':');
        return `${user}@${rest}`;
      }
      return proxy;
    } catch {
      return proxy;
    }
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto px-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {t.proxyRotation}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {t.proxyRotationDesc}
          </p>
        </div>
        <Toggle label="" enabled={enabled} onChange={onEnabledChange} />
      </div>

      {enabled && (
        <>
          <div>
            <label
              htmlFor="proxy-server-url"
              className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
            >
              {t.proxyServerUrl}
            </label>
            <Input
              id="proxy-server-url"
              size="middle"
              value={proxyServerUrl}
              onChange={(e) => onProxyServerUrlChange(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>

          <div>
            <label
              htmlFor="forward-secret"
              className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
            >
              {t.forwardSecret}
            </label>
            <Input.Password
              id="forward-secret"
              size="middle"
              value={forwardSecret}
              onChange={(e) => onForwardSecretChange(e.target.value)}
              placeholder={t.forwardSecretPlaceholder}
            />
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
              {t.manageProxies}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
              {t.proxyFormat}
            </p>
            <div className="mb-3">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={6}
                placeholder={
                  "Paste proxies (one per line), e.g. 142.111.48.253:7030:user:pass"
                }
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-500 focus:ring-stone-500 transition-colors text-sm dark:bg-stone-800 dark:border-stone-700 dark:focus:border-stone-400"
              />
              <div className="flex items-center justify-between mt-2">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline"
                  >
                    {t.uploadFile}
                  </button>
                </div>
                <button
                  onClick={handleImportBulk}
                  disabled={!bulkInput.trim()}
                  className="btn-primary px-4 py-2 disabled:bg-stone-400 dark:disabled:bg-stone-600 text-xs"
                >
                  Import
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <Input
                size="middle"
                value={newProxyValue}
                onChange={(e) => setNewProxyValue(e.target.value)}
                onPressEnter={handleAddProxy}
                placeholder={t.addProxyPlaceholder}
              />
              <button
                onClick={handleAddProxy}
                disabled={!newProxyValue.trim()}
                className="px-4 py-2 btn-primary disabled:bg-stone-400 dark:disabled:bg-stone-600 text-xs flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {t.addProxy}
              </button>
            </div>

            {proxies.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {proxies.map((proxy) => (
                  <div
                    key={proxy.id}
                    className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700"
                  >
                    <span className="text-sm font-mono text-stone-700 dark:text-stone-200 flex-1 truncate">
                      {proxy.value}
                    </span>
                    <button
                      onClick={() => handleDeleteProxy(proxy.id)}
                      className="ml-2 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                      title={t.deleteProxy}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
                {t.noProxies}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckHealth}
              disabled={isCheckingHealth}
              className="flex items-center gap-2 px-4 py-2 btn-primary disabled:bg-stone-400 dark:disabled:bg-stone-600 text-xs"
            >
              {isCheckingHealth ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  {t.checking}
                </>
              ) : (
                t.checkHealth
              )}
            </button>
            {healthStatus && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-4 h-4" />
                <span>
                  {healthStatus.proxies} {t.proxyRotation.toLowerCase()} có sẵn
                </span>
              </div>
            )}
            {healthError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircleIcon className="w-4 h-4" />
                <span>{healthError}</span>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {t.proxyLogs}
              </h4>
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
              >
                <Trash2Icon className="w-3 h-3" />
                {t.clearLogs}
              </button>
            </div>
            <div className="h-72 overflow-y-auto bg-gradient-to-b from-stone-50 to-stone-100/50 dark:from-stone-900/50 dark:to-stone-800/30 rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-2.5">
              {logs.length === 0 ? (
                <div className="text-sm text-stone-500 dark:text-stone-400 text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <InfoIcon className="w-8 h-8 opacity-50" />
                    <span>{t.noLogsYet}</span>
                  </div>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`group relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getLogBgColor(
                      log.type
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Header: Time and Status Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                            {formatTime(log.timestamp)}
                          </span>
                          <div className="flex items-center gap-2">
                            {log.status && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                log.status >= 200 && log.status < 300
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : log.status >= 400 && log.status < 500
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {log.status}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.type === 'success'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : log.type === 'error'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : log.type === 'retry'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {getLogTypeText(log.type)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Main Message */}
                        <div className="text-sm font-medium text-stone-800 dark:text-stone-100 break-words leading-relaxed">
                          {log.message}
                        </div>
                        
                        {/* Proxy Info - Highlighted */}
                        {log.proxy && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200/50 dark:border-stone-700/50">
                            <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                              Proxy:
                            </span>
                            <span className="px-2 py-1 rounded-md bg-stone-200/60 dark:bg-stone-700/60 text-[11px] font-mono font-semibold text-stone-800 dark:text-stone-200 border border-stone-300/50 dark:border-stone-600/50">
                              {formatProxyDisplay(log.proxy)}
                            </span>
                          </div>
                        )}
                        
                        {/* URL - Collapsed by default */}
                        {log.url && (
                          <details className="mt-1.5">
                            <summary className="text-[10px] text-stone-500 dark:text-stone-400 cursor-pointer hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
                              Xem URL
                            </summary>
                            <div className="mt-1.5 p-2 rounded bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                              <code className="text-[10px] font-mono text-stone-600 dark:text-stone-400 break-all">
                                {log.url}
                              </code>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
