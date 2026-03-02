/**
 * InfoPanel ─ Top-left header bar: branding + live status + station count + refresh timer
 */

import React from 'react'
import { Wind, RefreshCw } from 'lucide-react'

export default function InfoPanel({ stationCount, isLoading, error, secondsUntilRefresh, onManualRefresh }) {
    // Format countdown as mm:ss
    const mins = String(Math.floor((secondsUntilRefresh ?? 300) / 60)).padStart(2, '0')
    const secs = String((secondsUntilRefresh ?? 300) % 60).padStart(2, '0')

    return (
        <div className="glass rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Wind size={16} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-white leading-none">AirScope</h1>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">Air Quality Monitor</p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
                <span
                    className="live-dot w-2 h-2 rounded-full"
                    style={{ backgroundColor: isLoading ? '#f59e0b' : '#22c55e' }}
                />
                <span className="text-[11px] text-slate-400 font-medium">
                    {isLoading ? 'Updating…' : 'Live'}
                </span>
            </div>

            {/* Station count */}
            {stationCount > 0 && (
                <>
                    <div className="w-px h-8 bg-white/10 mx-1" />
                    <div className="text-[11px] text-slate-400">
                        <span className="font-semibold text-white">{stationCount}</span> stations
                    </div>
                </>
            )}

            {/* Auto-refresh countdown + manual refresh */}
            <div className="w-px h-8 bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 tabular-nums" title="Next auto-refresh">
                    ↻ {mins}:{secs}
                </span>
                <button
                    onClick={onManualRefresh}
                    disabled={isLoading}
                    title="Refresh now"
                    className="text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-40"
                    aria-label="Manually refresh station data"
                >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Error badge */}
            {error && (
                <>
                    <div className="w-px h-8 bg-white/10 mx-1" />
                    <span className="text-[11px] text-red-400 truncate max-w-[160px]" title={error}>
                        ⚠ {error}
                    </span>
                </>
            )}
        </div>
    )
}
