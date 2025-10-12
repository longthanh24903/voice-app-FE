import React, { useState, useRef, useEffect, useMemo } from "react";
import type { HistoryItem } from "../types";
import { GenerationStatus } from "../types";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { DownloadIcon } from "./icons/DownloadIcon";
import { MoreHorizontalIcon } from "./icons/MoreHorizontalIcon";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";
import { HistoryDetailModal } from "./HistoryDetailModal";
import { EditIcon } from "./icons/EditIcon";
import { RefreshCcwIcon } from "./icons/RefreshCcwIcon";
import { FileTextIcon } from "./icons/FileTextIcon";
import { Trash2Icon } from "./icons/Trash2Icon";
import { ChevronsLeftIcon } from "./icons/ChevronsLeftIcon";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import { ChevronRightIcon } from "./icons/ChevronRightIcon";
import { ChevronsRightIcon } from "./icons/ChevronsRightIcon";
import type { Translations } from "../translations";
import { AlertCircleIcon } from "./icons/AlertCircleIcon";

interface HistoryTabProps {
  history: HistoryItem[];
  onDeleteItem: (id: number) => void;
  onRenameItem: (id: number, newName: string) => void;
  onRegenerateItem: (item: HistoryItem) => void;
  onPlayAudio: (url: string, voiceName: string, text: string) => void;
  onClearAllHistory: () => void;
  t: Translations["en"];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${time} ${day}/${month}/${year}`;
};

const truncateText = (text: string, length = 40) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

const generateFilename = (text: string): string => {
  const safeText = text
    .substring(0, 100)
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // Keep letters, numbers, spaces, hyphens
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
  return `${safeText || "speech"}.mp3`;
};

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  onDeleteItem,
  onRenameItem,
  onRegenerateItem,
  onPlayAudio,
  onClearAllHistory,
  t,
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<HistoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const indexedHistory = useMemo(
    () =>
      history.map((item, index) => ({
        ...item,
        taskNumber: index + 1,
      })),
    [history]
  );

  const totalPages = Math.ceil(indexedHistory.length / itemsPerPage);
  const paginatedHistory = indexedHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const completedOnPage = paginatedHistory.filter(
    (item) => item.status === GenerationStatus.COMPLETED
  );
  const allOnPageSelected =
    completedOnPage.length > 0 &&
    completedOnPage.every((item) => selectedIds.has(item.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editingItem]);

  const handleSaveRename = () => {
    if (editingItem) {
      onRenameItem(editingItem.id, editingItem.name);
      setEditingItem(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setEditingItem(null);
    }
  };

  const handleSelectAll = () => {
    const newSelectedIds = new Set(selectedIds);
    if (allOnPageSelected) {
      completedOnPage.forEach((item) => newSelectedIds.delete(item.id));
    } else {
      completedOnPage.forEach((item) => newSelectedIds.add(item.id));
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectOne = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleDownloadSelected = () => {
    const itemsToDownload = indexedHistory.filter((item) =>
      selectedIds.has(item.id)
    );
    itemsToDownload.forEach((item) => {
      if (item.audioUrl) {
        const link = document.createElement("a");
        link.href = item.audioUrl;
        link.download = generateFilename(
          `${item.taskNumber}- ${item.customName || item.fullText}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  if (history.length === 0) {
    return (
      <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-10">
        {t.historyPlaceholder}
      </p>
    );
  }

