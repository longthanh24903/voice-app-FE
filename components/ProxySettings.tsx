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
import {
  saveProxiesToStorage,
  loadProxiesFromStorage,
  saveProxyServerUrl,
  loadProxyServerUrl,
  saveForwardSecret,
  loadForwardSecret,
  saveProxyEnabled,
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
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<number | null>(null);

  // Load proxies from storage on mount
  useEffect(() => {
    const loaded = loadProxiesFromStorage();
    setProxies(loaded);
  }, []);

  // Save proxies when changed
  useEffect(() => {
    if (proxies.length > 0) {
      saveProxiesToStorage(proxies);
    }
  }, [proxies]);

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
        return "Thành công";
      case "error":
        return "Lỗi";
      case "retry":
        return "Thử lại";
      default:
        return "Yêu cầu";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {t.proxyRotation}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {t.proxyRotationDesc}
          </p>
        </div>
        <Toggle
          label=""
          enabled={enabled}
          onChange={onEnabledChange}
        />
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
            <input
              id="proxy-server-url"
              type="text"
              value={proxyServerUrl}
              onChange={(e) => onProxyServerUrlChange(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-500 focus:ring-stone-500 transition-colors text-sm dark:bg-stone-800 dark:border-stone-700 dark:focus:border-stone-400"
            />
          </div>

          <div>
            <label
              htmlFor="forward-secret"
              className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
            >
              {t.forwardSecret}
            </label>
            <input
              id="forward-secret"
              type="password"
              value={forwardSecret}
              onChange={(e) => onForwardSecretChange(e.target.value)}
              placeholder={t.forwardSecretPlaceholder}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-500 focus:ring-stone-500 transition-colors text-sm dark:bg-stone-800 dark:border-stone-700 dark:focus:border-stone-400"
            />
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
              {t.manageProxies}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
              {t.proxyFormat}
            </p>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newProxyValue}
                onChange={(e) => setNewProxyValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddProxy();
                  }
                }}
                placeholder={t.addProxyPlaceholder}
                className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-500 focus:ring-stone-500 transition-colors text-sm dark:bg-stone-800 dark:border-stone-700 dark:focus:border-stone-400"
              />
              <button
                onClick={handleAddProxy}
                disabled={!newProxyValue.trim()}
                className="px-4 py-2 bg-stone-700 text-white font-semibold rounded-lg hover:bg-stone-800 disabled:bg-stone-400 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white dark:disabled:bg-stone-600 text-sm flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {t.addProxy}
              </button>
            </div>

            {proxies.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
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
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 text-white font-semibold rounded-lg hover:bg-stone-800 disabled:bg-stone-400 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white dark:disabled:bg-stone-600 text-sm"
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
            <div className="h-64 overflow-y-auto bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-2">
              {logs.length === 0 ? (
                <div className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
                  {t.noLogsYet}
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border text-xs ${getLogBgColor(log.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getLogIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                            {formatTime(log.timestamp)}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">
                            {getLogTypeText(log.type)}
                          </span>
                          {log.status && (
                            <span className="font-semibold text-stone-700 dark:text-stone-300">
                              Trạng thái: {log.status}
                            </span>
                          )}
                        </div>
                        <div className="text-stone-700 dark:text-stone-200 break-words">
                          {log.message}
                        </div>
                        {log.proxy && (
                          <div className="mt-1 text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                            Proxy: {log.proxy}
                          </div>
                        )}
                        {log.url && (
                          <div className="mt-1 text-[10px] text-stone-600 dark:text-stone-400 truncate">
                            URL: {log.url}
                          </div>
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
