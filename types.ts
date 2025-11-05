export interface Voice {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ApiVoice {
  voice_id: string;
  name: string;
  description: string | null;
  labels: Record<string, string>;
  preview_url: string;
  category: string;
}

export interface ModelTag {
  text: string;
  color: "blue" | "green" | "gray";
}

export type SettingKey =
  | "speed"
  | "stability"
  | "similarity"
  | "styleExaggeration"
  | "speakerBoost";

export interface Model {
  uiId: string;
  id: string; // API model_id
  name: string;
  description: string;
  tags: ModelTag[];
  languages: string[];
  availableSettings: SettingKey[];
}

export interface UserInfo {
  character_count: number;
  character_limit: number;
}

export interface ApiKeyInfo {
  key: string;
  info: UserInfo | null;
  error: string | null; // For validation errors
  hasGenerationError?: boolean; // For runtime generation errors
}

export interface VoiceSettings {
  speed: number;
  stability: number;
  similarity: number;
  styleExaggeration: number;
  speakerBoost: boolean;
}

export enum GenerationStatus {
  QUEUED = "QUEUED",
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface Task {
  id: number;
  text: string;
}

export interface HistoryItem {
  id: number;
  fullText: string;
  customName?: string;
  date: string;
  status: GenerationStatus;
  audioUrl: string | null;
  voiceName: string;
  voiceId: string;
  settings: VoiceSettings;
  modelId: string;
  modelName: string;
  progress?: number;
  errorMessage?: string;
}

export enum Tab {
  SETTINGS = "SETTINGS",
  HISTORY = "HISTORY",
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