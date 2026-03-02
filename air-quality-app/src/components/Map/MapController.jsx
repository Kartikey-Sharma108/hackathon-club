/**
 * MapController — Invisible Leaflet component for imperative map operations.
 *
 * Handles:
 * - Firing bounds-based data fetch on map move/zoom end
 * - Flying to a selected search result
 * - Re-fetching on refreshTick change (auto/manual refresh)
 */

import { useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

export default function MapController({ onBoundsChange, flyTarget, refreshTick }) {
    const map = useMap()
    const prevFlyTarget = useRef(null)
    const prevRefreshTick = useRef(refreshTick)

    // Fire initial load
    useEffect(() => {
        onBoundsChange(map.getBounds())
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch on move / zoom end (debounced inside the hook)
    useMapEvents({
        moveend: () => onBoundsChange(map.getBounds()),
        zoomend: () => onBoundsChange(map.getBounds()),
    })

    // Re-fetch when refreshTick is bumped (auto-refresh or manual)
    useEffect(() => {
        if (refreshTick === prevRefreshTick.current) return
        prevRefreshTick.current = refreshTick
        onBoundsChange(map.getBounds())
    }, [refreshTick, map, onBoundsChange])

    // Fly to search result
    useEffect(() => {
        if (!flyTarget || flyTarget === prevFlyTarget.current) return
        prevFlyTarget.current = flyTarget

        const { lat, lon } = flyTarget

        if (lat !== undefined && lon !== undefined) {
            map.flyTo([lat, lon], 12, { duration: 1.2 })
        } else if (flyTarget.city?.geo) {
            const [gLat, gLon] = flyTarget.city.geo
            map.flyTo([gLat, gLon], 12, { duration: 1.2 })
        }
    }, [flyTarget, map])

    return null
}
