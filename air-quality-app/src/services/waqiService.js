/**
 * WAQI API Service Layer
 * Handles all HTTP communication with the World Air Quality Index API.
 * Implements retry logic, error normalization, and response shaping.
 */

import axios from 'axios'

const TOKEN = import.meta.env.VITE_WAQI_TOKEN || 'demo'
const BASE_URL = 'https://api.waqi.info'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

/** Normalize API errors into a consistent shape */
function normalizeError(error) {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
            return new Error('Rate limit reached. Please wait a moment.')
        }
        if (error.response?.status === 403) {
            return new Error('Invalid or expired WAQI API token.')
        }
        if (error.code === 'ECONNABORTED') {
            return new Error('Request timed out. Check your connection.')
        }
    }
    return error instanceof Error ? error : new Error('Unknown error occurred.')
}

/**
 * Fetch AQI data for stations within a given geographic bounding box.
 * Used for bounds-based fetching as the user pans/zooms the map.
 *
 * @param {object} bounds - Leaflet LatLngBounds object
 * @returns {Promise<Array>} Array of station objects
 */
export async function fetchStationsInBounds(bounds) {
    const { _southWest: sw, _northEast: ne } = bounds
    const latlng = `${sw.lat.toFixed(4)},${sw.lng.toFixed(4)},${ne.lat.toFixed(4)},${ne.lng.toFixed(4)}`

    try {
        const { data } = await api.get(`/map/bounds/`, {
            params: { token: TOKEN, latlng },
        })

        if (data.status !== 'ok') {
            throw new Error(data.data || 'WAQI API returned an error.')
        }

        // Filter out stations without valid AQI
        return (data.data || []).filter(
            (s) => s.aqi !== '-' && s.aqi !== undefined && !isNaN(Number(s.aqi)),
        )
    } catch (err) {
        throw normalizeError(err)
    }
}

/**
 * Fetch detailed AQI data for a specific station by its UID or city name.
 *
 * @param {string|number} stationId - UID or '@stationId'
 * @returns {Promise<object>} Detailed station data
 */
export async function fetchStationDetails(stationId) {
    try {
        const { data } = await api.get(`/feed/@${stationId}/`, {
            params: { token: TOKEN },
        })

        if (data.status !== 'ok') {
            throw new Error(data.data || 'Station data unavailable.')
        }

        return data.data
    } catch (err) {
        throw normalizeError(err)
    }
}

/**
 * Search for stations/cities by keyword using the WAQI search endpoint.
 *
 * @param {string} query
 * @returns {Promise<Array>} Search result stations
 */
export async function searchStations(query) {
    if (!query || query.trim().length < 2) return []

    try {
        const { data } = await api.get(`/search/`, {
            params: { token: TOKEN, keyword: query.trim() },
        })

        if (data.status !== 'ok') return []

        return data.data || []
    } catch (err) {
        throw normalizeError(err)
    }
}

/**
 * Fetch AQI data for the user's current geo-location using IP-based lookup.
 * Falls back to a city name or coords if geolocation fails.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object>} Nearest station details
 */
export async function fetchNearestStation(lat, lng) {
    try {
        const { data } = await api.get(`/feed/geo:${lat};${lng}/`, {
            params: { token: TOKEN },
        })

        if (data.status !== 'ok') {
            throw new Error('No station found near your location.')
        }

        return data.data
    } catch (err) {
        throw normalizeError(err)
    }
}
