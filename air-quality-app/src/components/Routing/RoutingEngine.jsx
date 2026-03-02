/**
 * RoutingEngine — Imperative Leaflet component that requests routes from OSRM
 *
 * Renders two Polylines: one for shortest (slate gray), one for healthiest (emerald green).
 * Uses the OSRM demo server via leaflet-routing-machine's built-in OSRM router.
 *
 * This component is rendered INSIDE <MapContainer> so it has access to useMap().
 */

import { useEffect, useRef, useCallback } from 'react'
import { useMap, useMapEvents, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// OSRM demo endpoint — for production, use your own OSRM instance
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

/**
 * Fetch route alternatives from OSRM.
 */
async function fetchOSRMRoutes(source, destination) {
    const url =
        `${OSRM_BASE}/${source.lng},${source.lat};${destination.lng},${destination.lat}` +
        `?overview=full&alternatives=3&steps=false&geometries=geojson`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM returned ${res.status}`)

    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error(data.message || 'No route found')
    }

    return data.routes.map((r) => ({
        coordinates: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
        distance: r.distance, // meters
        time: r.duration,      // seconds
        summary: r.legs?.[0]?.summary || '',
    }))
}

export default function RoutingEngine({
    source,
    destination,
    isCalculating,
    setIsCalculating,
    processAlternatives,
    setRouteError,
    shortestRoute,
    healthiestRoute,
    isSameRoute,
    pickingMode,
    setWaypoint,
}) {
    const map = useMap()
    const requestRef = useRef(0)

    // Handle map clicks for point picking
    useMapEvents({
        click: (e) => {
            if (pickingMode) {
                setWaypoint(e.latlng)
            }
        },
    })

    // Change cursor when in picking mode
    useEffect(() => {
        const container = map.getContainer()
        if (pickingMode) {
            container.style.cursor = 'crosshair'
        } else {
            container.style.cursor = ''
        }
        return () => { container.style.cursor = '' }
    }, [pickingMode, map])

    // Fetch routes when isCalculating flips to true
    useEffect(() => {
        if (!isCalculating || !source || !destination) return

        const requestId = ++requestRef.current

            ; (async () => {
                try {
                    const alternatives = await fetchOSRMRoutes(source, destination)
                    // Only process if this is still the latest request
                    if (requestId === requestRef.current) {
                        processAlternatives(alternatives)
                    }
                } catch (err) {
                    if (requestId === requestRef.current) {
                        setRouteError(err.message)
                        setIsCalculating(false)
                    }
                }
            })()
    }, [isCalculating, source, destination, processAlternatives, setRouteError, setIsCalculating])

    // Create custom markers
    const createIcon = (color, label) =>
        L.divIcon({
            className: 'custom-route-marker',
            html: `
        <div style="
          width:32px;height:32px;border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:14px;color:white;font-family:Inter,sans-serif;
        ">${label}</div>
      `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        })

    const sourceIcon = createIcon('#3b82f6', 'A')
    const destIcon = createIcon('#ef4444', 'B')

    return (
        <>
            {/* Source marker */}
            {source && (
                <Marker position={[source.lat, source.lng]} icon={sourceIcon}>
                    <Popup>
                        <div style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter' }}>
                            <strong style={{ color: '#3b82f6' }}>Source</strong><br />
                            {source.label}
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Destination marker */}
            {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
                    <Popup>
                        <div style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter' }}>
                            <strong style={{ color: '#ef4444' }}>Destination</strong><br />
                            {destination.label}
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Shortest route — Slate Gray (rendered first = under) */}
            {shortestRoute && !(isSameRoute) && (
                <Polyline
                    positions={shortestRoute.coordinates.map((c) => [c.lat, c.lng])}
                    pathOptions={{
                        color: '#64748b',
                        weight: 5,
                        opacity: 0.7,
                        dashArray: '10, 8',
                        lineCap: 'round',
                    }}
                />
            )}

            {/* Healthiest route — Emerald Green (rendered on top) */}
            {healthiestRoute && (
                <Polyline
                    positions={healthiestRoute.coordinates.map((c) => [c.lat, c.lng])}
                    pathOptions={{
                        color: isSameRoute ? '#10b981' : '#10b981',
                        weight: 6,
                        opacity: 0.9,
                        lineCap: 'round',
                    }}
                />
            )}

            {/* If same route, show single green polyline with glow effect */}
            {shortestRoute && isSameRoute && (
                <Polyline
                    positions={shortestRoute.coordinates.map((c) => [c.lat, c.lng])}
                    pathOptions={{
                        color: '#10b981',
                        weight: 10,
                        opacity: 0.2,
                        lineCap: 'round',
                    }}
                />
            )}
        </>
    )
}
