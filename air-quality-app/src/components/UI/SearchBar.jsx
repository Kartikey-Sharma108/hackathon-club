/**
 * SearchBar — City/station search with live dropdown results
 *
 * Features:
 * - Debounced search via useAirQuality hook
 * - Keyboard navigation (ArrowUp/Down/Enter/Escape)
 * - Fly-to map on result selection
 * - Shows AQI badge color in results
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { getAQIColor, getAQILevel } from '../../utils/aqiUtils'

export default function SearchBar({ onSearch, searchResults, isSearching, onSelectResult, onClear }) {
    const [query, setQuery] = useState('')
    const [focusedIdx, setFocusedIdx] = useState(-1)
    const [open, setOpen] = useState(false)
    const inputRef = useRef(null)
    const debounceRef = useRef(null)

    const handleChange = useCallback((e) => {
        const val = e.target.value
        setQuery(val)
        setFocusedIdx(-1)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            if (val.trim().length >= 2) {
                onSearch(val)
                setOpen(true)
            } else {
                onClear()
                setOpen(false)
            }
        }, 400)
    }, [onSearch, onClear])

    const handleSelect = useCallback((result) => {
        const name = result.station?.name ?? result.city?.name ?? 'Unknown'
        setQuery(name)
        setOpen(false)
        onClear()
        onSelectResult(result)
        inputRef.current?.blur()
    }, [onClear, onSelectResult])

    const handleClear = () => {
        setQuery('')
        setOpen(false)
        onClear()
        inputRef.current?.focus()
    }

    const handleKeyDown = (e) => {
        if (!open || !searchResults.length) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setFocusedIdx((i) => Math.min(i + 1, searchResults.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setFocusedIdx((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && focusedIdx >= 0) {
            handleSelect(searchResults[focusedIdx])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!inputRef.current?.closest('.search-container')?.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (searchResults.length > 0) setOpen(true)
    }, [searchResults])

    return (
        <div className="search-container relative z-[1000]">
            {/* Input */}
            <div className="glass rounded-2xl flex items-center gap-2 px-3 py-2.5 shadow-2xl transition-all duration-200 focus-within:ring-1 focus-within:ring-sky-500/50">
                {isSearching
                    ? <Loader2 size={16} className="text-slate-400 animate-spin flex-shrink-0" />
                    : <Search size={16} className="text-slate-400 flex-shrink-0" />
                }
                <input
                    ref={inputRef}
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (searchResults.length > 0) setOpen(true) }}
                    placeholder="Search city or station…"
                    className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1 min-w-0"
                    aria-label="Search air quality station"
                    autoComplete="off"
                />
                {query && (
                    <button onClick={handleClear} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 glass rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
                    {searchResults.map((result, idx) => {
                        const name = result.station?.name ?? result.city?.name ?? 'Unknown'
                        const aqi = result.aqi !== '-' ? Number(result.aqi) : null
                        const level = aqi !== null ? getAQILevel(aqi) : null

                        return (
                            <button
                                key={result.uid ?? idx}
                                onClick={() => handleSelect(result)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left
                  hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0
                  ${idx === focusedIdx ? 'bg-white/8' : ''}
                `}
                            >
                                {/* AQI color dot */}
                                {level && (
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: level.color,
                                            boxShadow: `0 0 6px ${level.color}80`,
                                        }}
                                    />
                                )}
                                {!level && <span className="w-2.5 h-2.5 rounded-full bg-slate-600 flex-shrink-0" />}

                                <span className="text-sm text-slate-200 truncate flex-1">{name}</span>

                                {aqi !== null && (
                                    <span className="text-xs font-bold flex-shrink-0" style={{ color: level?.textColor }}>
                                        {aqi}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* No results */}
            {open && !isSearching && query.length >= 2 && searchResults.length === 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 glass rounded-xl shadow-2xl p-3 animate-fade-in">
                    <p className="text-xs text-slate-500 text-center">No stations found</p>
                </div>
            )}
        </div>
    )
}