  return (
    <div className="w-full">
      {selectedItemForDetail && (
        <HistoryDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
        />
      )}

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {paginatedHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={item.status !== GenerationStatus.COMPLETED}
                  checked={selectedIds.has(item.id)}
                  onChange={() => handleSelectOne(item.id)}
                />
                <div className="flex-1">
                  {editingItem?.id === item.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                      onBlur={handleSaveRename}
                      onKeyDown={handleRenameKeyDown}
                      className="w-full bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        #{item.taskNumber}
                      </span>
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                        {item.customName || truncateText(item.fullText, 25)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {item.status === GenerationStatus.COMPLETED &&
                  item.audioUrl && (
                    <>
                      <button
                        onClick={() =>
                          onPlayAudio(
                            item.audioUrl!,
                            item.voiceName,
                            `${item.taskNumber}- ${item.fullText}`
                          )
                        }
                        className="p-2 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:text-stone-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors duration-150"
                        title="Play audio"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <a
                        href={item.audioUrl}
                        download={generateFilename(
                          `${item.taskNumber}- ${
                            item.customName || item.fullText
                          }`
                        )}
                        className="p-2 rounded-lg text-stone-500 hover:text-green-600 hover:bg-green-50 dark:text-stone-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 transition-colors duration-150"
                        title="Download audio"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </a>
                    </>
                  )}
                <button
                  onClick={() =>
                    setOpenMenuId(item.id === openMenuId ? null : item.id)
                  }
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700 transition-colors duration-150"
                  title="More options"
                >
                  <MoreHorizontalIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-stone-600 dark:text-stone-400 text-xs font-medium uppercase tracking-wider">
                  Text
                </span>
                <p
                  className="text-stone-800 dark:text-stone-200 mt-1 leading-relaxed break-words"
                  title={item.fullText}
                >
                  {item.fullText}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-stone-600 dark:text-stone-400 text-xs font-medium uppercase tracking-wider">
                    Voice
                  </span>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300 break-words"
                      title={item.voiceName}
                    >
                      {item.voiceName}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-stone-600 dark:text-stone-400 text-xs font-medium uppercase tracking-wider">
                    Status
                  </span>
                  <div className="mt-1">
                    {item.status === GenerationStatus.QUEUED && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 whitespace-nowrap">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></div>
                        {t.queued}
                      </span>
                    )}
                    {item.status === GenerationStatus.COMPLETED && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 whitespace-nowrap">
                        <CheckCircleIcon className="w-3 h-3 mr-1.5" />
                        {t.completed}
                      </span>
                    )}
                    {item.status === GenerationStatus.GENERATING && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2 min-w-0">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${item.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-400 font-mono flex-shrink-0">
                          {item.progress || 0}%
                        </span>
                      </div>
                    )}
                    {item.status === GenerationStatus.FAILED && (
                      <div className="group relative">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 cursor-help whitespace-nowrap">
                          <AlertCircleIcon className="w-3 h-3 mr-1.5" />
                          {t.failed}
                        </span>
                        {item.errorMessage && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-stone-800 text-white text-xs rounded-lg py-2 px-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl dark:bg-stone-700 border border-stone-600">
                            <p className="font-sans leading-relaxed">
                              {item.errorMessage}
                            </p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-800 dark:border-t-stone-700"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-stone-600 dark:text-stone-400 text-xs font-medium uppercase tracking-wider">
                  Date
                </span>
                <p className="text-stone-800 dark:text-stone-200 mt-1 whitespace-nowrap">
                  {formatDate(item.date)}
                </p>
              </div>
            </div>

            {openMenuId === item.id && (
              <div
                ref={menuRef}
                className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700"
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setEditingItem({
                        id: item.id,
                        name: item.customName || truncateText(item.fullText),
                      });
                      setOpenMenuId(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-stone-50 dark:bg-stone-700/50 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors duration-150 min-w-0"
                  >
                    <EditIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t.rename}</span>
                  </button>
                  <button
                    onClick={() => {
                      onRegenerateItem(item);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-150 min-w-0"
                  >
                    <RefreshCcwIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t.regenerate}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItemForDetail(item);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-stone-50 dark:bg-stone-700/50 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors duration-150 min-w-0"
                  >
                    <FileTextIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t.details}</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeleteItem(item.id);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-150 min-w-0"
                  >
                    <Trash2Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t.deleteTask}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-sm min-h-[60vh] pb-60">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-stone-50 dark:bg-stone-900/50">
            <tr>
              <th className="px-3 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600 focus:ring-2 focus:ring-blue-500"
                  checked={allOnPageSelected}
                  onChange={handleSelectAll}
                  title={t.selectAll}
                />
              </th>
              <th className="px-4 py-3 w-48 text-left text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                {t.taskName}
              </th>
              <th className="px-4 py-3 w-80 text-left text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                {t.input}
              </th>
              <th className="px-4 py-3 w-32 text-left text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                {t.voiceName}
              </th>
              <th className="px-4 py-3 w-40 text-left text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-4 py-3 w-32 text-left text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                {t.dateCreated}
              </th>
              <th className="px-4 py-3 w-24 text-center text-stone-700 dark:text-stone-300 font-semibold text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {paginatedHistory.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-150"
              >
                <td className="px-3 py-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={item.status !== GenerationStatus.COMPLETED}
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelectOne(item.id)}
                  />
                </td>
                <td className="px-4 py-4 w-48">
                  <div className="flex items-center min-w-0">
                    {editingItem?.id === item.id ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            name: e.target.value,
                          })
                        }
                        onBlur={handleSaveRename}
                        onKeyDown={handleRenameKeyDown}
                        className="w-full bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0">
                          #{item.taskNumber}
                        </span>
                        {/* <span className="text-stone-800 dark:text-stone-200 font-medium truncate">
                          {item.customName || truncateText(item.fullText, 20)}
                        </span> */}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 max-w-60">
                  <div className="min-w-0">
                    <p
                      className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed truncate"
                      title={item.fullText}
                    >
                      {item.fullText}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 w-32">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300 truncate"
                    title={item.voiceName}
                  >
                    {item.voiceName}
                  </span>
                </td>
                <td className="px-4 py-4 w-40">
                  {item.status === GenerationStatus.QUEUED && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 whitespace-nowrap">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></div>
                      {t.queued}
                    </span>
                  )}
                  {item.status === GenerationStatus.COMPLETED && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 whitespace-nowrap">
                      <CheckCircleIcon className="w-3 h-3 mr-1.5" />
                      {t.completed}
                    </span>
                  )}
                  {item.status === GenerationStatus.GENERATING && (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden min-w-0">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-mono flex-shrink-0">
                        {item.progress || 0}%
                      </span>
                    </div>
                  )}
                  {item.status === GenerationStatus.FAILED && (
                    <div className="group relative">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 cursor-help whitespace-nowrap">
                        <AlertCircleIcon className="w-3 h-3 mr-1.5" />
                        {t.failed}
                      </span>
                      {item.errorMessage && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-stone-800 text-white text-xs rounded-lg py-2 px-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl dark:bg-stone-700 border border-stone-600">
                          <p className="font-sans leading-relaxed">
                            {item.errorMessage}
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-800 dark:border-t-stone-700"></div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 w-32">
                  <span className="text-stone-600 dark:text-stone-400 text-sm whitespace-nowrap">
                    {formatDate(item.date)}
                  </span>
                </td>
                <td className="px-4 py-4 w-24">
                  <div className="flex items-center justify-center gap-1 relative">
                    {item.status === GenerationStatus.COMPLETED &&
                      item.audioUrl && (
                        <>
                          <button
                            onClick={() =>
                              onPlayAudio(
                                item.audioUrl!,
                                item.voiceName,
                                `${item.taskNumber}- ${item.fullText}`
                              )
                            }
                            className="p-2 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 dark:text-stone-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors duration-150 flex-shrink-0"
                            title="Play audio"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </button>
                          <a
                            href={item.audioUrl}
                            download={generateFilename(
                              `${item.taskNumber}- ${
                                item.customName || item.fullText
                              }`
                            )}
                            className="p-2 rounded-lg text-stone-500 hover:text-green-600 hover:bg-green-50 dark:text-stone-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 transition-colors duration-150 flex-shrink-0"
                            title="Download audio"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    <button
                      onClick={() =>
                        setOpenMenuId(item.id === openMenuId ? null : item.id)
                      }
                      className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700 transition-colors duration-150 flex-shrink-0"
                      title="More options"
                    >
                      <MoreHorizontalIcon className="w-4 h-4" />
                    </button>
                    {openMenuId === item.id && (
                      <div
                        ref={menuRef}
                        className="absolute z-20 top-full right-0 mt-2 w-52 bg-white shadow-xl rounded-xl border border-stone-200 text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setEditingItem({
                              id: item.id,
                              name:
                                item.customName || truncateText(item.fullText),
                            });
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors duration-150 text-sm"
                        >
                          <EditIcon className="w-4 h-4" />
                          {t.rename}
                        </button>
                        <button
                          onClick={() => {
                            onRegenerateItem(item);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 text-sm"
                        >
                          <RefreshCcwIcon className="w-4 h-4" />
                          {t.regenerate}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItemForDetail(item);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors duration-150 text-sm"
                        >
                          <FileTextIcon className="w-4 h-4" />
                          {t.details}
                        </button>
                        <div className="border-t border-stone-200 dark:border-stone-700"></div>
                        <button
                          onClick={() => {
                            onDeleteItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-sm"
                        >
                          <Trash2Icon className="w-4 h-4" />
                          {t.deleteTask}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-4 mt-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 min-w-0">
          {/* Left Section - Actions & Info */}
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 shadow-sm whitespace-nowrap flex-shrink-0"
                >
                  <DownloadIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {t.downloadSelected} ({selectedIds.size})
                  </span>
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(t.confirmClearAllHistory)) {
                      onClearAllHistory();
                    }
                  }}
                  className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors duration-150 shadow-sm whitespace-nowrap flex-shrink-0"
                >
                  <Trash2Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{t.clearAllHistory}</span>
                </button>
              )}
            </div>

            {/* Records Info */}
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg px-3 py-2 min-w-0 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-stone-600 dark:text-stone-400 text-sm font-medium whitespace-nowrap">
                  {t.recordsPerPage}:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-0"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="h-4 w-px bg-stone-300 dark:bg-stone-600 flex-shrink-0"></div>
              <span className="text-stone-600 dark:text-stone-400 text-sm whitespace-nowrap">
                {t.totalRecords(history.length)}
              </span>
            </div>
          </div>

          {/* Right Section - Pagination */}
          <div className="flex items-center gap-1 w-full lg:w-auto justify-center min-w-0 flex-shrink-0">
            {/* First Page - Hidden on mobile */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="hidden sm:flex p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150 flex-shrink-0"
              title="First page"
            >
              <ChevronsLeftIcon className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150 flex-shrink-0"
              title="Previous page"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Page Info */}
            <div className="flex items-center gap-2 mx-2 min-w-0 flex-shrink-0">
              <span className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800 min-w-[2.5rem] text-center whitespace-nowrap">
                {currentPage}
              </span>
              <span className="text-stone-500 dark:text-stone-400 text-sm hidden sm:inline whitespace-nowrap">
                of
              </span>
              <span className="px-3 py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium min-w-[2.5rem] text-center whitespace-nowrap">
                {totalPages}
              </span>
            </div>

            {/* Next Page */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150 flex-shrink-0"
              title="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>

            {/* Last Page - Hidden on mobile */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="hidden sm:flex p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700 disabled:text-stone-300 dark:disabled:text-stone-600 disabled:hover:bg-transparent transition-all duration-150 flex-shrink-0"
              title="Last page"
            >
              <ChevronsRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
