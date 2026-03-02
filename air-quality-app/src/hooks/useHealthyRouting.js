/**
 * useHealthyRouting — Custom hook for the Healthiest Commute feature
 *
 * Manages:
 * - Source / destination waypoints
 * - Dual route computation (shortest + healthiest)
 * - Route scoring (average AQI exposure via IDW)
 * - Auto-recalculation when stations data changes
 * - Routing panel open/close state
 *
 * ─── How it works ───────────────────────────────────────────────────
 * 1. User sets source + destination via click-on-map or search.
 * 2. We request OSRM for up to 3 alternative routes.
 * 3. Each alternative is scored using scoreRoute() + computeRouteCost().
 * 4. The lowest-distance route → "Shortest Path" (slate gray).
 * 5. The lowest-cost route    → "Healthiest Path" (emerald green).
 * 6. If they're the same, we show a single route with a "✓ Already optimal" badge.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { scoreRoute, computeRouteCost, haversineKm } from '../utils/idwInterpolation'

export function useHealthyRouting(stations) {
    const [panelOpen, setPanelOpen] = useState(false)
    const [source, setSource] = useState(null)       // { lat, lng, label }
    const [destination, setDestination] = useState(null) // { lat, lng, label }
    const [pickingMode, setPickingMode] = useState(null) // 'source' | 'destination' | null
    const [isCalculating, setIsCalculating] = useState(false)
    const [routeError, setRouteError] = useState(null)

    // Route results
    const [shortestRoute, setShortestRoute] = useState(null)
    const [healthiestRoute, setHealthiestRoute] = useState(null)
    const [isSameRoute, setIsSameRoute] = useState(false)

    const lastStationsRef = useRef(stations)

    // Track stations updates for auto-recalculation
    useEffect(() => {
        lastStationsRef.current = stations
    }, [stations])

    /**
     * Toggle the routing panel open/closed.
     */
    const togglePanel = useCallback(() => {
        setPanelOpen((p) => !p)
    }, [])

    /**
     * Enter map-clicking mode to pick a point.
     * @param {'source' | 'destination'} mode
     */
    const startPicking = useCallback((mode) => {
        setPickingMode(mode)
    }, [])

    const cancelPicking = useCallback(() => {
        setPickingMode(null)
    }, [])

    /**
     * Set a waypoint from a map click.
     */
    const setWaypoint = useCallback((latlng, label = '') => {
        const point = { lat: latlng.lat, lng: latlng.lng, label: label || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` }

        setPickingMode((mode) => {
            if (mode === 'source') {
                setSource(point)
            } else if (mode === 'destination') {
                setDestination(point)
            }
            return null
        })
    }, [])

    /**
     * Clear source/destination and remove routes.
     */
    const clearRoutes = useCallback(() => {
        setSource(null)
        setDestination(null)
        setShortestRoute(null)
        setHealthiestRoute(null)
        setIsSameRoute(false)
        setRouteError(null)
        setPickingMode(null)
    }, [])

    /**
     * Swap source ↔ destination.
     */
    const swapPoints = useCallback(() => {
        const tempSrc = source
        const tempDst = destination
        setSource(tempDst)
        setDestination(tempSrc)
        // Clear existing routes since the direction changed
        setShortestRoute(null)
        setHealthiestRoute(null)
        setIsSameRoute(false)
    }, [source, destination])

    /**
     * This is called by the RoutingEngine once OSRM returns alternatives.
     * We then score them.
     *
     * @param {Array} alternatives - Array of { coordinates, summary, distance, time }
     */
    const processAlternatives = useCallback((alternatives) => {
        if (!alternatives || alternatives.length === 0) {
            setRouteError('No routes found between these points.')
            setIsCalculating(false)
            return
        }

        const currentStations = lastStationsRef.current

        try {
            // Score each alternative
            const scored = alternatives.map((route, idx) => {
                const score = scoreRoute(route.coordinates, currentStations)
                const cost = computeRouteCost(route.coordinates, currentStations)
                return { ...route, score, cost, idx }
            })

            // Shortest = minimum distance
            const shortest = scored.reduce((a, b) => (a.distance < b.distance ? a : b))

            // Healthiest = minimum AQI-weighted cost
            const healthiest = scored.reduce((a, b) => (a.cost < b.cost ? a : b))

            const same = shortest.idx === healthiest.idx

            setShortestRoute({
                coordinates: shortest.coordinates,
                distance: shortest.distance,
                time: shortest.time,
                summary: shortest.summary,
                score: shortest.score,
                cost: shortest.cost,
            })

            setHealthiestRoute({
                coordinates: healthiest.coordinates,
                distance: healthiest.distance,
                time: healthiest.time,
                summary: healthiest.summary,
                score: healthiest.score,
                cost: healthiest.cost,
            })

            setIsSameRoute(same)
            setRouteError(null)
        } catch (err) {
            setRouteError('Failed to score routes: ' + err.message)
        }

        setIsCalculating(false)
    }, [])

    /**
     * Trigger route calculation.
     */
    const calculate = useCallback(() => {
        if (!source || !destination) return
        setIsCalculating(true)
        setRouteError(null)
        setShortestRoute(null)
        setHealthiestRoute(null)
        setIsSameRoute(false)
        // The actual OSRM request is handled by RoutingEngine component
    }, [source, destination])

    return {
        panelOpen,
        togglePanel,
        source,
        destination,
        setSource,
        setDestination,
        pickingMode,
        startPicking,
        cancelPicking,
        setWaypoint,
        clearRoutes,
        swapPoints,
        isCalculating,
        setIsCalculating,
        routeError,
        setRouteError,
        shortestRoute,
        healthiestRoute,
        isSameRoute,
        processAlternatives,
        calculate,
    }
}
