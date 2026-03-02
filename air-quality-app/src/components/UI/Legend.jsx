/**
 * Legend — AQI color scale legend overlay
 * Fixed to the bottom-left of the viewport.
 */

import React, { useState } from 'react'
import { AQI_LEVELS } from '../../utils/aqiUtils'

export default function Legend() {
    const [expanded, setExpanded] = useState(true)

    return (
        <div
            className="glass rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
            style={{ minWidth: expanded ? 200 : 48 }}
        >
            {/* Toggle header */}
            <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-white/5 transition-colors"
                aria-label="Toggle AQI legend"
            >
                <span className="text-base">🌡️</span>
                {expanded && (
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-300 flex-1 text-left">
                        AQI Scale
                    </span>
                )}
                <span className="text-slate-500 text-xs ml-auto">{expanded ? '▼' : '▶'}</span>
            </button>

            {/* Levels */}
            {expanded && (
                <div className="px-3 pb-3 space-y-1 animate-fade-in">
                    {AQI_LEVELS.map((level) => (
                        <div key={level.label} className="flex items-center gap-2.5">
                            <span
                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                                style={{ backgroundColor: level.color, boxShadow: `0 0 6px ${level.color}80` }}
                            />
                            <span className="text-[11px] text-slate-300 leading-tight">
                                <span className="font-semibold" style={{ color: level.textColor }}>
                                    {level.min}–{level.max === Infinity ? '500+' : level.max}
                                </span>{' '}
                                {level.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
