/**
 * IDW Interpolation & Route Cost Functions
 *
 * Implements Inverse Distance Weighting to estimate AQI at arbitrary
 * points using nearby sensor stations.
 *
 * ─── Data Gap Strategy ─────────────────────────────────────────────
 * We use a DECAY-BASED ESTIMATE with regional fallback:
 *
 * 1. Primary: IDW with stations within MAX_IDW_RADIUS (15 km).
 *    The weighting exponent (p=2) ensures nearby sensors dominate.
 *
 * 2. Fallback: If no sensors within radius, use the REGIONAL MEAN
 *    (average AQI of all currently loaded stations). This adapts to
 *    viewport density—better than a static city-wide value.
 *
 * 3. Decay: Beyond MAX_IDW_RADIUS, influence decays to zero.
 *    This prevents distant stations from skewing local estimates.
 *
 * ─── Cost Function ─────────────────────────────────────────────────
 * Cost = Distance × (1 + AQI / 100)²
 *
 * At AQI 50:  multiplier = (1.5)²  = 2.25×
 * At AQI 100: multiplier = (2.0)²  = 4.00×
 * At AQI 200: multiplier = (3.0)²  = 9.00×
 * At AQI 300: multiplier = (4.0)²  = 16.0×
 *
 * This heavily penalizes high-pollution segments.
 */

const MAX_IDW_RADIUS_KM = 15 // max influence radius for a sensor
const IDW_POWER = 2           // weighting exponent (higher = more local)
const SAMPLE_SPACING_M = 500  // sample route every 500m

// ─── Haversine distance (km) ────────────────────────────────────────

export function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
    return (deg * Math.PI) / 180
}

// ─── IDW Interpolation ──────────────────────────────────────────────

/**
 * Estimate AQI at a single point using Inverse Distance Weighting.
 *
 * @param {number} lat - Query latitude
 * @param {number} lon - Query longitude
 * @param {Array}  stations - Array of { lat, lon, aqi } objects
 * @param {number} [fallbackAqi] - Regional mean to use if no station nearby
 * @returns {number} Estimated AQI at the point
 */
export function interpolateAQI(lat, lon, stations, fallbackAqi = 75) {
    let numerator = 0
    let denominator = 0
    let nearbyCount = 0

    for (const s of stations) {
        const sAqi = Number(s.aqi)
        if (isNaN(sAqi) || sAqi < 0) continue

        const d = haversineKm(lat, lon, s.lat, s.lon)

        // If we're essentially on top of a sensor, return its exact value
        if (d < 0.05) return sAqi

        // Only consider stations within the max radius
        if (d > MAX_IDW_RADIUS_KM) continue

        nearbyCount++
        const weight = 1 / Math.pow(d, IDW_POWER)
        numerator += weight * sAqi
        denominator += weight
    }

    // Fallback: no sensors within radius → use regional mean
    if (nearbyCount === 0 || denominator === 0) return fallbackAqi

    return numerator / denominator
}

// ─── Regional Mean (fallback) ───────────────────────────────────────

/**
 * Compute the mean AQI of all visible stations.
 * @param {Array} stations
 * @returns {number}
 */
export function computeRegionalMean(stations) {
    const valid = stations.filter((s) => !isNaN(Number(s.aqi)) && Number(s.aqi) >= 0)
    if (valid.length === 0) return 75 // sensible global default
    return valid.reduce((sum, s) => sum + Number(s.aqi), 0) / valid.length
}

// ─── Route Sampling ─────────────────────────────────────────────────

/**
 * Sample points along a route polyline at fixed intervals.
 *
 * @param {Array} coordinates - Array of [lat, lng] pairs (route geometry)
 * @param {number} spacingMeters - Distance between samples
 * @returns {Array<{lat: number, lon: number}>} Sample points
 */
