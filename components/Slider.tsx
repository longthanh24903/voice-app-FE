import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    minLabel: string;
    maxLabel: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, minLabel, maxLabel }) => {
    
    return (
        <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</label>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider-thumb dark:bg-stone-700"
                style={{
                  background: `linear-gradient(to right, #334155 ${value}%, #e5e7eb ${value}%)`
                }}
            />
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mt-1">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
            {/* Fix: Replaced non-standard <style jsx> with a standard <style> tag to fix compatibility issues with standard React/TypeScript. */}
            <style>{`
                .slider-thumb {
                     background: linear-gradient(to right, var(--thumb-track-color) ${value}%, var(--track-color) ${value}%) !important;
                }
                .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: var(--thumb-color);
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                }
                .slider-thumb::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: var(--thumb-color);
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                }
                :root {
                    --thumb-color: #334155;
                    --thumb-track-color: #334155;
                    --track-color: #e5e7eb;
                }
                .dark {
                    --thumb-color: #e5e7eb;
                    --thumb-track-color: #e5e7eb;
                    --track-color: #4b5563;
                }
                 input[type=range] {
                    background: linear-gradient(to right, var(--thumb-track-color) ${value}%, var(--track-color) ${value}%) !important;
                 }
            `}</style>
        </div>
    );
};