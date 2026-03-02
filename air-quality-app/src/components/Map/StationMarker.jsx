/**
 * StationMarker — Individual AQI monitoring station as a Leaflet CircleMarker
 *
 * Renders with:
 * - Color matched to AQI severity (official EPA palette)
 * - Radius proportional to AQI severity
 * - Popup with StationDetails content
 * - Click handler to load full detail via useAirQuality
 */

import React, { useCallback } from 'react'
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { getAQIColor, getAQILevel, getMarkerRadius } from '../../utils/aqiUtils'
import StationDetails from '../Stats/StationDetails'

export default function StationMarker({ station, onSelect, selectedStation }) {
    const aqi = Number(station.aqi)
    const color = getAQIColor(aqi)
    const radius = getMarkerRadius(aqi)
    const level = getAQILevel(aqi)
    const name = station.station?.name ?? 'Station'
    const isSelected = selectedStation?.uid === station.uid

    const handleClick = useCallback(() => {
        onSelect(station)
    }, [station, onSelect])

    return (
        <CircleMarker
            center={[station.lat, station.lon]}
            radius={isSelected ? radius + 3 : radius}
            pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.82,
                weight: isSelected ? 2.5 : 1.5,
                opacity: 0.9,
            }}
            eventHandlers={{ click: handleClick }}
        >
            {/* Tooltip on hover */}
            <Tooltip
                direction="top"
                offset={[0, -radius]}
                opacity={1}
                className="aqi-tooltip"
            >
                <div
                    style={{
                        background: 'rgba(10,15,30,0.92)',
                        border: `1px solid ${color}44`,
                        borderRadius: 8,
                        padding: '4px 8px',
                        fontSize: 12,
                        color: '#e2e8f0',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontWeight: 700, color }}>{aqi}</span>
                    <span style={{ color: '#94a3b8', marginLeft: 6 }}>{name}</span>
                </div>
            </Tooltip>

            {/* Popup on click with full StationDetails */}
            <Popup
                minWidth={270}
                maxWidth={340}
                autoPan={true}
                closeButton={true}
            >
                <StationDetails station={selectedStation?.uid === station.uid ? selectedStation : { ...station, aqi }} />
            </Popup>
        </CircleMarker>
    )
}