export function sampleRoutePoints(coordinates, spacingMeters = SAMPLE_SPACING_M) {
    if (!coordinates || coordinates.length < 2) return []

    const samples = []
    let accumulated = 0

    samples.push({ lat: coordinates[0].lat ?? coordinates[0][0], lon: coordinates[0].lng ?? coordinates[0][1] })

    for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i - 1]
        const curr = coordinates[i]
        const prevLat = prev.lat ?? prev[0]
        const prevLon = prev.lng ?? prev[1]
        const currLat = curr.lat ?? curr[0]
        const currLon = curr.lng ?? curr[1]

        const segmentKm = haversineKm(prevLat, prevLon, currLat, currLon)
        const segmentM = segmentKm * 1000

        accumulated += segmentM

        if (accumulated >= spacingMeters) {
            samples.push({ lat: currLat, lon: currLon })
            accumulated = 0
        }
    }

    // Always include the last point
    const last = coordinates[coordinates.length - 1]
    samples.push({ lat: last.lat ?? last[0], lon: last.lng ?? last[1] })

    return samples
}

// ─── Route AQI Scoring ──────────────────────────────────────────────

/**
 * Compute average AQI exposure along a route.
 *
 * @param {Array} coordinates - Route geometry
 * @param {Array} stations - AQI stations array
 * @returns {{ avgAqi: number, maxAqi: number, minAqi: number, sampleCount: number }}
 */
export function scoreRoute(coordinates, stations) {
    const fallback = computeRegionalMean(stations)
    const samples = sampleRoutePoints(coordinates)

    if (samples.length === 0) {
        return { avgAqi: fallback, maxAqi: fallback, minAqi: fallback, sampleCount: 0 }
    }

    let sum = 0
    let max = -Infinity
    let min = Infinity

    for (const pt of samples) {
        const aqi = interpolateAQI(pt.lat, pt.lon, stations, fallback)
        sum += aqi
        if (aqi > max) max = aqi
        if (aqi < min) min = aqi
    }

    return {
        avgAqi: Math.round(sum / samples.length),
        maxAqi: Math.round(max),
        minAqi: Math.round(min),
        sampleCount: samples.length,
    }
}

// ─── Cost Function ──────────────────────────────────────────────────

/**
 * AQI-weighted cost for a route segment.
 *
 * Cost = Distance × (1 + AQI/100)²
 *
 * @param {number} distanceKm
 * @param {number} aqi - Interpolated AQI at the segment midpoint
 * @returns {number} Weighted cost
 */
export function aqiWeightedCost(distanceKm, aqi) {
    const multiplier = Math.pow(1 + aqi / 100, 2)
    return distanceKm * multiplier
}

/**
 * Compute the total AQI-weighted cost for an entire route.
 *
 * @param {Array} coordinates - Route geometry
 * @param {Array} stations - AQI stations
 * @returns {number} Total weighted cost
 */
export function computeRouteCost(coordinates, stations) {
    const fallback = computeRegionalMean(stations)
    let totalCost = 0

    for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i - 1]
        const curr = coordinates[i]
        const pLat = prev.lat ?? prev[0]
        const pLon = prev.lng ?? prev[1]
        const cLat = curr.lat ?? curr[0]
        const cLon = curr.lng ?? curr[1]

        const segDist = haversineKm(pLat, pLon, cLat, cLon)
        const midLat = (pLat + cLat) / 2
        const midLon = (pLon + cLon) / 2
        const segAqi = interpolateAQI(midLat, midLon, stations, fallback)

        totalCost += aqiWeightedCost(segDist, segAqi)
    }

    return totalCost
}

/**
 * Given multiple route alternatives, return the index of the healthiest.
 *
 * @param {Array<Array>} routeGeometries - Array of coordinate arrays
 * @param {Array} stations
 * @returns {number} Index of the healthiest route
 */
export function findHealthiestRouteIndex(routeGeometries, stations) {
    let bestIdx = 0
    let bestCost = Infinity

    for (let i = 0; i < routeGeometries.length; i++) {
        const cost = computeRouteCost(routeGeometries[i], stations)
        if (cost < bestCost) {
            bestCost = cost
            bestIdx = i
        }
    }

    return bestIdx
}
