import React, { useState, useRef, useEffect } from 'react';
import type { ApiVoice } from '../types';
import type { Translations } from '../translations';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ZapIcon } from './icons/ZapIcon';
import { HeartIcon } from './icons/HeartIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    voices: ApiVoice[];
    onSelectVoice: (voiceId: string) => void;
    t: Translations['en'];
}

const VoiceRow: React.FC<{ 
    voice: ApiVoice, 
    onSelect: () => void, 
    onPreview: () => void,
    isPlaying: boolean,
    t: Translations['en'] 
}> = ({ voice, onSelect, onPreview, isPlaying, t }) => {
    // A simple mapping, this could be more sophisticated
    const categoryMap: { [key: string]: string } = {
        'narration': 'Tường thuật & Kể chuyện',
        'conversational': 'Đàm thoại',
        'informative': 'Thông tin & Giáo dục',
    };

    return (
        <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50">
            <div className="flex items-center gap-4">
                 <button onClick={onPreview} className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">{voice.name}</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md">{voice.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-stone-500 dark:text-stone-300">
                        <span>🇺🇸</span>
                        <span>{voice.labels.accent || 'English'}</span>
                        <span>+18</span> {/* Placeholder */}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-sm text-stone-600 dark:text-stone-400">{categoryMap[voice.category] || voice.category}</span>
                <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                    <button onClick={onSelect} className="hover:text-stone-800 dark:hover:text-stone-100" title="Use Voice"><ZapIcon /></button>
                    <button className="hover:text-stone-800 dark:hover:text-stone-100" title="Favorite"><HeartIcon /></button>
                    <button onClick={() => navigator.clipboard.writeText(voice.voice_id)} className="hover:text-stone-800 dark:hover:text-stone-100" title="Copy ID"><ClipboardCopyIcon /></button>
                </div>
            </div>
        </div>
    );
};

export const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({ isOpen, onClose, voices, onSelectVoice, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        const handleAudioEnd = () => setPlayingVoiceId(null);
        audio?.addEventListener('ended', handleAudioEnd);
        return () => audio?.removeEventListener('ended', handleAudioEnd);
    }, []);
    
    useEffect(() => {
        // Stop audio when modal is closed
        if (!isOpen && audioRef.current) {
            audioRef.current.pause();
            setPlayingVoiceId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const handlePreview = (voice: ApiVoice) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingVoiceId === voice.voice_id) {
            audio.pause();
            setPlayingVoiceId(null);
        } else {
            audio.src = voice.preview_url;
            audio.play().catch(e => console.error("Audio playback failed", e));
            setPlayingVoiceId(voice.voice_id);
        }
    };
    
    const filteredVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        voice.voice_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <audio ref={audioRef} />
            <div 
                className="bg-white dark:bg-stone-900 rounded-xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-6 border-b border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                            {t.chooseVoice}
                        </h2>
                        <button onClick={onClose} className="p-1 text-stone-500 hover:text-stone-800 rounded-full hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800">
                            <XIcon />
                        </button>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{t.chooseVoiceSub}</p>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t.searchVoice}
                                className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-stone-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800">
                            <TrendingUpIcon /> {t.trending}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800">
                            <FilterIcon /> {t.filters}
                        </button>
                    </div>
                </header>
                
                <main className="flex-grow overflow-y-auto">
                    {filteredVoices.map(voice => (
                        <VoiceRow 
                            key={voice.voice_id} 
                            voice={voice} 
                            onSelect={() => onSelectVoice(voice.voice_id)} 
                            onPreview={() => handlePreview(voice)}
                            isPlaying={playingVoiceId === voice.voice_id}
                            t={t}
                        />
                    ))}
                    {filteredVoices.length === 0 && (
                        <p className="text-center p-8 text-stone-500">{t.noVoicesFound}</p>
                    )}
                </main>
            </div>
        </div>
    );
};