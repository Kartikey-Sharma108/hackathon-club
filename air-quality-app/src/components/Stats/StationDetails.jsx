/**
 * StationDetails — Popup content for a selected monitoring station
 *
 * Renders a rich, dark-themed card with:
 * - AQI badge with color-coded background
 * - Health category label + emoji
 * - Individual pollutant readings grid
 * - Last updated timestamp
 */

import React from 'react'
import { getAQILevel, getPollutantName, parsePollutants, formatTimestamp } from '../../utils/aqiUtils'

export default function StationDetails({ station }) {
    if (!station) return null

    const { detail, loading, detailError, aqi: rawAqi, station: stationMeta } = station

    const aqi = detail ? detail.aqi : Number(rawAqi)
    const level = getAQILevel(aqi)
    const name = detail?.city?.name ?? stationMeta?.name ?? 'Unknown Station'
    const time = detail?.time?.s ?? null
    const iaqi = detail?.iaqi ?? {}
    const domPol = detail?.dominentpol ?? null
    const pollutants = parsePollutants(iaqi)

    return (
        <div className="min-w-[260px] max-w-[320px] overflow-hidden">
            {/* Header bar */}
            <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ background: level.bgColor, borderBottom: `1px solid ${level.color}22` }}
            >
                <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-lg shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${level.color}30, ${level.color}12)`,
                        border: `2px solid ${level.color}60`,
                        color: level.color,
                    }}
                >
                    {loading ? '…' : aqi}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-widest mb-0.5" style={{ color: level.textColor }}>
                        {level.emoji} {level.label}
                    </p>
                    <h3 className="text-sm font-semibold text-white leading-tight truncate" title={name}>
                        {name}
                    </h3>
                    {time && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Updated {formatTimestamp(time)}
                        </p>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                {/* Health description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {level.description}
                </p>

                {/* Dominant pollutant */}
                {domPol && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Dominant</span>
                        <span
                            className="text-sm font-bold ml-auto"
                            style={{ color: level.textColor }}
                        >
                            {getPollutantName(domPol)}
                        </span>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center gap-2 py-2">
                        <div className="w-3 h-3 rounded-full animate-spin border-2 border-white/20 border-t-sky-400" />
                        <span className="text-xs text-slate-500">Loading details…</span>
                    </div>
                )}

                {/* Error state */}
                {detailError && !loading && (
                    <p className="text-xs text-red-400/80 bg-red-900/20 rounded-lg px-3 py-2">
                        ⚠ {detailError}
                    </p>
                )}

                {/* Pollutants grid */}
                {pollutants.length > 0 && !loading && (
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
                            Pollutant Readings
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                            {pollutants.map(({ key, name: pName, value }) => (
                                <div
                                    key={key}
                                    className="rounded-lg p-2 text-center"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <p className="text-[10px] text-slate-500 font-medium">{pName}</p>
                                    <p className="text-sm font-bold text-white mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No data fallback */}
                {!loading && !detailError && pollutants.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                        No individual pollutant data available.
                    </p>
                )}
            </div>
        </div>
    )
}
