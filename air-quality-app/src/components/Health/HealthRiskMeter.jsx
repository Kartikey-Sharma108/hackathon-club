/**
 * HealthRiskMeter — Premium "Respiratory Strain" gauge component
 *
 * Displays:
 * - Animated circular gauge showing strain percentage (0–100%)
 * - Dynamic color shifting based on strain severity
 * - Profile-specific health recommendation text
 * - User's active profile badge
 * - Conic gradient arc with glowing tip
 *
 * Props:
 * - strain:         { percentage, label, color }
 * - recommendation: { recommendation, severity, icon }
 * - profile:        Full profile object { id, label, emoji, color, ... }
 * - currentAqi:     Current AQI number
 * - onOpenProfileForm: Callback to open profile selector
 */

import React, { useEffect, useState } from 'react'
import { Heart, ChevronRight, Activity } from 'lucide-react'
import { SEVERITY_COLORS } from '../../utils/healthRecommendations'

export default function HealthRiskMeter({
    strain,
    recommendation,
    profile,
    currentAqi,
    onOpenProfileForm,
}) {
    // Animate the gauge from 0 to final value
    const [animatedPercent, setAnimatedPercent] = useState(0)

    useEffect(() => {
        if (!strain) return
        setAnimatedPercent(0)
        const timer = setTimeout(() => setAnimatedPercent(strain.percentage), 100)
        return () => clearTimeout(timer)
    }, [strain?.percentage])

    if (!strain || !recommendation || !profile) {
        return null
    }

    const gaugeAngle = (animatedPercent / 100) * 270 // 270° arc
    const sevColor = SEVERITY_COLORS[recommendation.severity] || '#64748b'

    return (
        <div className="health-risk-meter glass rounded-2xl shadow-2xl overflow-hidden animate-fade-in" id="health-risk-meter">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <Activity size={14} style={{ color: strain.color }} />
                <span className="text-xs font-bold text-white flex-1">Health Risk Meter</span>
                <button
                    onClick={onOpenProfileForm}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.10] transition-all group"
                    title="Change health profile"
                >
                    <span className="text-xs">{profile.emoji}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">{profile.label}</span>
                    <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
            </div>

            {/* ── Gauge + Stats ───────────────────────────────────────── */}
            <div className="flex items-center gap-4 px-4 py-3">
                {/* Circular Gauge — SVG implementation */}
                <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-225deg)' }}>
                        {/* Background arc */}
                        <circle
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="8"
                            strokeDasharray={`${270 * (Math.PI * 80) / 360} ${(90 * (Math.PI * 80)) / 360}`}
                            strokeLinecap="round"
                        />
                        {/* Filled arc */}
                        <circle
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={strain.color}
                            strokeWidth="8"
                            strokeDasharray={`${(gaugeAngle * (Math.PI * 80)) / 360} ${((360 - gaugeAngle) * (Math.PI * 80)) / 360}`}
                            strokeLinecap="round"
                            style={{
                                filter: `drop-shadow(0 0 6px ${strain.color}60)`,
                                transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                            }}
                        />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                            className="text-xl font-black tabular-nums leading-none"
                            style={{
                                color: strain.color,
                                transition: 'color 0.4s ease',
                            }}
                        >
                            {animatedPercent}%
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">
                            Strain
                        </span>
                    </div>
                </div>

                {/* Stats column */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Strain label */}
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: strain.color,
                                boxShadow: `0 0 8px ${strain.color}50`,
                            }}
                        />
                        <span className="text-xs font-bold" style={{ color: strain.color }}>
                            {strain.label} Strain
                        </span>
                    </div>

                    {/* AQI badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            Local AQI
                        </span>
                        <span className="text-sm font-extrabold text-white tabular-nums">
                            {currentAqi ?? '—'}
                        </span>
                    </div>

                    {/* Strain bar */}
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${animatedPercent}%`,
                                background: `linear-gradient(90deg, ${strain.color}80, ${strain.color})`,
                                boxShadow: `0 0 8px ${strain.color}40`,
                                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Recommendation Banner ───────────────────────────────── */}
            <div
                className="px-4 py-3 border-t border-white/[0.04]"
                style={{ background: `${sevColor}08` }}
            >
                <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 mt-0.5">{recommendation.icon}</span>
                    <p className="text-[12px] text-slate-300 leading-relaxed">
                        {recommendation.recommendation}
                    </p>
                </div>
            </div>
        </div>
    )
}
