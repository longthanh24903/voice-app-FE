import React, { useState, useCallback, useEffect } from "react";
import { Header } from "./components/Header";
import { TextAreaPanel } from "./components/TextAreaPanel";
import {
  generateSpeech,
  getUserInfo,
  getVoices,
  setProxyEnabled,
} from "./services/elevenLabsService";
import {
  GenerationStatus,
  Tab,
  type VoiceSettings,
  type HistoryItem,
  type Voice,
  type Model,
  type UserInfo,
  type Task,
  type ApiKeyInfo,
  type ApiVoice,
} from "./types";
import { HistoryTab } from "./components/HistoryTab";
import { GlobalAudioPlayer } from "./components/GlobalAudioPlayer";
import { translations } from "./translations";
import { VoiceSelectionModal } from "./components/VoiceSelectionModal";
import { SettingsTab } from "./components/SettingsTab";
import { ProxySettings } from "./components/ProxySettings";
import { Modal, Button } from "antd";
import { FiShuffle } from "react-icons/fi";

export const VOICES: Voice[] = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/632652b6-2f74-453c-8cc2-27352fe33534.png",
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/5556539a-540c-4586-8a58-db3232a76538.png",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/5d1b32a7-521b-479a-8e5f-758a096a434c.png",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/e4d23259-2162-4299-8589-35760810398f.png",
  },
  {
    id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Eli",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/a0e1a521-e2b3-4099-880d-93a0887a0709.png",
  },
  {
    id: "SOYHLrjzK2X1ezoPC6cr",
    name: "Arnold",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/62fc4b3f-b250-48e0-8a7e-13d4aa3b5503.png",
  },
  {
    id: "ThT5KcBeYPX3CJeVPlVs",
    name: "Charlotte",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/ThT5KcBeYPX3CJeVPlVs/596c8a51-cd54-4654-8167-3da7d7a74087.png",
  },
  {
    id: "ujo3wxzG5OhpWcoi3sMy",
    name: "Michael C. Vincent",
    avatarUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/ujo3wxzG5OhpWcoi3sMy/3006a72a-6523-4b3c-8a55-523e449c2890.png",
  },
];

export const MODELS: Model[] = [
  {
    uiId: "eleven-v3-alpha",
    id: "eleven_v3",
    name: "Eleven v3 (alpha)",
    description:
      "The most expressive model. Supports 70+ languages. Requires more prompt engineering than our previous models. In alpha and the reliability will improve over time.",
    tags: [],
    languages: ["English", "Afrikaans", "Arabic", "+71 more..."],
    availableSettings: ["stability"],
  },
  {
    uiId: "eleven-multilingual-v2",
    id: "eleven_multilingual_v2",
    name: "Eleven Multilingual v2",
    description:
      "Our most life-like, emotionally rich mode in 29 languages. Best for voice overs, audiobooks, post-production, or any other content creation needs.",
    tags: [{ text: "High Quality", color: "blue" }],
    languages: ["English", "Japanese", "Chinese", "+26 more..."],
    availableSettings: [
      "speed",
      "stability",
      "similarity",
      "styleExaggeration",
      "speakerBoost",
    ],
  },
  {
    uiId: "eleven-flash-v2.5",
    id: "eleven_turbo_v2", // Assuming this maps to turbo
    name: "Eleven Flash v2.5",
    description:
      "Our ultra low latency model in 32 languages. Ideal for conversational use cases.",
    tags: [{ text: "50% cheaper", color: "green" }],
    languages: ["English", "Japanese", "Chinese", "+29 more..."],
    availableSettings: ["speed", "stability", "similarity"],
  },
  {
    uiId: "eleven-turbo-v2.5",
    id: "eleven_turbo_v2",
    name: "Eleven Turbo v2.5",
    description:
      "Our high quality, low latency model in 32 languages. Best for developer use cases where speed matters and you need non-English languages.",
    tags: [{ text: "50% cheaper", color: "green" }],
    languages: ["English", "Japanese", "Chinese", "+29 more..."],
    availableSettings: ["speed", "stability", "similarity"],
  },
  {
    uiId: "eleven-turbo-v2",
    id: "eleven_turbo_v2",
    name: "Eleven Turbo v2",
    description:
      "Our English-only, low latency model. Best for developer use cases where speed matters and you only need English. Performance is on par with Turbo v2.5.",
    tags: [{ text: "50% cheaper", color: "green" }],
    languages: ["English"],
    availableSettings: ["speed", "stability", "similarity"],
  },
  {
    uiId: "eleven-flash-v2",
    id: "eleven_monolingual_v1",
    name: "Eleven Flash v2",
    description:
      "Our ultra low latency model in english. Ideal for conversational use cases.",
    tags: [{ text: "50% cheaper", color: "green" }],
    languages: ["English"],
    availableSettings: [
      "speed",
      "stability",
      "similarity",
      "styleExaggeration",
      "speakerBoost",
    ],
  },
  {
    uiId: "eleven-multilingual-v1",
    id: "eleven_multilingual_v1",
    name: "Eleven Multilingual v1",
    description:
      "Our first Multilingual model, capability of generating speech in 10 languages. Now outclassed by Multilingual v2 (for content creation) and Turbo v2.5 (for low latency use cases).",
    tags: [],
    languages: ["English", "German", "Polish", "+6 more..."],
    availableSettings: [
      "speed",
      "stability",
      "similarity",
      "styleExaggeration",
      "speakerBoost",
    ],
  },
];

