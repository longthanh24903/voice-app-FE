import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import type { UserInfo, Task } from "../types";
import type { Translations } from "../translations";
import { FilePlusIcon } from "./icons/FilePlusIcon";
import { SearchIcon } from "./icons/SearchIcon";

interface TextAreaPanelProps {
  tasks: Task[];
  activeTaskId: number;
  onSelectTask: (id: number) => void;
  onTextChange: (id: number, text: string) => void;
  onAddTask: () => void;
  onDeleteTask: (id: number) => void;
  onImportTasks: (fileContent: string) => void;
  onSplitText: (text: string, wordsPerTask: number) => void;
  onClearAllTasks: () => void;
  onGenerate: () => void;
  onGenerateAll: () => void;
  isLoading: boolean;
  hasApiKeys: boolean;
  totalUserInfo: { count: number; limit: number } | null;
  t: Translations["en"];
}

const MAX_CHARS = 5000;

const CreditCircle: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 28 28">
      <circle
        className="text-stone-200 dark:text-stone-700"
        stroke="currentColor"
        strokeWidth="3"
        fill="transparent"
        r={radius}
        cx="14"
        cy="14"
      />
      <circle
        className="text-stone-400 dark:text-stone-500"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx="14"
        cy="14"
      />
    </svg>
  );
};

const HighlightedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\[[^\]]+\])/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span
            key={index}
            className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-md"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

const TaskList: React.FC<
  Pick<
    TextAreaPanelProps,
    "tasks" | "activeTaskId" | "onSelectTask" | "onDeleteTask"
  >
