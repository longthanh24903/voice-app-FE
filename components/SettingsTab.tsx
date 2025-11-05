import React, { useState, useRef, useEffect } from "react";
import type {
  VoiceSettings,
  ApiVoice,
  Model,
  ModelTag,
  SettingKey,
  ApiKeyInfo,
} from "../types";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";
import { ChevronRightIcon } from "./icons/ChevronRightIcon";
import { RefreshCwIcon } from "./icons/RefreshCwIcon";
import { CheckIcon } from "./icons/CheckIcon";
import type { Translations } from "../translations";
import { InfoIcon } from "./icons/InfoIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import { AlertTriangleIcon } from "./icons/AlertTriangleIcon";
import { RefreshIcon } from "./icons/RefreshIcon";
import { Input, Select } from "antd";

interface SettingsTabProps {
  settings: VoiceSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<VoiceSettings>>;
  onReset: () => void;
  onImportKeys: (keys: string[]) => void;
  onRefreshKeys: () => void;
  apiKeys: ApiKeyInfo[];
  totalUserInfo: { count: number; limit: number } | null;
  voices: ApiVoice[];
  models: Model[];
  selectedVoiceId: string;
  onVoiceChange: (id: string) => void;
  onOpenVoiceModal: () => void;
  selectedModelUiId: string;
  onModelChange: (uiId: string) => void;
  t: Translations["en"];
  isLoading: boolean;
}

