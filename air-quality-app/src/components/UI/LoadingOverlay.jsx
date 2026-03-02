/**
 * LoadingOverlay ─ Fullscreen loading spinner shown on first data load
 */

import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ message = 'Loading air quality data…' }) {
    return (
        <div className="absolute inset-0 z-[900] flex flex-col items-center justify-center pointer-events-none">
            <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl animate-fade-in">
                <Loader2 size={18} className="text-sky-400 animate-spin" />
                <span className="text-sm text-slate-300">{message}</span>
            </div>
        </div>
    )
}
