import React from 'react';
import type { HistoryItem } from '../types';
import { XIcon } from './icons/XIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface HistoryDetailModalProps {
    item: HistoryItem;
    onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <h4 className="text-sm text-stone-500 dark:text-stone-400 mb-1">{label}</h4>
        <div className="text-base font-semibold text-stone-800 bg-stone-100 px-3 py-2 rounded-lg flex items-center justify-between dark:bg-stone-800 dark:text-stone-200">
            {value}
        </div>
    </div>
);

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${time} ${day}/${month}/${year}`;
};


export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose }) => {

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-stone-900 rounded-xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate pr-4">
                        Chi tiết Task: {item.fullText}
                    </h2>
                    <button onClick={onClose} className="p-1 text-stone-500 hover:text-stone-800 rounded-full hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800">
                        <XIcon />
                    </button>
                </header>
                
                <main className="p-6 space-y-6">
                    <div>
                        <h4 className="text-sm text-stone-500 dark:text-stone-400 mb-1">Đầu vào</h4>
                        <div className="text-base text-stone-800 bg-stone-100 p-3 rounded-lg max-h-32 overflow-y-auto dark:bg-stone-800 dark:text-stone-300">
                            {item.fullText}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem label="Tên giọng nói" value={item.voiceName} />
                        <DetailItem 
                            label="ID giọng nói" 
                            value={
                                <>
                                    <span>{item.voiceId}</span>
                                    <button onClick={() => copyToClipboard(item.voiceId)} className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"><ClipboardCopyIcon /></button>
                                </>
                            }
                        />
                        <DetailItem label="Tốc độ" value={item.settings.speed} />
                        <DetailItem label="Speaker Boost" value={item.settings.speakerBoost ? 'Có' : 'Không'} />
                        <DetailItem label="Similarity" value={`${item.settings.similarity}%`} />
                        <DetailItem label="Stability" value={`${item.settings.stability}%`} />
                        <DetailItem label="Style Exaggeration" value={`${item.settings.styleExaggeration}%`} />
                        <DetailItem label="Model" value={item.modelName} />
                        <DetailItem label="Ngày tạo" value={formatDate(item.date)} fullWidth/>
                        <div className="col-span-2">
                             <h4 className="text-sm text-stone-500 dark:text-stone-400 mb-1">Trạng thái</h4>
                             <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-green-600 font-medium dark:text-green-400"><CheckCircleIcon /> Hoàn thành</span>
                                <span className="text-sm text-stone-500 dark:text-stone-400">Audio sẽ bị xoá sau 24 giờ. Vui lòng tải về để tránh mất dữ liệu.</span>
                             </div>
                        </div>

                    </div>
                </main>

                <footer className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end rounded-b-xl dark:bg-stone-800/50 dark:border-stone-700">
                    <button onClick={onClose} className="bg-stone-200 text-stone-800 font-semibold px-4 py-2 rounded-lg hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600">
                        Đóng
                    </button>
                </footer>
            </div>
        </div>
    );
};