> = ({ tasks, activeTaskId, onSelectTask, onDeleteTask }) => {
  const ITEM_HEIGHT = 44; // px, includes padding and border
  const CONTAINER_HEIGHT = 500; // An estimate, will be measured
  const OVERSCAN = 5; // Render 5 extra items above and below the viewport

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(CONTAINER_HEIGHT);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
    // Scroll active task into view when it changes
    const activeIndex = tasks.findIndex((t) => t.id === activeTaskId);
    if (activeIndex !== -1 && containerRef.current) {
      const currentScrollTop = containerRef.current.scrollTop;
      const itemTop = activeIndex * ITEM_HEIGHT;
      const itemBottom = itemTop + ITEM_HEIGHT;

      if (
        itemTop < currentScrollTop ||
        itemBottom > currentScrollTop + containerHeight
      ) {
        containerRef.current.scrollTop =
          itemTop - containerHeight / 2 + ITEM_HEIGHT / 2;
      }
    }
  }, [activeTaskId, tasks, containerHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN
  );
  const endIndex = Math.min(
    tasks.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleTasks = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({ task: tasks[i], index: i });
    }
    return items;
  }, [tasks, startIndex, endIndex]);

  const tasksWithIndex = useMemo(
    () => tasks.map((task, index) => ({ ...task, originalIndex: index })),
    [tasks]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-auto relative"
    >
      <div
        style={{ height: `${tasks.length * ITEM_HEIGHT}px` }}
        className="relative"
      >
        {visibleTasks.map(({ task, index }) => (
          <button
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            style={{
              top: `${index * ITEM_HEIGHT}px`,
              height: `${ITEM_HEIGHT}px`,
            }}
            className={`absolute w-full flex items-center justify-between text-left px-3 border-b border-stone-200 dark:border-stone-700/50
                            ${
                              task.id === activeTaskId
                                ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 font-semibold"
                                : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/50"
                            }`}
          >
            <span className="truncate pr-2">{`Task ${
              tasksWithIndex.find((t) => t.id === task.id)?.originalIndex + 1
            }: ${task.text || "Untitled"}`}</span>
            {tasks.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0 p-1 opacity-50 hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const TextAreaPanel: React.FC<TextAreaPanelProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
  onTextChange,
  onAddTask,
  onDeleteTask,
  onImportTasks,
  onSplitText,
  onClearAllTasks,
  onGenerate,
  onGenerateAll,
  isLoading,
  hasApiKeys,
  totalUserInfo,
  t,
}) => {
  const activeTask =
    tasks.find((t) => t.id === activeTaskId) ||
    (tasks.length > 0 ? tasks[0] : { id: 0, text: "" });
  const text = activeTask?.text || "";
  const charCount = text.length;

  const [searchTerm, setSearchTerm] = useState("");
  const [wordsPerTask, setWordsPerTask] = useState(100);

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTasks = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) return tasks;
    return tasks.filter((task) =>
      task.text.toLowerCase().includes(trimmedSearch)
    );
  }, [tasks, searchTerm]);

  // Auto-select first filtered task if active one is filtered out
  useEffect(() => {
    if (
      filteredTasks.length > 0 &&
      !filteredTasks.some((t) => t.id === activeTaskId)
    ) {
      onSelectTask(filteredTasks[0].id);
    }
  }, [searchTerm, activeTaskId, filteredTasks, onSelectTask]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onImportTasks(text);
      };
      reader.readAsText(file);
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSplitText = () => {
    if (text.trim()) {
      onSplitText(text, wordsPerTask);
    }
  };

  const creditsRemaining = totalUserInfo
    ? totalUserInfo.limit - totalUserInfo.count
    : 10000;
  const creditsTotal = totalUserInfo ? totalUserInfo.limit : 10000;
  const creditPercentage =
    totalUserInfo && creditsTotal > 0
      ? ((totalUserInfo.limit - totalUserInfo.count) / totalUserInfo.limit) *
        100
      : 100;

  const isSingleGenerateDisabled = isLoading || !text.trim() || !hasApiKeys;
  const isGenerateAllDisabled =
    isLoading || !hasApiKeys || tasks.every((t) => !t.text.trim());

  let singleButtonTitle = "";
  if (!hasApiKeys) {
    singleButtonTitle = t.tooltipApi;
  } else if (!text.trim()) {
    singleButtonTitle = t.tooltipText;
  }

  let allButtonTitle = "";
  if (!hasApiKeys) {
    allButtonTitle = t.tooltipApi;
  } else if (tasks.every((t) => !t.text.trim())) {
    allButtonTitle = t.tooltipAllText;
  }

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const textForBackdrop = text + "\n";

  return (
    <div className="bg-white dark:bg-stone-800/50 flex flex-col lg:flex-row rounded-lg border border-stone-200 dark:border-stone-700 h-[60vh] sm:h-[70vh] min-h-[500px] sm:min-h-[600px] max-h-[800px] sm:max-h-[900px]">
      {/* Left Panel: Task List */}
      <div className="w-full lg:w-64 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-700 flex-shrink-0 h-48 lg:h-auto">
        <div className="p-2 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-1 sm:gap-2 mb-2">
            <button
              onClick={onAddTask}
              className="flex-grow bg-stone-100 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs sm:text-sm font-semibold p-1.5 sm:p-2 rounded-md transition-colors"
              title={t.addTaskTooltip}
            >
              + <span className="hidden sm:inline">{t.addTaskTooltip}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-700/50 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md"
              title={t.importTasksTooltip}
            >
              <FilePlusIcon />
            </button>
            {tasks.length > 1 && (
              <button
                onClick={onClearAllTasks}
                className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                title={t.clearAllTasksTooltip}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-md pl-8 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="flex-grow">
          <TaskList
            tasks={filteredTasks}
            activeTaskId={activeTaskId}
            onSelectTask={onSelectTask}
            onDeleteTask={onDeleteTask}
          />
        </div>
      </div>

      {/* Right Panel: Text Area & Footer */}
      <div className="flex-grow flex flex-col">
        <div className="relative w-full flex-grow">
          <div
            ref={backdropRef}
            className="absolute inset-0 p-4 text-lg text-stone-700 dark:text-stone-300 leading-relaxed overflow-auto pointer-events-none whitespace-pre-wrap break-words"
            aria-hidden="true"
          >
            <HighlightedText text={textForBackdrop} />
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(activeTaskId, e.target.value)}
            onScroll={handleScroll}
            placeholder={t.placeholder}
            className="absolute inset-0 w-full h-full p-4 text-lg bg-transparent text-transparent caret-stone-700 dark:caret-stone-300 placeholder-stone-400 dark:placeholder-stone-500 border-none focus:ring-0 resize-none leading-relaxed whitespace-pre-wrap break-words"
            spellCheck="false"
            key={activeTaskId}
          />
        </div>

        {/* Split Text Controls */}
        {text.trim() && (
          <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t.wordsPerTask}:
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={wordsPerTask}
                onChange={(e) => setWordsPerTask(Number(e.target.value))}
                className="w-20 px-2 py-1 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 dark:text-stone-200"
              />
              <button
                onClick={handleSplitText}
                disabled={!text.trim() || isLoading}
                title={t.splitTextTooltip}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
              >
                {t.splitText}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-t border-stone-200 dark:border-stone-700 flex-shrink-0 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            <CreditCircle percentage={creditPercentage} />
            {totalUserInfo ? (
              <span>
                {creditsRemaining.toLocaleString()} {t.charsRemaining}
              </span>
            ) : (
              <span>10,000 {t.creditsRemaining}</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              {charCount} / {totalUserInfo?.limit.toLocaleString() || MAX_CHARS}
            </span>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {tasks.length > 1 && (
                <button
                  onClick={onGenerateAll}
                  disabled={isGenerateAllDisabled}
                  title={allButtonTitle}
                  className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-stone-400 disabled:dark:bg-stone-600 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  {isLoading ? <SpinnerIcon /> : t.generateAll}
                </button>
              )}
              <button
                onClick={onGenerate}
                disabled={isSingleGenerateDisabled}
                title={singleButtonTitle}
                className="flex items-center justify-center bg-stone-800 text-white font-semibold px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-stone-900 disabled:bg-stone-400 disabled:dark:bg-stone-600 disabled:cursor-not-allowed transition-colors dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white text-sm sm:text-base flex-1 sm:flex-none"
              >
                {isLoading ? <SpinnerIcon /> : t.generate}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
