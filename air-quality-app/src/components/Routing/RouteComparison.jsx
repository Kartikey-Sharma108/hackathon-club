/**
 * RouteComparison — Unified route health comparison card
 *
 * Structured, user-friendly display:
 * - Route type tabs with clear color coding
 * - AQI exposure "gauge" visualization
 * - Stats grid (distance, time, max AQI) in clean cards
 * - Health recommendation with actionable message
 * - Improvement badge with % reduction
 * - Gradient exposure bars with animations
 * - Footnote on data method
 */

import React, { useState } from 'react'
import {
    Leaf, Shield, Gauge, Clock, Route, Zap,
    AlertTriangle, ArrowRight, TrendingDown, Heart,
    Wind, Map,
} from 'lucide-react'
import { getAQILevel } from '../../utils/aqiUtils'

function formatDistance(meters) {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
    return `${Math.round(meters)} m`
}

function formatTime(seconds) {
    const mins = Math.round(seconds / 60)
    if (mins >= 60) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return `${h}h ${m}m`
    }
    return `${mins} min`
}

function getHealthRecommendation(healthAvg, shortAvg, isSame) {
    if (isSame) return { icon: '✅', text: 'Great news! The fastest route is also the cleanest.', color: '#10b981' }
    const diff = shortAvg - healthAvg
    if (diff >= 50) return { icon: '🫁', text: `Strongly recommended. You'll breathe ${diff} AQI points less pollution.`, color: '#10b981' }
    if (diff >= 20) return { icon: '💨', text: `Worth the detour. Noticeably cleaner air on this path.`, color: '#22d3ee' }
    if (diff >= 5) return { icon: '🌿', text: `Slightly cleaner. A small improvement in air quality.`, color: '#84cc16' }
    return { icon: '↔️', text: `Both routes have similar air quality exposure.`, color: '#94a3b8' }
}