const App: React.FC = () => {
  const defaultSettings: VoiceSettings = {
    speed: 100,
    stability: 80,
    similarity: 80,
    styleExaggeration: 25,
    speakerBoost: true,
  };

  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialTask: Task = {
    id: Date.now(),
    text: "[incredulous, angry] 'Are you serious?' Jacob's voice was a low, dangerous growl, 'Look at them! There's a baby!'",
  };
  const [tasks, setTasks] = useState<Task[]>([initialTask]);
  const [activeTaskId, setActiveTaskId] = useState<number>(initialTask.id);
  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];

  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [totalUserInfo, setTotalUserInfo] = useState<{
    count: number;
    limit: number;
  } | null>(null);

  const [allVoices, setAllVoices] = useState<ApiVoice[]>([]);
  const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(VOICES[6].id); // Default to Charlotte
  const [selectedModelUiId, setSelectedModelUiId] = useState<string>(
    MODELS[0].uiId
  ); // Default to v3 alpha
  const [language, setLanguage] = useState<"en" | "vi">("vi");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [globalAudio, setGlobalAudio] = useState<{
    url: string | null;
    voiceName: string | null;
    text: string | null;
  }>({ url: null, voiceName: null, text: null });

  const [isProxyModalOpen, setProxyModalOpen] = useState(false);

  // Proxy settings - Load from localStorage
  const [proxyEnabled, setProxyEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("elevenlabs_proxy_enabled");
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [proxyServerUrl, setProxyServerUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem("elevenlabs_proxy_server_url") ||
        import.meta.env.VITE_PROXY_SERVER_URL ||
        "http://localhost:3000"
      );
    } catch {
      return import.meta.env.VITE_PROXY_SERVER_URL || "http://localhost:3000";
    }
  });
  const [forwardSecret, setForwardSecret] = useState<string>(() => {
    try {
      return (
        localStorage.getItem("elevenlabs_proxy_secret") ||
        import.meta.env.VITE_PROXY_SECRET ||
        ""
      );
    } catch {
      return import.meta.env.VITE_PROXY_SECRET || "";
    }
  });

  // Load API keys from localStorage on mount
  useEffect(() => {
    const loadStoredKeys = async () => {
      try {
        const storedKeys = localStorage.getItem("elevenlabs_api_keys");
        if (storedKeys) {
          const keys = JSON.parse(storedKeys);
          if (keys.length > 0 && Array.isArray(keys)) {
            await handleImportKeys(keys);
          }
        }
      } catch (error) {
        console.error("Failed to load API keys from localStorage:", error);
      }
    };
    loadStoredKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save API keys to localStorage when changed
  useEffect(() => {
    if (apiKeys.length > 0) {
      try {
        const keysToSave = apiKeys.map((k) => k.key);
        localStorage.setItem("elevenlabs_api_keys", JSON.stringify(keysToSave));
      } catch (error) {
        console.error("Failed to save API keys to localStorage:", error);
      }
    }
  }, [apiKeys]);

  // Update proxy enabled state in service
  useEffect(() => {
    setProxyEnabled(proxyEnabled);
    localStorage.setItem(
      "elevenlabs_proxy_enabled",
      JSON.stringify(proxyEnabled)
    );
  }, [proxyEnabled]);

  // Save proxy settings to localStorage
  useEffect(() => {
    localStorage.setItem("elevenlabs_proxy_server_url", proxyServerUrl);
  }, [proxyServerUrl]);

  useEffect(() => {
    localStorage.setItem("elevenlabs_proxy_secret", forwardSecret);
  }, [forwardSecret]);

  const t = translations[language];

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const fetchAllUserInfo = useCallback(
    async (keysToFetch: string[]): Promise<ApiKeyInfo[]> => {
      if (keysToFetch.length === 0) {
        setApiKeys([]);
        setTotalUserInfo(null);
        return [];
      }

      const results = await Promise.allSettled(
        keysToFetch.map((key) =>
          getUserInfo(key)
            .then((info) => ({ key, info, error: null }))
            .catch((err) => ({ key, info: null, error: err.message }))
        )
      );

      const keyInfos: ApiKeyInfo[] = results.map((result) => {
        if (result.status === "fulfilled") {
          return { ...result.value, hasGenerationError: false };
        }
        const rejectedResult = result as PromiseRejectedResult;
        const originalKey =
          (rejectedResult.reason as any)?.key ||
          keysToFetch[results.indexOf(result)];
        return {
          key: originalKey,
          info: null,
          error: (rejectedResult.reason as Error).message || "Unknown error",
          hasGenerationError: false,
        };
      });

      setApiKeys(keyInfos);

      const validKeys = keyInfos.filter((k) => k.info);
      if (validKeys.length > 0) {
        const total = validKeys.reduce(
          (acc, k) => {
            acc.count += k.info!.character_count;
            acc.limit += k.info!.character_limit;
            return acc;
          },
          { count: 0, limit: 1 }
        );
        setTotalUserInfo(total);
      } else {
        setTotalUserInfo(null);
      }
      return keyInfos;
    },
    []
  );

  useEffect(() => {
    const fetchAllVoices = async () => {
      const firstValidKey = apiKeys.find((k) => k.info)?.key;
      if (firstValidKey) {
        try {
          const voicesFromApi = await getVoices(firstValidKey);
          const premadeVoices = voicesFromApi.filter(
            (v) => v.category !== "cloned" && v.preview_url
          );
          setAllVoices(premadeVoices);
        } catch (error) {
          console.error("Failed to fetch voices:", error);
          setAllVoices([]);
        }
      } else {
        setAllVoices([]);
      }
    };
    fetchAllVoices();
  }, [apiKeys]);

  const handleImportKeys = useCallback(
    async (keys: string[]) => {
      setIsLoading(true);
      const uniqueKeys = [
        ...new Set(keys.map((k) => k.trim()).filter(Boolean)),
      ];
      await fetchAllUserInfo(uniqueKeys);
      setIsLoading(false);
    },
    [fetchAllUserInfo]
  );

  const refreshCurrentKeysInfo = useCallback(async (): Promise<
    ApiKeyInfo[]
  > => {
    if (apiKeys.length === 0) return [];
    setIsLoading(true);
    const newKeys = await fetchAllUserInfo(apiKeys.map((k) => k.key));
    setIsLoading(false);
    return newKeys;
  }, [apiKeys, fetchAllUserInfo]);

  const generateAndTrackHistory = useCallback(
    async (
      historyItemId: number,
      textToGenerate: string,
      currentApiKeys: ApiKeyInfo[]
    ) => {
      const selectedModel =
        MODELS.find((m) => m.uiId === selectedModelUiId) || MODELS[0];
      const selectedVoiceName =
        allVoices.find((v) => v.voice_id === selectedVoiceId)?.name ||
        VOICES.find((v) => v.id === selectedVoiceId)?.name ||
        "Custom Voice";

      const updateHistory = (updates: Partial<HistoryItem>) => {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === historyItemId ? { ...item, ...updates } : item
          )
        );
      };

      const updateKeyError = (key: string, hasError: boolean) => {
        setApiKeys((prev) =>
          prev.map((k) =>
            k.key === key ? { ...k, hasGenerationError: hasError } : k
          )
        );
      };

      // Reset errors on new generation - only reset if it's not a persistent error
      apiKeys.forEach((k) => {
        // Only reset if the error is not a quota/limit error
        if (k.hasGenerationError && k.info) {
          updateKeyError(k.key, false);
        }
      });

      updateHistory({
        status: GenerationStatus.GENERATING,
        voiceName: selectedVoiceName,
        voiceId: selectedVoiceId,
        settings,
        modelId: selectedModel.id,
        modelName: selectedModel.name,
      });

      const MIN_QUOTA = 120;
      const keysWithEnoughQuota = currentApiKeys.filter(
        (k) =>
          k.info && k.info.character_limit - k.info.character_count >= MIN_QUOTA
      );

      if (keysWithEnoughQuota.length === 0) {
        updateHistory({
          status: GenerationStatus.FAILED,
          errorMessage: t.errors.noKeysWithEnoughQuota,
        });
        return;
      }

      // --- Auto-Switch Key Logic ---
      const generateWithAutoSwitch = async (text: string): Promise<Blob> => {
        const availableKeys = keysWithEnoughQuota.filter(
          (k) => !k.hasGenerationError
        );

        if (availableKeys.length === 0) {
          throw new Error("No available API keys");
        }

        // Sort keys by available quota (highest first)
        const sortedKeys = availableKeys.sort(
          (a, b) =>
            b.info!.character_limit -
            b.info!.character_count -
            (a.info!.character_limit - a.info!.character_count)
        );

        let lastError: Error | null = null;

        for (const keyInfo of sortedKeys) {
          try {
            console.log(`Trying key: ${keyInfo.key.substring(0, 8)}...`);

            const audioBlob = await generateSpeech(
              text,
              settings,
              keyInfo.key,
              selectedVoiceId,
              selectedModel.id
            );

            console.log(`Success with key: ${keyInfo.key.substring(0, 8)}...`);
            return audioBlob;
          } catch (error: any) {
            console.log(
              `Key ${keyInfo.key.substring(0, 8)}... failed:`,
              error.message
            );
            lastError = error;

            // Check error type to determine if we should retry with other keys
            const isVoiceError = error.message.includes("was not found");
            const isQuotaError =
              error.message.includes("character_limit_reached") ||
              error.message.includes("quota") ||
              error.message.includes("limit");
            const isAuthError =
              error.message.includes("Invalid API Key") ||
              error.message.includes("401");

            // Mark this key as having generation error
            updateKeyError(keyInfo.key, true);

            // Don't retry for voice errors or auth errors
            if (isVoiceError) {
              alert(t.errors.voiceNotFound);
              throw error;
            }

            if (isAuthError) {
              console.log(
                `Key ${keyInfo.key.substring(
                  0,
                  8
                )}... has auth error, skipping retry`
              );
              continue;
            }

            if (isQuotaError) {
              console.log(
                `Key ${keyInfo.key.substring(
                  0,
                  8
                )}... quota exceeded, trying next key`
              );
              continue;
            }

            // For other errors, continue to next key
            console.log(
              `Key ${keyInfo.key.substring(
                0,
                8
              )}... had other error, trying next key`
            );
            continue;
          }
        }

        // If we get here, all keys failed
        throw lastError || new Error("All API keys failed");
      };

      try {
        const audioBlob = await generateWithAutoSwitch(textToGenerate);
        const url = URL.createObjectURL(audioBlob);
        updateHistory({
          status: GenerationStatus.COMPLETED,
          audioUrl: url,
          progress: 100,
        });
      } catch (error: any) {
        const errorMessage = error.message || "All API keys failed";
        const hasTriedMultipleKeys = keysWithEnoughQuota.length > 1;

        updateHistory({
          status: GenerationStatus.FAILED,
          errorMessage: hasTriedMultipleKeys
            ? `${errorMessage} (Tried ${keysWithEnoughQuota.length} keys)`
            : errorMessage,
        });
      }
    },
    [settings, selectedVoiceId, selectedModelUiId, allVoices, apiKeys, t.errors]
  );

  const handleGenerateSpeech = useCallback(async () => {
    if (
      isLoading ||
      !activeTask?.text.trim() ||
      apiKeys.filter((k) => k.info).length === 0
    )
      return;

    setIsLoading(true);
    const currentKeys = await refreshCurrentKeysInfo();

    const newHistoryItem: HistoryItem = {
      id: Date.now(),
      fullText: activeTask.text,
      date: new Date().toISOString(),
      status: GenerationStatus.QUEUED,
      audioUrl: null,
      voiceName: "",
      voiceId: "",
      settings: settings,
      modelId: "",
      modelName: "",
    };
    setHistory((prev) => [newHistoryItem, ...prev]);
    setActiveTab(Tab.HISTORY);

    await generateAndTrackHistory(
      newHistoryItem.id,
      activeTask.text,
      currentKeys
    );

    setIsLoading(false);
    refreshCurrentKeysInfo();
  }, [
    activeTask,
    isLoading,
    apiKeys,
    generateAndTrackHistory,
    refreshCurrentKeysInfo,
    settings,
  ]);

  const handleGenerateAll = useCallback(async () => {
    const tasksToGenerate = tasks.filter((task) => task.text.trim());
    if (
      isLoading ||
      tasksToGenerate.length === 0 ||
      apiKeys.filter((k) => k.info).length === 0
    )
      return;

    setIsLoading(true);
    setActiveTab(Tab.HISTORY);

    const newHistoryItems: HistoryItem[] = tasksToGenerate.map((task) => ({
      id: Date.now() + Math.random(),
      fullText: task.text,
      date: new Date().toISOString(),
      status: GenerationStatus.QUEUED,
      audioUrl: null,
      voiceName: "",
      voiceId: "",
      settings: settings,
      modelId: "",
      modelName: "",
    }));
    setHistory((prev) => [...newHistoryItems, ...prev]);

    for (const item of newHistoryItems) {
      const currentKeys = await refreshCurrentKeysInfo();
      await generateAndTrackHistory(item.id, item.fullText, currentKeys);
    }

    setIsLoading(false);
    refreshCurrentKeysInfo();
  }, [
    tasks,
    isLoading,
    apiKeys,
    generateAndTrackHistory,
    refreshCurrentKeysInfo,
    settings,
  ]);

  const handleResetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleDeleteHistoryItem = useCallback((id: number) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleRenameHistoryItem = useCallback((id: number, newName: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, customName: newName } : item
      )
    );
  }, []);

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleRegenerate = useCallback(
    (itemToRegen: HistoryItem) => {
      const existingTask = tasks.find((t) => t.text === itemToRegen.fullText);
      if (existingTask) {
        setActiveTaskId(existingTask.id);
      } else {
        const newTaskId = Date.now();
        const newTask: Task = { id: newTaskId, text: itemToRegen.fullText };
        setTasks((prev) => [...prev, newTask]);
        setActiveTaskId(newTaskId);
      }

      setSettings(itemToRegen.settings);
      setSelectedVoiceId(itemToRegen.voiceId);
      const model = MODELS.find((m) => m.id === itemToRegen.modelId);
      if (model) {
        setSelectedModelUiId(model.uiId);
      }
      setActiveTab(Tab.SETTINGS);
    },
    [tasks]
  );

  const handlePlayAudio = useCallback(
    (url: string, voiceName: string, text: string) => {
      setGlobalAudio({ url, voiceName, text });
    },
    []
  );

  const handleTaskChange = (id: number, newText: string) => {
    setTasks((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, text: newText } : task))
    );
  };

  const handleAddTask = () => {
    const newTaskId = Date.now();
    const newTask: Task = { id: newTaskId, text: "" };
    setTasks((prev) => [...prev, newTask]);
    setActiveTaskId(newTaskId);
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => {
      const newTasks = prev.filter((task) => task.id !== id);
      if (activeTaskId === id) {
        setActiveTaskId(newTasks[0]?.id || 0);
      }
      return newTasks;
    });
  };

  const handleImportTasksFromFile = (fileContent: string) => {
    // Import tất cả nội dung vào task hiện tại thay vì tạo nhiều task
    const trimmedContent = fileContent.trim();
    if (trimmedContent) {
      // Cập nhật task hiện tại với nội dung import
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeTaskId ? { ...task, text: trimmedContent } : task
        )
      );
    } else {
      // Nếu file trống, xóa nội dung task hiện tại
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeTaskId ? { ...task, text: "" } : task
        )
      );
    }
  };

  const handleSplitText = (text: string, wordsPerTask: number) => {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const tasks: Task[] = [];

    for (let i = 0; i < words.length; i += wordsPerTask) {
      const chunkWords = words.slice(i, i + wordsPerTask);
      const chunkText = chunkWords.join(" ");

      if (chunkText.trim()) {
        tasks.push({
          id: Date.now() + Math.random() + i,
          text: chunkText.trim(),
        });
      }
    }

    if (tasks.length > 0) {
      setTasks(tasks);
      setActiveTaskId(tasks[0].id);
    }
  };

  const handleClearAllTasks = () => {
    if (window.confirm(t.confirmClearAll)) {
      const newTask: Task = { id: Date.now(), text: "" };
      setTasks([newTask]);
      setActiveTaskId(newTask.id);
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setVoiceModalOpen(false);
  };

  const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-1 py-2 text-sm font-semibold transition-colors ${
        activeTab === tab
          ? "text-primary border-b-2 border-[#3B82F6] dark:text-stone-100 dark:border-stone-100"
          : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 flex flex-col">
      <Header
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-8 items-start">
        <div className="sticky top-24 lg:col-span-3 order-2 lg:order-1">
          <TextAreaPanel
            tasks={tasks}
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onTextChange={handleTaskChange}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onImportTasks={handleImportTasksFromFile}
            onSplitText={handleSplitText}
            onClearAllTasks={handleClearAllTasks}
            onGenerate={handleGenerateSpeech}
            onGenerateAll={handleGenerateAll}
            isLoading={isLoading}
            hasApiKeys={apiKeys.filter((k) => k.info).length > 0}
            totalUserInfo={totalUserInfo}
            t={t}
          />
        </div>
        <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col md:flex-row">
          <div className="lg:w-full order-1 lg:order-2 bg-white dark:bg-stone-900/50 p-4 sm:p-6 rounded-lg h-auto lg:h-full flex flex-col border border-gray-300 dark:border-stone-700 shadow-sm card-hover lg:sticky lg:top-24">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-stone-200 dark:border-stone-700 mb-6">
              <div className="flex items-center gap-6">
                <TabButton tab={Tab.SETTINGS} label={t.settings} />
                <TabButton tab={Tab.HISTORY} label={t.history} />
              </div>
              <button
                onClick={() => setProxyModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-md hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                title={t.proxySettings}
              >
                <FiShuffle />
                {t.proxySettings}
              </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
              {activeTab === Tab.SETTINGS && (
                <SettingsTab
                  settings={settings}
                  onSettingsChange={setSettings}
                  onReset={handleResetSettings}
                  onImportKeys={handleImportKeys}
                  onRefreshKeys={refreshCurrentKeysInfo}
                  apiKeys={apiKeys}
                  totalUserInfo={totalUserInfo}
                  voices={allVoices}
                  models={MODELS}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                  onOpenVoiceModal={() => setVoiceModalOpen(true)}
                  selectedModelUiId={selectedModelUiId}
                  onModelChange={setSelectedModelUiId}
                  t={t}
                  isLoading={isLoading}
                />
              )}
              {activeTab === Tab.HISTORY && (
                <HistoryTab
                  history={history}
                  onDeleteItem={handleDeleteHistoryItem}
                  onRenameItem={handleRenameHistoryItem}
                  onRegenerateItem={handleRegenerate}
                  onPlayAudio={handlePlayAudio}
                  onClearAllHistory={handleClearAllHistory}
                  t={t}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Modal
        open={isProxyModalOpen}
        onCancel={() => setProxyModalOpen(false)}
        footer={null}
        title={t.proxySettings}
        width={720}
        centered
      >
        <ProxySettings
          enabled={proxyEnabled}
          onEnabledChange={setProxyEnabledState}
          proxyServerUrl={proxyServerUrl}
          onProxyServerUrlChange={setProxyServerUrl}
          forwardSecret={forwardSecret}
          onForwardSecretChange={setForwardSecret}
          t={t}
        />
      </Modal>
      <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        voices={allVoices}
        onSelectVoice={handleSelectVoice}
        t={t}
      />
      {globalAudio.url && (
        <GlobalAudioPlayer
          audioUrl={globalAudio.url}
          voiceName={globalAudio.voiceName || "Generated Audio"}
          textForFilename={globalAudio.text || ""}
          onClose={() =>
            setGlobalAudio({ url: null, voiceName: null, text: null })
          }
        />
      )}
    </div>
  );
};

export default App;