const Tag: React.FC<{ tag: ModelTag }> = ({ tag }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    gray: "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        colorClasses[tag.color]
      }`}
    >
      {tag.text}
    </span>
  );
};

const ApiKeyManager: React.FC<{
  onImportKeys: (keys: string[]) => void;
  onRefreshKeys: () => void;
  apiKeys: ApiKeyInfo[];
  totalUserInfo: { count: number; limit: number } | null;
  t: Translations["en"];
  isLoading: boolean;
}> = ({
  onImportKeys,
  onRefreshKeys,
  apiKeys,
  totalUserInfo,
  t,
  isLoading,
}) => {
  const [keysInput, setKeysInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setKeysInput(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    const keys = keysInput
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean);
    onImportKeys(keys);
    setKeysInput(""); // Clear input after import
  };

  const validKeys = apiKeys.filter((k) => k.info);
  const invalidKeys = apiKeys.filter((k) => k.error);

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
        {t.multiApiKey}
      </h3>
      <textarea
        value={keysInput}
        onChange={(e) => setKeysInput(e.target.value)}
        placeholder={t.pasteKeys}
        rows={4}
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
            className="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline"
          >
            {t.uploadFile}
          </button>
        </div>
        <button
          onClick={handleImportClick}
          disabled={isLoading || !keysInput.trim()}
          className="flex items-center justify-center btn-primary px-4 py-2 disabled:bg-stone-400 dark:disabled:bg-stone-600 text-xs"
        >
          {isLoading ? <SpinnerIcon /> : t.importKeys}
        </button>
      </div>
      {apiKeys.length > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {validKeys.length > 0 && (
            <div className="bg-green-50 text-green-800 p-3 rounded-lg border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {t.keysImported(validKeys.length)}
                  </p>
                  {totalUserInfo && (
                    <div className="flex items-center gap-2">
                      <p>
                        {t.totalChars}:{" "}
                        {(
                          totalUserInfo.limit - totalUserInfo.count
                        ).toLocaleString()}
                      </p>
                      <button
                        onClick={onRefreshKeys}
                        disabled={isLoading}
                        title={t.refreshQuotas}
                        className="text-green-700 hover:text-green-900 disabled:text-stone-400 dark:text-green-400 dark:hover:text-green-200"
                      >
                        {isLoading ? <SpinnerIcon /> : <RefreshIcon />}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDetailsVisible(!detailsVisible)}
                  className="text-xs font-semibold underline hover:text-green-900 dark:hover:text-green-100 flex-shrink-0 mt-1"
                >
                  {detailsVisible ? t.hideDetails : t.viewDetails}
                </button>
              </div>
              {detailsVisible && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/50">
                  <h4 className="font-semibold text-xs uppercase mb-2 text-green-700 dark:text-green-400">
                    {t.keyDetails}
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {validKeys.map((k) => (
                      <li
                        key={k.key}
                        className={`flex justify-between font-mono ${
                          k.hasGenerationError
                            ? "text-red-500 dark:text-red-400 font-semibold"
                            : ""
                        }`}
                      >
                        <span>{`***${k.key.substring(k.key.length - 4)}`}</span>
                        <span>
                          {t.remaining}:{" "}
                          {(
                            k.info!.character_limit - k.info!.character_count
                          ).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {invalidKeys.length > 0 && !isLoading && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50">
              <p className="font-semibold">{t.invalidKeysFound}</p>
              <ul className="list-disc list-inside">
                {invalidKeys.map((k) => (
                  <li key={k.key}>
                    <code>{`${k.key.substring(0, 4)}...${k.key.substring(
                      k.key.length - 4
                    )}`}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsChange,
  onReset,
  onImportKeys,
  onRefreshKeys,
  apiKeys,
  totalUserInfo,
  voices,
  models,
  selectedVoiceId,
  onVoiceChange,
  onOpenVoiceModal,
  selectedModelUiId,
  onModelChange,
  t,
  isLoading,
}) => {
  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId);
  const selectedModel =
    models.find((m) => m.uiId === selectedModelUiId) || models[0];
  const hasInvalidKeys = apiKeys.some((k) => k.error);
  const hasValidKeys = apiKeys.some((k) => k.info);

  const handleSliderChange = (key: keyof VoiceSettings, value: number) => {
    onSettingsChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: keyof VoiceSettings, value: boolean) => {
    onSettingsChange((prev) => ({ ...prev, [key]: value }));
  };

  // Model selection now uses antd Select; no manual dropdown handling needed

  const isSettingVisible = (setting: SettingKey) =>
    selectedModel.availableSettings.includes(setting);

  return (
    <div className="space-y-8">
      {hasInvalidKeys && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm flex gap-3 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/50">
          <AlertTriangleIcon />
          <div>
            <span className="font-semibold">{t.invalidKeyWarning.title}</span>
            <br />
            {t.invalidKeyWarning.body}
          </div>
        </div>
      )}

      <ApiKeyManager
        onImportKeys={onImportKeys}
        onRefreshKeys={onRefreshKeys}
        apiKeys={apiKeys}
        totalUserInfo={totalUserInfo}
        t={t}
        isLoading={isLoading}
      />

      <div>
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
          {t.voice}
        </h3>
        <button
          onClick={onOpenVoiceModal}
          disabled={!hasValidKeys}
          className="w-full flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg hover:border-stone-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-stone-800 dark:border-stone-700 dark:hover:border-stone-500"
        >
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {selectedVoice ? selectedVoice.name : t.customVoice}
          </span>
          <ChevronRightIcon />
        </button>
        <div className="mt-3">
          <label
            htmlFor="custom-voice-id"
            className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
          >
            {t.customVoiceId}
          </label>
          <Input
            id="custom-voice-id"
            size="middle"
            value={selectedVoiceId}
            onChange={(e) => onVoiceChange(e.target.value)}
            placeholder="e.g., 21m00Tcm4TlvDq8ikWAM"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
          {t.model}
        </h3>
        <Select
          size="large"
          value={selectedModelUiId}
          onChange={(val) => onModelChange(val)}
          className="w-full"
          options={models.map((m) => ({ value: m.uiId, label: m.name }))}
        />
        {selectedModel.uiId === "eleven-v3-alpha" && (
          <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm flex gap-3 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
            <InfoIcon />
            <div>
              <span className="font-semibold">{t.researchPreview.title}</span>
              <br />
              {t.researchPreview.body}{" "}
              <a href="#" className="underline font-medium">
                {t.researchPreview.link}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isSettingVisible("speed") && (
          <Slider
            label={t.speed}
            value={settings.speed}
            onChange={(val) => handleSliderChange("speed", val)}
            minLabel={t.slower}
            maxLabel={t.faster}
          />
        )}
        {isSettingVisible("stability") && (
          <Slider
            label={t.stability}
            value={settings.stability}
            onChange={(val) => handleSliderChange("stability", val)}
            minLabel={
              selectedModel.uiId === "eleven-v3-alpha"
                ? t.creative
                : t.moreVariable
            }
            maxLabel={
              selectedModel.uiId === "eleven-v3-alpha" ? t.robust : t.moreStable
            }
          />
        )}
        {isSettingVisible("similarity") && (
          <Slider
            label={t.similarity}
            value={settings.similarity}
            onChange={(val) => handleSliderChange("similarity", val)}
            minLabel={t.low}
            maxLabel={t.high}
          />
        )}
        {isSettingVisible("styleExaggeration") && (
          <Slider
            label={t.styleExaggeration}
            value={settings.styleExaggeration}
            onChange={(val) => handleSliderChange("styleExaggeration", val)}
            minLabel={t.none}
            maxLabel={t.exaggerated}
          />
        )}
      </div>

      <div
        className={`flex items-center justify-between pt-4 ${
          isSettingVisible("speakerBoost")
            ? "border-t border-stone-200 dark:border-stone-700"
            : ""
        }`}
      >
        {isSettingVisible("speakerBoost") ? (
          <Toggle
            label={t.speakerBoost}
            enabled={settings.speakerBoost}
            onChange={(val) => handleToggleChange("speakerBoost", val)}
          />
        ) : (
          <div />
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
        >
          <RefreshCwIcon />
          {t.reset}
        </button>
      </div>
    </div>
  );
};