export default function RouteComparison({
    shortestRoute,
    healthiestRoute,
    isSameRoute,
    onClose,
}) {
    const [activeTab, setActiveTab] = useState('healthiest')

    if (!shortestRoute || !healthiestRoute) return null

    const shortAvg = shortestRoute.score.avgAqi
    const healthAvg = healthiestRoute.score.avgAqi
    const shortLevel = getAQILevel(shortAvg)
    const healthLevel = getAQILevel(healthAvg)

    const aqiReduction = shortAvg > 0 ? Math.round(((shortAvg - healthAvg) / shortAvg) * 100) : 0
    const distDiff = healthiestRoute.distance - shortestRoute.distance
    const timeDiff = healthiestRoute.time - shortestRoute.time

    const recommendation = getHealthRecommendation(healthAvg, shortAvg, isSameRoute)

    const activeRoute = activeTab === 'healthiest' ? healthiestRoute : shortestRoute
    const activeAvg = activeTab === 'healthiest' ? healthAvg : shortAvg
    const activeLevel = activeTab === 'healthiest' ? healthLevel : shortLevel

    return (
        <div className="glass rounded-2xl shadow-2xl overflow-hidden animate-fade-in w-[310px]">

            {/* ── Header ────────────────────────────────────────── */}
            <div className="px-4 py-3 flex items-center gap-2.5 border-b border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <Map size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-sm font-bold text-white leading-tight">Route Comparison</h2>
                    <p className="text-[10px] text-slate-500 leading-tight">Health-scored via IDW interpolation</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close comparison"
                >
                    <span className="text-sm leading-none">×</span>
                </button>
            </div>

            {/* ── Health Recommendation ────────────────────────── */}
            <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2.5"
                style={{ background: `${recommendation.color}10`, border: `1px solid ${recommendation.color}20` }}
            >
                <span className="text-base leading-none mt-0.5">{recommendation.icon}</span>
                <p className="text-[11px] leading-relaxed" style={{ color: recommendation.color }}>
                    {recommendation.text}
                </p>
            </div>

            {/* ── Route Type Tabs ──────────────────────────────── */}
            {!isSameRoute && (
                <div className="mx-3 mt-3 flex rounded-xl overflow-hidden border border-white/[0.06]">
                    <button
                        onClick={() => setActiveTab('healthiest')}
                        className={`
              flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all
              ${activeTab === 'healthiest'
                                ? 'bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/20'
                                : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border-r border-white/[0.06]'
                            }
            `}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" style={activeTab === 'healthiest' ? { boxShadow: '0 0 8px #10b981' } : {}} />
                        Healthiest
                    </button>
                    <button
                        onClick={() => setActiveTab('shortest')}
                        className={`
              flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all
              ${activeTab === 'shortest'
                                ? 'bg-slate-500/15 text-slate-300'
                                : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                            }
            `}
                    >
                        <span className="w-2 h-2 rounded-full bg-slate-500" style={activeTab === 'shortest' ? { boxShadow: '0 0 8px #64748b' } : {}} />
                        Shortest
                    </button>
                </div>
            )}

            {/* ── Active Route Details ──────────────────────────── */}
            <div className="p-3">

                {/* AQI Gauge Large Display */}
                <div className="rounded-xl p-4 mb-3 text-center"
                    style={{ background: `${activeLevel.color}08`, border: `1px solid ${activeLevel.color}18` }}
                >
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
                        Avg. AQI Exposure
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-black tabular-nums" style={{ color: activeLevel.textColor }}>
                            {activeAvg}
                        </span>
                        <div className="text-left">
                            <span className="text-lg leading-none">{activeLevel.emoji}</span>
                            <p className="text-[11px] font-semibold mt-0.5" style={{ color: activeLevel.textColor }}>
                                {activeLevel.label}
                            </p>
                        </div>
                    </div>
                    {/* Mini AQI bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden mx-4">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${Math.min(100, (activeAvg / 350) * 100)}%`,
                                background: `linear-gradient(90deg, #10b981, ${activeLevel.color})`,
                            }}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05] text-center">
                        <Route size={12} className="text-slate-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-white">{formatDistance(activeRoute.distance)}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Distance</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05] text-center">
                        <Clock size={12} className="text-slate-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-white">{formatTime(activeRoute.time)}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Est. Time</p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05] text-center">
                        <Gauge size={12} className="text-slate-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-white">{activeRoute.score.maxAqi}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Peak AQI</p>
                    </div>
                </div>

                {/* ── Improvement Badge (only when routes differ) ──── */}
                {!isSameRoute && aqiReduction > 0 && (
                    <div className="rounded-xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/15 p-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <TrendingDown size={16} className="text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-white font-bold">
                                    {aqiReduction}% less pollution
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {distDiff > 0
                                        ? `+${formatDistance(distDiff)} further · +${formatTime(Math.abs(timeDiff))} longer`
                                        : `${formatDistance(Math.abs(distDiff))} shorter · ${formatTime(Math.abs(timeDiff))} saved`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Side-by-side comparison bars ─────────────────── */}
                {!isSameRoute && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 mb-3">
                        <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium mb-2.5">
                            Exposure Comparison
                        </p>

                        {/* Healthiest bar */}
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" style={{ boxShadow: '0 0 6px #10b98180' }} />
                                    <span className="text-[10px] text-emerald-400 font-semibold">Healthiest</span>
                                </div>
                                <span className="text-[10px] font-bold text-white tabular-nums">{healthAvg}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${Math.min(100, (healthAvg / Math.max(shortAvg, healthAvg, 1)) * 100)}%`,
                                        background: `linear-gradient(90deg, #10b981, ${healthLevel.color})`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Shortest bar */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                                    <span className="text-[10px] text-slate-400 font-semibold">Shortest</span>
                                </div>
                                <span className="text-[10px] font-bold text-white tabular-nums">{shortAvg}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${Math.min(100, (shortAvg / Math.max(shortAvg, healthAvg, 1)) * 100)}%`,
                                        background: `linear-gradient(90deg, #64748b, ${shortLevel.color})`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Route Legend ──────────────────────────────────── */}
                <div className="flex items-center gap-3 px-1 mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-slate-500">Healthy</span>
                    </div>
                    {!isSameRoute && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-0.5 rounded-full bg-slate-500 border-dashed" style={{ borderTop: '2px dashed #64748b', height: 0 }} />
                            <span className="text-[9px] text-slate-500">Shortest</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Wind size={9} className="text-slate-600" />
                        <span className="text-[9px] text-slate-600">{activeRoute.score.sampleCount} samples</span>
                    </div>
                </div>

                {/* ── Data footnote ─────────────────────────────────── */}
                <div className="flex items-start gap-1.5 px-1 pt-1 border-t border-white/[0.04]">
                    <AlertTriangle size={9} className="text-slate-700 flex-shrink-0 mt-0.5" />
                    <p className="text-[8px] text-slate-700 leading-relaxed">
                        AQI estimates use IDW interpolation from nearby WAQI sensors.
                        Accuracy depends on local sensor density. Routes via OSRM.
                    </p>
                </div>
            </div>
        </div>
    )
}
