/**
 * AirQualityMap — The core map component
 *
 * Features:
 * - Full-screen dark-themed Leaflet map (CartoDB Dark Matter tiles)
 * - Initializes at the user's geolocation (falls back to World center)
 * - Renders all fetched stations as CircleMarkers via StationMarker
 * - AutoRefresh every 5 minutes with live countdown
 * - Custom dark ZoomControls + LocateMe button
 * - 🚀 Healthiest Commute routing with IDW AQI scoring
 * - Overlays: InfoPanel, SearchBar, Legend, RoutingPanel, RouteComparison
 * - Loading overlay on active fetch
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useAirQuality } from '../../hooks/useAirQuality'
import MapController from './MapController'
import StationMarker from './StationMarker'
import AutoRefresh from './AutoRefresh'
import ZoomControls from './ZoomControls'
import LocateButton from './LocateButton'
import SearchBar from '../UI/SearchBar'
import Legend from '../UI/Legend'
import InfoPanel from '../UI/InfoPanel'
import LoadingOverlay from '../UI/LoadingOverlay'
import { useHealthyRouting } from '../../hooks/useHealthyRouting'
import RoutingEngine from '../Routing/RoutingEngine'
import RoutingPanel from '../Routing/RoutingPanel'
import RouteComparison from '../Routing/RouteComparison'

// Default center: World (fallback when geolocation unavailable)
const DEFAULT_CENTER = [20, 0]
const DEFAULT_ZOOM = 3
const REFRESH_SECS = 5 * 60  // 5 minutes

export default function AirQualityMap() {
    const [center, setCenter] = useState(DEFAULT_CENTER)
    const [zoom, setZoom] = useState(DEFAULT_ZOOM)
    const [geoReady, setGeoReady] = useState(false)
    const [flyTarget, setFlyTarget] = useState(null)
    const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECS)
    const [refreshTick, setRefreshTick] = useState(0)   // bump to force refresh
    const hasInit = useRef(false)

    const {
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
    } = useAirQuality()

    // ── Healthy Routing ──────────────────────────────────────────────────────
    const routing = useHealthyRouting(stations)

    // ── Geolocation ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (hasInit.current) return
        hasInit.current = true

        if (!navigator.geolocation) {
            setGeoReady(true)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCenter([pos.coords.latitude, pos.coords.longitude])
                setZoom(11)
                setGeoReady(true)
            },
            () => {
                setGeoReady(true)
            },
            { timeout: 8000 }
        )
    }, [])

    // ── Auto-refresh countdown ────────────────────────────────────────────────
    useEffect(() => {
        const tick = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    // Trigger a bounds re-fetch by bumping the refresh tick
                    setRefreshTick((t) => t + 1)
                    return REFRESH_SECS
                }
                return s - 1
            })
        }, 1000)
        return () => clearInterval(tick)
    }, [])

    // ── Manual refresh ────────────────────────────────────────────────────────
    const handleManualRefresh = useCallback(() => {
        setSecondsLeft(REFRESH_SECS)
        setRefreshTick((t) => t + 1)
    }, [])

    // ── Search result selection ───────────────────────────────────────────────
    const handleSelectResult = useCallback((result) => {
        setFlyTarget(result)
        if (result.uid) selectStation(result)
    }, [selectStation])

    // ── Tile layer ───────────────────────────────────────────────────────────
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    const tileAttribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'

    if (!geoReady) {
        return (
            <div className="w-full h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="glass rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl">
                    <div className="w-8 h-8 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
                    <p className="text-sm text-slate-400">Detecting your location…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-screen overflow-hidden">

            {/* ── Leaflet Map ──────────────────────────────────────────────────── */}
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                {/* Dark CartoDB tile layer */}
                <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={18} />

                {/* Imperative controller: bounds fetch + flyTo */}
                <MapController
                    onBoundsChange={loadStationsForBounds}
                    flyTarget={flyTarget}
                    refreshTick={refreshTick}
                />

                {/* Auto-refresh logic (invisible) */}
                <AutoRefresh onRefresh={loadStationsForBounds} />

                {/* Custom zoom controls (inside MapContainer so useMap() works) */}
                <ZoomControlsOverlay />

                {/* Locate Me button (inside MapContainer so useMap() works) */}
                <LocateOverlay />

                {/* Station markers */}
                {stations.map((station) => (
                    <StationMarker
                        key={station.uid}
                        station={station}
                        onSelect={selectStation}
                        selectedStation={selectedStation}
                    />
                ))}

                {/* Routing engine (inside MapContainer for useMap access) */}
                <RoutingEngine
                    source={routing.source}
                    destination={routing.destination}
                    isCalculating={routing.isCalculating}
                    setIsCalculating={routing.setIsCalculating}
                    processAlternatives={routing.processAlternatives}
                    setRouteError={routing.setRouteError}
                    shortestRoute={routing.shortestRoute}
                    healthiestRoute={routing.healthiestRoute}
                    isSameRoute={routing.isSameRoute}
                    pickingMode={routing.pickingMode}
                    setWaypoint={routing.setWaypoint}
                />
            </MapContainer>

            {/* ── Overlays (outside MapContainer, positioned absolute) ──────── */}

            {/* Loading spinner */}
            {isLoading && <LoadingOverlay message="Fetching station data…" />}

            {/* Top-left: brand + live status + refresh countdown */}
            <div className="absolute top-4 left-4 z-[800]">
                <InfoPanel
                    stationCount={stations.length}
                    isLoading={isLoading}
                    error={error}
                    secondsUntilRefresh={secondsLeft}
                    onManualRefresh={handleManualRefresh}
                />
            </div>

            {/* Top-right: search bar */}
            <div className="absolute top-4 right-4 z-[800] w-72">
                <SearchBar
                    onSearch={search}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    onSelectResult={handleSelectResult}
                    onClear={clearSearch}
                />
            </div>

            {/* Left panel: Routing input (below InfoPanel) */}
            <div className="absolute top-[72px] left-4 z-[800]">
                <RoutingPanel
                    panelOpen={routing.panelOpen}
                    togglePanel={routing.togglePanel}
                    source={routing.source}
                    destination={routing.destination}
                    pickingMode={routing.pickingMode}
                    startPicking={routing.startPicking}
                    cancelPicking={routing.cancelPicking}
                    clearRoutes={routing.clearRoutes}
                    isCalculating={routing.isCalculating}
                    calculate={routing.calculate}
                    routeError={routing.routeError}
                    onSwapPoints={routing.swapPoints}
                    hasResults={!!(routing.shortestRoute || routing.healthiestRoute)}
                />
            </div>

            {/* Route comparison card (below routing panel, left side) */}
            {(routing.shortestRoute || routing.healthiestRoute) && (
                <div className="absolute top-[72px] right-4 z-[800] mt-12">
                    <RouteComparison
                        shortestRoute={routing.shortestRoute}
                        healthiestRoute={routing.healthiestRoute}
                        isSameRoute={routing.isSameRoute}
                        onClose={routing.clearRoutes}
                    />
                </div>
            )}

            {/* Bottom-left: AQI legend */}
            <div className="absolute bottom-6 left-4 z-[800]">
                <Legend />
            </div>

            {/* Bottom-right: attribution */}
            <div className="absolute bottom-2 right-3 z-[800]">
                <p className="text-[10px] text-slate-600">
                    Data:{' '}
                    <a href="https://waqi.info" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">WAQI</a>
                    {' · '}
                    Tiles:{' '}
                    <a href="https://carto.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">CARTO</a>
                </p>
            </div>
        </div>
    )
}

/**
 * ZoomControlsOverlay — wraps ZoomControls in a Leaflet-portal div
 * positioned at the right side of the map (needs useMap, so must be
 * rendered inside <MapContainer>).
 */
function ZoomControlsOverlay() {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: 32,
                right: 16,
                zIndex: 800,
            }}
        >
            <ZoomControls />
        </div>
    )
}

/**
 * LocateOverlay — wraps LocateButton positioned above zoom controls.
 */
function LocateOverlay() {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: 112,
                right: 16,
                zIndex: 800,
            }}
        >
            <LocateButton />
        </div>
    )
}
