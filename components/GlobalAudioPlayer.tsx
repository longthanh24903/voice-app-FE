import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';

interface GlobalAudioPlayerProps {
    audioUrl: string;
    voiceName: string;
    textForFilename: string;
    onClose: () => void;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const generateFilename = (text: string): string => {
    const safeText = text
        .substring(0, 100)
        .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters, numbers, spaces, hyphens
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
    return `${safeText || 'speech'}.mp3`;
};

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({ audioUrl, voiceName, textForFilename, onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed:", e));

            const setAudioData = () => {
                setDuration(audio.duration);
                setCurrentTime(audio.currentTime);
            };
            const setAudioTime = () => setCurrentTime(audio.currentTime);

            audio.addEventListener('loadeddata', setAudioData);
            audio.addEventListener('timeupdate', setAudioTime);
            audio.addEventListener('ended', () => setIsPlaying(false));

            return () => {
                audio.removeEventListener('loadeddata', setAudioData);
                audio.removeEventListener('timeupdate', setAudioTime);
                audio.removeEventListener('ended', () => setIsPlaying(false));
            };
        }
    }, [audioUrl]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (audio) {
            const newTime = Number(e.target.value);
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const downloadFilename = generateFilename(textForFilename);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-20 dark:bg-stone-900 dark:border-stone-800">
            <audio ref={audioRef} src={audioUrl} />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 h-20">
                    <div className="flex-shrink-0">
                        <button onClick={togglePlayPause} className="w-10 h-10 flex items-center justify-center bg-stone-800 text-white rounded-full hover:bg-stone-900 transition-colors dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>

                    <div className="flex-grow flex items-center gap-4">
                        <div className="w-48">
                             <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">{voiceName}</div>
                             <div className="text-sm text-stone-500 dark:text-stone-400">English preview</div>
                        </div>

                        <div className="flex-grow flex items-center gap-2">
                             <span className="text-sm text-stone-600 dark:text-stone-400">{formatTime(currentTime)}</span>
                             <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleProgressChange}
                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer slider-thumb-sm dark:bg-stone-700"
                                style={{
                                    background: `linear-gradient(to right, #334155 ${progressPercentage}%, #e5e7eb ${progressPercentage}%)`
                                }}
                            />
                             <span className="text-sm text-stone-600 dark:text-stone-400">{formatTime(duration)}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <a href={audioUrl} download={downloadFilename} className="p-2 text-stone-500 hover:text-stone-800 transition-colors dark:text-stone-400 dark:hover:text-stone-100">
                            <DownloadIcon />
                        </a>
                        <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-800 transition-colors dark:text-stone-400 dark:hover:text-stone-100">
                            <XIcon />
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                .slider-thumb-sm {
                     background: linear-gradient(to right, var(--player-thumb-track-color) ${progressPercentage}%, var(--player-track-color) ${progressPercentage}%) !important;
                }
                .slider-thumb-sm::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 12px; height: 12px;
                    background: var(--player-thumb-color); border-radius: 50%;
                    cursor: pointer;
                }
                .slider-thumb-sm::-moz-range-thumb {
                    width: 12px; height: 12px;
                    background: var(--player-thumb-color); border-radius: 50%;
                    cursor: pointer;
                }
                 :root {
                    --player-thumb-color: #334155;
                    --player-thumb-track-color: #334155;
                    --player-track-color: #e5e7eb;
                }
                .dark {
                    --player-thumb-color: #e5e7eb;
                    --player-thumb-track-color: #e5e7eb;
                    --player-track-color: #4b5563;
                }
            `}</style>
        </div>
    );
};