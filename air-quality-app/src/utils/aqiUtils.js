/**
 * AQI Utility Functions
 * Maps AQI numeric values to official EPA color standards,
 * category labels, health messages, and dominant pollutant display names.
 */

/** Official AQI breakpoint definitions */
export const AQI_LEVELS = [
    {
        min: 0,
        max: 50,
        label: 'Good',
        color: '#00e400',
        bgColor: 'rgba(0, 228, 0, 0.15)',
        textColor: '#00e400',
        emoji: '😊',
        description: 'Air quality is satisfactory and poses little or no risk.',
    },
    {
        min: 51,
        max: 100,
        label: 'Moderate',
        color: '#ffff00',
        bgColor: 'rgba(255, 255, 0, 0.12)',
        textColor: '#d4d400',
        emoji: '😐',
        description: 'Acceptable quality; may affect unusually sensitive individuals.',
    },
    {
        min: 101,
        max: 150,
        label: 'Unhealthy for Sensitive Groups',
        color: '#ff7e00',
        bgColor: 'rgba(255, 126, 0, 0.15)',
        textColor: '#ff7e00',
        emoji: '😷',
        description: 'Sensitive groups may experience health effects.',
    },
    {
        min: 151,
        max: 200,
        label: 'Unhealthy',
        color: '#ff0000',
        bgColor: 'rgba(255, 0, 0, 0.15)',
        textColor: '#ff4444',
        emoji: '🤢',
        description: 'Everyone may begin experiencing health effects.',
    },
    {
        min: 201,
        max: 300,
        label: 'Very Unhealthy',
        color: '#8f3f97',
        bgColor: 'rgba(143, 63, 151, 0.15)',
        textColor: '#c96fd1',
        emoji: '😨',
        description: 'Health alert: serious effects for everyone.',
    },
    {
        min: 301,
        max: Infinity,
        label: 'Hazardous',
        color: '#7e0023',
        bgColor: 'rgba(126, 0, 35, 0.2)',
        textColor: '#ff3366',
        emoji: '☠️',
        description: 'Emergency conditions. Entire population affected.',
    },
]

/**
 * Returns the AQI level descriptor object for a given AQI value.
 * @param {number|string} aqi
 * @returns {object} Level descriptor
 */
export function getAQILevel(aqi) {
    const value = Number(aqi)
    if (isNaN(value) || value < 0) return AQI_LEVELS[0]
    return AQI_LEVELS.find((l) => value >= l.min && value <= l.max) ?? AQI_LEVELS[5]
}

/**
 * Returns the hex color string for an AQI value.
 * @param {number} aqi
 * @returns {string} hex color
 */
export function getAQIColor(aqi) {
    return getAQILevel(aqi).color
}

/**
 * Returns the radius in pixels for a Leaflet CircleMarker
 * scaled to the AQI severity.
 * @param {number} aqi
 * @returns {number}
 */
export function getMarkerRadius(aqi) {
    const v = Number(aqi)
    if (v <= 50) return 8
    if (v <= 100) return 10
    if (v <= 150) return 13
    if (v <= 200) return 16
    if (v <= 300) return 19
    return 22
}

/** Pollutant display name map */
const POLLUTANT_NAMES = {
    pm25: 'PM₂.₅',
    pm10: 'PM₁₀',
    no2: 'NO₂',
    o3: 'O₃',
    so2: 'SO₂',
    co: 'CO',
    aqi: 'AQI',
}

/**
 * Returns a human-readable display name for a raw pollutant key.
 * @param {string} key
 * @returns {string}
 */
export function getPollutantName(key) {
    if (!key) return '—'
    return POLLUTANT_NAMES[key.toLowerCase()] ?? key.toUpperCase()
}

/**
 * Formats a WAQI timestamp string into a readable local time string.
 * @param {string} timeStr
 * @returns {string}
 */
export function formatTimestamp(timeStr) {
    if (!timeStr) return 'N/A'
    try {
        const date = new Date(timeStr)
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return timeStr
    }
}

/**
 * Extracts individual pollutant readings from a WAQI station response.
 * Handles missing / partially present iaqi fields gracefully.
 * @param {object} iaqi - Raw iaqi block from WAQI API
 * @returns {Array<{key: string, name: string, value: number}>}
 */
export function parsePollutants(iaqi = {}) {
    const pollutantOrder = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co']
    return pollutantOrder
        .filter((key) => iaqi[key] !== undefined && iaqi[key]?.v !== undefined)
        .map((key) => ({
            key,
            name: getPollutantName(key),
            value: iaqi[key].v,
        }))
}
