/**
 * AirQualityMap — The core map component
 *
 * Features:
 * - Full-screen dark-themed Leaflet map (CartoDB Dark Matter tiles)
 * - Sidebar navigation between Map / Routes / Health views
 * - Map view: clean map with AQI stations + search + legend
 * - Routes view: Healthiest Commute routing panel + route comparison
 * - Health view: Health Risk Meter + profile-specific recommendations
 * - AutoRefresh every 5 minutes with live countdown
 * - Custom dark ZoomControls + LocateMe button
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useAirQuality } from '../../hooks/useAirQuality'
import { useHealthProfile } from '../../hooks/useHealthProfile'
import MapController from './MapController'
import StationMarker from './StationMarker'
import AutoRefresh from './AutoRefresh'
import ZoomControls from './ZoomControls'
import LocateButton from './LocateButton'
import Sidebar from '../UI/Sidebar'
import SearchBar from '../UI/SearchBar'
import Legend from '../UI/Legend'
import InfoPanel from '../UI/InfoPanel'
import LoadingOverlay from '../UI/LoadingOverlay'
import HealthRiskMeter from '../Health/HealthRiskMeter'
import UserProfileForm from '../Health/UserProfileForm'
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
    const [refreshTick, setRefreshTick] = useState(0)
    const hasInit = useRef(false)

    // ── Active view (sidebar navigation) ─────────────────────────────────────
    const [activeView, setActiveView] = useState('map') // 'map' | 'routing' | 'health'

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

    // ── Compute nearest station AQI for health system ────────────────────────
    const nearestAqi = useMemo(() => {
        if (!stations.length || !center) return null
        let closest = null
        let minDist = Infinity
        for (const s of stations) {
            const d = Math.hypot(s.lat - center[0], s.lon - center[1])
            if (d < minDist) {
                minDist = d
                closest = s
            }
        }
        return closest ? Number(closest.aqi) : null
    }, [stations, center])

    // ── Health Profile Integration ───────────────────────────────────────────
    const health = useHealthProfile(nearestAqi)

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

    // ── View change handler ──────────────────────────────────────────────────
    const handleViewChange = useCallback((viewId) => {
        setActiveView(viewId)
    }, [])

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
        <div className="app-layout">
            {/* ── Sidebar Navigation ──────────────────────────────────────── */}
            <Sidebar activeView={activeView} onChangeView={handleViewChange} />

            {/* ── Main Content Area ───────────────────────────────────────── */}
            <div className="app-layout__content">

                {/* ── Leaflet Map (always visible) ────────────────────────── */}
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={18} />

                    <MapController
                        onBoundsChange={loadStationsForBounds}
                        flyTarget={flyTarget}
                        refreshTick={refreshTick}
                    />

                    <AutoRefresh onRefresh={loadStationsForBounds} />
                    <ZoomControlsOverlay />
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

                    {/* Routing engine (always mounted for polylines + picking) */}
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

                {/* ── Shared Overlays (always visible) ────────────────────── */}

                {/* Loading spinner */}
                {isLoading && <LoadingOverlay message="Fetching station data…" />}

                {/* Top-left: brand + live status */}
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

                {/* ═══════════════════════════════════════════════════════════
                    VIEW: MAP — Clean map with AQI Legend
                   ═══════════════════════════════════════════════════════════ */}
                {activeView === 'map' && (
                    <div className="view-enter absolute inset-0 z-[900] pointer-events-none [&>*]:pointer-events-auto">
                        {/* Bottom-left: AQI legend */}
                        <div className="absolute bottom-6 left-4 z-[800]">
                            <Legend />
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    VIEW: ROUTING — Routing panel + Route comparison
                   ═══════════════════════════════════════════════════════════ */}
                {activeView === 'routing' && (
                    <div className="view-enter absolute inset-0 z-[900] pointer-events-none [&>*]:pointer-events-auto" key="view-routing">
                        {/* Left panel: Routing input (below InfoPanel) */}
                        <div className="absolute top-[72px] left-4 z-[800]">
                            <RoutingPanel
                                panelOpen={true}
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

                        {/* Right panel: Route comparison results */}
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

                        {/* Bottom-left: AQI legend (also useful during routing) */}
                        <div className="absolute bottom-6 left-4 z-[800]">
                            <Legend />
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    VIEW: HEALTH — Health Risk Meter + Profile selector
                   ═══════════════════════════════════════════════════════════ */}
                {activeView === 'health' && (
                    <div className="view-enter absolute inset-0 z-[900] pointer-events-none [&>*]:pointer-events-auto" key="view-health">
                        {/* Health Risk Meter — right side, vertically centered */}
                        <div className="absolute top-[72px] right-4 z-[800] w-[300px]">
                            <HealthRiskMeter
                                strain={health.strain}
                                recommendation={health.recommendation}
                                profile={health.profile}
                                currentAqi={health.currentAqi}
                                onOpenProfileForm={health.togglePanel}
                            />
                        </div>

                        {/* Bottom-left: AQI legend */}
                        <div className="absolute bottom-6 left-4 z-[800]">
                            <Legend />
                        </div>
                    </div>
                )}

                {/* ── Health Profile Form (modal overlay — any view) ───────── */}
                {health.panelOpen && (
                    <div className="absolute inset-0 z-[900] flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={health.closePanel}
                        />
                        <div className="relative z-10 w-[340px] glass rounded-2xl shadow-2xl">
                            <UserProfileForm
                                profiles={health.profiles}
                                selectedProfileId={health.profileId}
                                onSelectProfile={(id) => {
                                    health.selectProfile(id)
                                    health.closePanel()
                                }}
                                onClose={health.closePanel}
                            />
                        </div>
                    </div>
                )}

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
        </div>
    )
}

/**
 * ZoomControlsOverlay — wraps ZoomControls in a Leaflet-portal div.
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
