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
      <div className="block lg:hidden space-y-3">
        {paginatedHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600"
                  disabled={item.status !== GenerationStatus.COMPLETED}
                  checked={selectedIds.has(item.id)}
                  onChange={() => handleSelectOne(item.id)}
                />
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
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
                      className="w-full bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-md px-2 py-1"
                    />
                  ) : (
                    `${item.taskNumber}- ${
                      item.customName || truncateText(item.fullText, 30)
                    }`
                  )}
                </span>
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
                        className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                      >
                        <PlayIcon />
                      </button>
                      <a
                        href={item.audioUrl}
                        download={generateFilename(
                          `${item.taskNumber}- ${
                            item.customName || item.fullText
                          }`
                        )}
                        className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                      >
                        <DownloadIcon />
                      </a>
                    </>
                  )}
                <button
                  onClick={() =>
                    setOpenMenuId(item.id === openMenuId ? null : item.id)
                  }
                  className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-200 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700"
                >
                  <MoreHorizontalIcon />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-stone-600 dark:text-stone-400">
                  Text:{" "}
                </span>
                <span className="text-stone-800 dark:text-stone-200">
                  {truncateText(item.fullText, 50)}
                </span>
              </div>
              <div>
                <span className="text-stone-600 dark:text-stone-400">
                  Voice:{" "}
                </span>
                <span className="text-stone-800 dark:text-stone-200">
                  {item.voiceName}
                </span>
              </div>
              <div>
                <span className="text-stone-600 dark:text-stone-400">
                  Status:{" "}
                </span>
                {item.status === GenerationStatus.QUEUED && (
                  <span className="text-stone-500 dark:text-stone-400 font-medium">
                    {t.queued}
                  </span>
                )}
                {item.status === GenerationStatus.COMPLETED && (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                    <CheckCircleIcon /> {t.completed}
                  </span>
                )}
                {item.status === GenerationStatus.GENERATING && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${item.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-stone-600 dark:text-stone-400 font-mono">{`${
                      item.progress || 0
                    }%`}</span>
                  </div>
                )}
                {item.status === GenerationStatus.FAILED && (
                  <div className="group relative flex items-center gap-1.5">
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {t.failed}
                    </span>
                    <AlertCircleIcon />
                    {item.errorMessage && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-stone-800 text-white text-xs rounded py-1.5 px-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg dark:bg-stone-700">
                        <p className="font-sans">{item.errorMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <span className="text-stone-600 dark:text-stone-400">
                  Date:{" "}
                </span>
                <span className="text-stone-800 dark:text-stone-200">
                  {formatDate(item.date)}
                </span>
              </div>
            </div>

            {openMenuId === item.id && (
              <div
                ref={menuRef}
                className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingItem({
                        id: item.id,
                        name: item.customName || truncateText(item.fullText),
                      });
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600"
                  >
                    <EditIcon /> {t.rename}
                  </button>
                  <button
                    onClick={() => {
                      onRegenerateItem(item);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600"
                  >
                    <RefreshCcwIcon /> {t.regenerate}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItemForDetail(item);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-stone-100 dark:bg-stone-700 rounded-md hover:bg-stone-200 dark:hover:bg-stone-600"
                  >
                    <FileTextIcon /> {t.details}
                  </button>
                  <button
                    onClick={() => {
                      onDeleteItem(item.id);
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30"
                  >
                    <Trash2Icon /> {t.deleteTask}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-stone-600 dark:text-stone-400 font-semibold">
            <tr>
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600"
                  checked={allOnPageSelected}
                  onChange={handleSelectAll}
                  title={t.selectAll}
                />
              </th>
              <th className="p-3">{t.taskName}</th>
              <th className="p-3">{t.input}</th>
              <th className="p-3">{t.voiceName}</th>
              <th className="p-3">{t.status}</th>
              <th className="p-3">{t.dateCreated}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {paginatedHistory.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-stone-50 dark:hover:bg-stone-800/50"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300 dark:bg-stone-800 dark:border-stone-600"
                    disabled={item.status !== GenerationStatus.COMPLETED}
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelectOne(item.id)}
                  />
                </td>
                <td className="p-3 text-stone-800 dark:text-stone-200 font-medium">
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
                      className="w-full bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-md px-2 py-1 -m-1"
                    />
                  ) : (
                    `${item.taskNumber}- ${
                      item.customName || truncateText(item.fullText)
                    }`
                  )}
                </td>
                <td className="p-3 text-stone-600 dark:text-stone-400">
                  {truncateText(item.fullText)}
                </td>
                <td className="p-3 text-stone-600 dark:text-stone-400">
                  {item.voiceName}
                </td>
                <td className="p-3">
                  {item.status === GenerationStatus.QUEUED && (
                    <span className="text-stone-500 dark:text-stone-400 font-medium">
                      {t.queued}
                    </span>
                  )}
                  {item.status === GenerationStatus.COMPLETED && (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircleIcon /> {t.completed}
                    </span>
                  )}
                  {item.status === GenerationStatus.GENERATING && (
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-mono w-10 text-right">{`${
                        item.progress || 0
                      }%`}</span>
                    </div>
                  )}
                  {item.status === GenerationStatus.FAILED && (
                    <div className="group relative flex items-center gap-1.5">
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {t.failed}
                      </span>
                      <AlertCircleIcon />
                      {item.errorMessage && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-stone-800 text-white text-xs rounded py-1.5 px-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg dark:bg-stone-700">
                          <p className="font-sans">{item.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3 text-stone-600 dark:text-stone-400">
                  {formatDate(item.date)}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2 relative">
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
                            className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                          >
                            <PlayIcon />
                          </button>
                          <a
                            href={item.audioUrl}
                            download={generateFilename(
                              `${item.taskNumber}- ${
                                item.customName || item.fullText
                              }`
                            )}
                            className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
                          >
                            <DownloadIcon />
                          </a>
                        </>
                      )}
                    <button
                      onClick={() =>
                        setOpenMenuId(item.id === openMenuId ? null : item.id)
                      }
                      className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-200 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700"
                    >
                      <MoreHorizontalIcon />
                    </button>
                    {openMenuId === item.id && (
                      <div
                        ref={menuRef}
                        className="absolute z-10 top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-stone-200 text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
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
                          className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-stone-100 dark:hover:bg-stone-700"
                        >
                          <EditIcon /> {t.rename}
                        </button>
                        <button
                          onClick={() => {
                            onRegenerateItem(item);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-stone-100 dark:hover:bg-stone-700"
                        >
                          <RefreshCcwIcon /> {t.regenerate}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItemForDetail(item);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-stone-100 dark:hover:bg-stone-700"
                        >
                          <FileTextIcon /> {t.details}
                        </button>
                        <button
                          onClick={() => {
                            onDeleteItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2Icon /> {t.deleteTask}
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 mt-4 border-t border-stone-200 dark:border-stone-700 text-sm gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-2 bg-stone-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-stone-800 dark:bg-stone-600 dark:hover:bg-stone-500"
            >
              <DownloadIcon />
              {t.downloadSelected} ({selectedIds.size})
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-stone-600 dark:text-stone-400">
              {t.recordsPerPage}:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border border-stone-300 rounded-md bg-white dark:bg-stone-800 dark:border-stone-600"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-stone-600 dark:text-stone-400">
              {t.totalRecords(history.length)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-stone-600 dark:text-stone-400">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="p-1 sm:p-1 disabled:text-stone-300 dark:disabled:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <ChevronsLeftIcon />
          </button>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1 sm:p-1 disabled:text-stone-300 dark:disabled:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <ChevronLeftIcon />
          </button>

          <span className="px-2 py-1 bg-stone-100 dark:bg-stone-700 rounded text-xs sm:text-sm">
            {t.page(currentPage, totalPages)}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1 sm:p-1 disabled:text-stone-300 dark:disabled:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <ChevronRightIcon />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1 sm:p-1 disabled:text-stone-300 dark:disabled:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded"
          >
            <ChevronsRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
