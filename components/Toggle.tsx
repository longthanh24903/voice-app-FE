import React from 'react';

interface ToggleProps {
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, enabled, onChange }) => {
    return (
        <div className="flex items-center">
            <label htmlFor={label} className="text-sm font-medium text-stone-700 dark:text-stone-300 mr-3">{label}</label>
            <button
                id={label}
                type="button"
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 ${
                    enabled ? 'bg-stone-800 dark:bg-stone-200' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                onClick={() => onChange(!enabled)}
            >
                <span
                    className={`inline-block h-5 w-5 rounded-full bg-white dark:bg-stone-900 shadow transform ring-0 transition ease-in-out duration-200 ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};