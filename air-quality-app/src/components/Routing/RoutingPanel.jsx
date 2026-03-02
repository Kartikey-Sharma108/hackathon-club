/**
 * RoutingPanel — Unified Healthiest Commute sidebar
 *
 * Premium, Google Maps-style routing interface:
 * - Vertical connector line between Source → Destination (A→B dots)
 * - Swap A↔B button
 * - Integrated route results below inputs
 * - Picking mode with pulsing crosshair banner
 * - Smooth accordion expand/collapse
 */

import React from 'react'
import {
    Route,
    MapPin,
    Navigation,
    Crosshair,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    X,
    Leaf,
} from 'lucide-react'

export default function RoutingPanel({
    panelOpen,
    togglePanel,
    source,
    destination,
    pickingMode,
    startPicking,
    cancelPicking,
    clearRoutes,
    isCalculating,
    calculate,
    routeError,
    onSwapPoints,
    hasResults,
}) {
    return (
        <div className="z-[800]">
            {/* ── Toggle Button ─────────────────────────────────────── */}
            <button
                onClick={togglePanel}
                className={`
          glass rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5
          transition-all duration-300 hover:bg-white/5 w-full
          ${panelOpen ? 'rounded-b-none border-b-0' : ''}
        `}
                title="Healthiest Commute Router"
            >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                    <Leaf size={15} className="text-white" />
                </div>
                <div className="text-left flex-1">
                    <span className="text-sm font-bold text-white block leading-tight">Healthy Route</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Pollution-aware routing</span>
                </div>
                {panelOpen
                    ? <ChevronUp size={14} className="text-slate-500" />
                    : <ChevronDown size={14} className="text-slate-500" />
                }
            </button>

            {/* ── Expanded Panel ────────────────────────────────────── */}
            {panelOpen && (
                <div className="glass rounded-2xl rounded-tl-none shadow-2xl overflow-hidden animate-fade-in w-[310px]">

                    {/* Picking Mode Banner */}
                    {pickingMode && (
                        <div className="bg-sky-500/10 border-b border-sky-500/15 px-4 py-2 flex items-center gap-2">
                            <Crosshair size={14} className="text-sky-400 animate-pulse" />
                            <span className="text-xs text-sky-300">
                                Click on the map to set{' '}
                                <strong className="text-sky-200">
                                    {pickingMode === 'source' ? 'Origin' : 'Destination'}
                                </strong>
                            </span>
                            <button
                                onClick={cancelPicking}
                                className="ml-auto w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    )}

                    {/* ── Waypoint Inputs ─────────────────────────────── */}
                    <div className="p-4">
                        <div className="flex gap-3">
                            {/* Vertical connector: dot → line → dot */}
                            <div className="flex flex-col items-center pt-2.5 pb-1">
                                {/* Source dot */}
                                <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/30 flex-shrink-0 shadow-lg shadow-blue-500/30" />
                                {/* Connecting line */}
                                <div className="w-0.5 flex-1 my-1 bg-gradient-to-b from-blue-500/50 via-slate-600/30 to-red-500/50 rounded-full min-h-[28px]" />
                                {/* Destination dot */}
                                <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/30 flex-shrink-0 shadow-lg shadow-red-500/30" />
                            </div>

                            {/* Input fields */}
                            <div className="flex-1 space-y-2 min-w-0">
                                {/* Source Input */}
                                <button
                                    onClick={() => startPicking('source')}
                                    className={`
                    w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left
                    transition-all duration-200 group
                    ${pickingMode === 'source'
                                            ? 'bg-sky-500/10 border border-sky-500/30 ring-1 ring-sky-500/20'
                                            : source
                                                ? 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                                                : 'bg-white/[0.03] border border-dashed border-white/[0.08] hover:border-white/[0.15]'
                                        }
                  `}
                                >
                                    <Crosshair size={12} className={`flex-shrink-0 transition-colors ${pickingMode === 'source' ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'
                                        }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium leading-none mb-0.5">Origin</p>
                                        <p className={`text-xs truncate leading-tight ${source ? 'text-white font-medium' : 'text-slate-500'}`}>
                                            {source ? source.label : 'Click to set on map'}
                                        </p>
                                    </div>
                                </button>

                                {/* Destination Input */}
                                <button
                                    onClick={() => startPicking('destination')}
                                    className={`
                    w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left
                    transition-all duration-200 group
                    ${pickingMode === 'destination'
                                            ? 'bg-sky-500/10 border border-sky-500/30 ring-1 ring-sky-500/20'
                                            : destination
                                                ? 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                                                : 'bg-white/[0.03] border border-dashed border-white/[0.08] hover:border-white/[0.15]'
                                        }
                  `}
                                >
                                    <Crosshair size={12} className={`flex-shrink-0 transition-colors ${pickingMode === 'destination' ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'
                                        }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium leading-none mb-0.5">Destination</p>
                                        <p className={`text-xs truncate leading-tight ${destination ? 'text-white font-medium' : 'text-slate-500'}`}>
                                            {destination ? destination.label : 'Click to set on map'}
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {/* Swap & Clear buttons */}
                            <div className="flex flex-col items-center justify-center gap-1 pt-1">
                                {/* Swap button */}
                                {source && destination && (
                                    <button
                                        onClick={onSwapPoints}
                                        className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                        title="Swap origin & destination"
                                    >
                                        <ArrowUpDown size={12} />
                                    </button>
                                )}
                                {/* Clear button */}
                                {(source || destination) && (
                                    <button
                                        onClick={clearRoutes}
                                        className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                                        title="Clear all"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Calculate Button ────────────────────────────── */}
                        <button
                            onClick={calculate}
                            disabled={!source || !destination || isCalculating}
                            className={`
                w-full mt-3 py-3 rounded-xl text-sm font-bold text-white
                transition-all duration-200 flex items-center justify-center gap-2
                ${(!source || !destination || isCalculating)
                                    ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed border border-white/[0.05]'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 active:scale-[0.98] active:shadow-md'
                                }
              `}
                        >
                            {isCalculating ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Computing healthiest route…</span>
                                </>
                            ) : (
                                <>
                                    <Route size={15} />
                                    <span>Find Healthy Route</span>
                                </>
                            )}
                        </button>

                        {/* Error */}
                        {routeError && (
                            <div className="mt-2 bg-red-950/30 border border-red-500/15 rounded-xl px-3 py-2.5 flex items-start gap-2">
                                <span className="text-red-400/80 text-xs mt-0.5">⚠</span>
                                <p className="text-[11px] text-red-400/90 leading-relaxed">{routeError}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
