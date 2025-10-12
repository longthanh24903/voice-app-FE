import React from 'react';

export const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.5 2v6h-6"></path>
        <path d="M2.5 22v-6h6"></path>
        <path d="M2 11.5a10 10 0 0 1 18.8-4.3l-3.3 3.3"></path>
        <path d="M22 12.5a10 10 0 0 1-18.8 4.3l3.3-3.3"></path>
    </svg>
);
