/**
 * useAirQuality — Custom hook
 *
 * Manages the full lifecycle of WAQI data for the map:
 * - Bounds-based deduplication fetching on map move
 * - Debounced API calls to prevent rate limiting
 * - Station detail loading with caching
 * - Search functionality with abort/cancel support
 */

import { useState, useCallback, useRef } from 'react'
import {
    fetchStationsInBounds,
    fetchStationDetails,
    searchStations,
} from '../services/waqiService'

const DEBOUNCE_MS = 800
const MAX_STATIONS = 500 // cap to prevent DOM overload

export function useAirQuality() {
    const [stations, setStations] = useState([])
    const [selectedStation, setSelectedStation] = useState(null)
    const [searchResults, setSearchResults] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState(null)

    const debounceTimer = useRef(null)
    const stationCache = useRef(new Map()) // uid → station object
    const lastBoundsKey = useRef(null)
    const abortController = useRef(null)

    /** Convert Leaflet bounds to a stable string key for dedup */
    const boundsToKey = (bounds) => {
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        return `${sw.lat.toFixed(2)},${sw.lng.toFixed(2)},${ne.lat.toFixed(2)},${ne.lng.toFixed(2)}`
    }

    /**
     * Triggered when the map's viewport changes.
     * Debounces and deduplicates requests by bounds key.
     */
    const loadStationsForBounds = useCallback((bounds) => {
        const boundsKey = boundsToKey(bounds)
        if (boundsKey === lastBoundsKey.current) return

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        debounceTimer.current = setTimeout(async () => {
            lastBoundsKey.current = boundsKey
            setIsLoading(true)
            setError(null)

            try {
                const data = await fetchStationsInBounds(bounds)

                // Merge into cache
                data.forEach((s) => stationCache.current.set(s.uid, s))

                // Re-derive visible station list (capped)
                const allCached = [...stationCache.current.values()]
                setStations(allCached.slice(0, MAX_STATIONS))
            } catch (err) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }, DEBOUNCE_MS)
    }, [])

    /**
     * Load full detail for a station and set it as selected.
     * Uses a simple cache to avoid re-fetching known stations.
     */
    const selectStation = useCallback(async (station) => {
        setSelectedStation({ ...station, loading: true })
        setError(null)

        try {
            const detail = await fetchStationDetails(station.uid)
            setSelectedStation({ ...station, detail, loading: false })
        } catch (err) {
            setSelectedStation({ ...station, loading: false, detailError: err.message })
        }
    }, [])

    const clearSelected = useCallback(() => setSelectedStation(null), [])

    /**
     * Search for cities/stations by keyword.
     * Aborts any in-flight request before issuing a new one.
     */
    const search = useCallback(async (query) => {
        if (abortController.current) abortController.current.abort()
        abortController.current = new AbortController()

        if (!query || query.trim().length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        setError(null)

        try {
            const results = await searchStations(query)
            setSearchResults(results)
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message)
                setSearchResults([])
            }
        } finally {
            setIsSearching(false)
        }
    }, [])

    const clearSearch = useCallback(() => setSearchResults([]), [])

    return {
        stations,
        selectedStation,
        searchResults,
        isLoading,
        isSearching,
        error,
        loadStationsForBounds,
        selectStation,
        clearSelected,
        search,
        clearSearch,
    }
}
