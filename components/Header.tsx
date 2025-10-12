import React, { useState, useRef, useEffect } from "react";
import type { Translations } from "../translations";
import { MoonIcon } from "./icons/MoonIcon";
import { SunIcon } from "./icons/SunIcon";

const GlobeIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MessageSquareIcon = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NavButton: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ children, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-lg px-3 py-1.5 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:text-white dark:hover:border-stone-500"
  >
    {icon}
    {children}
  </button>
);

interface HeaderProps {
  t: Translations["en"]; // Use one language shape for prop type
  language: "en" | "vi";
  onLanguageChange: (lang: "en" | "vi") => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

const LanguageSwitcher: React.FC<
  Pick<HeaderProps, "language" | "onLanguageChange">
> = ({ language, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = {
    en: "English",
    vi: "Tiếng Việt",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <NavButton icon={<GlobeIcon />} onClick={() => setIsOpen(!isOpen)}>
        {languages[language]}
      </NavButton>
      {isOpen && (
        <div className="absolute z-20 top-full right-0 mt-2 w-32 bg-white shadow-lg rounded-lg border border-stone-200 dark:bg-stone-800 dark:border-stone-700">
          <button
            onClick={() => {
              onLanguageChange("en");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm ${
              language === "en"
                ? "font-semibold text-stone-800 dark:text-stone-100"
                : "text-stone-600 dark:text-stone-300"
            } hover:bg-stone-100 dark:hover:bg-stone-700`}
          >
            English
          </button>
          <button
            onClick={() => {
              onLanguageChange("vi");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm ${
              language === "vi"
                ? "font-semibold text-stone-800 dark:text-stone-100"
                : "text-stone-600 dark:text-stone-300"
            } hover:bg-stone-100 dark:hover:bg-stone-700`}
          >
            Tiếng Việt
          </button>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  t,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-stone-200 dark:bg-stone-900/80 dark:border-stone-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white truncate">
            {t.title}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <NavButton icon={<MessageSquareIcon />}>
              <span className="hidden sm:inline">{t.feedback}</span>
            </NavButton>
            <LanguageSwitcher
              language={language}
              onLanguageChange={onLanguageChange}
            />
            <button
              onClick={() =>
                onThemeChange(theme === "light" ? "dark" : "light")
              }
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-lg transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:text-white dark:hover:border-stone-500"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
