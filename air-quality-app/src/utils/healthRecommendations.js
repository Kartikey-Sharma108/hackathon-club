/**
 * healthRecommendations.js — Personalized Health Recommendation Engine
 *
 * Core logic for computing:
 * 1. A personalized health recommendation string based on AQI + user profile
 * 2. A "Respiratory Strain" percentage (0–100%) relative to the user's profile
 *
 * ─── Health Profiles ────────────────────────────────────────────────────
 * Each profile has:
 * - id:              Unique key used in storage and logic
 * - label:           Display name
 * - emoji:           Visual icon
 * - description:     Short blurb for the profile card
 * - sensitivity:     Multiplier (higher = more sensitive to poor air)
 * - aqiThresholds:   { safe, moderate, dangerous } — AQI breakpoints
 * - color:           Accent color for UI theming
 */

// ─── Profile Definitions ────────────────────────────────────────────────

export const HEALTH_PROFILES = [
    {
        id: 'general',
        label: 'General Public',
        emoji: '🧑',
        description: 'Healthy adult with no known conditions',
        sensitivity: 1.0,
        aqiThresholds: { safe: 100, moderate: 150, dangerous: 200 },
        color: '#38bdf8',
    },
    {
        id: 'asthmatic',
        label: 'Sensitive / Asthmatic',
        emoji: '🫁',
        description: 'Respiratory conditions like asthma, COPD, or allergies',
        sensitivity: 2.0,
        aqiThresholds: { safe: 50, moderate: 100, dangerous: 150 },
        color: '#f472b6',
    },
    {
        id: 'athlete',
        label: 'Outdoor Athlete',
        emoji: '🏃',
        description: 'Runner, cyclist, or outdoor fitness enthusiast',
        sensitivity: 1.5,
        aqiThresholds: { safe: 50, moderate: 100, dangerous: 150 },
        color: '#34d399',
    },
    {
        id: 'elderly',
        label: 'Elderly',
        emoji: '👴',
        description: 'Senior adult (65+) or person with cardiovascular concerns',
        sensitivity: 1.8,
        aqiThresholds: { safe: 50, moderate: 100, dangerous: 150 },
        color: '#fbbf24',
    },
]

/**
 * Get a profile definition by its ID.
 * @param {string} profileId
 * @returns {object|null}
 */
export function getProfileById(profileId) {
    return HEALTH_PROFILES.find((p) => p.id === profileId) || HEALTH_PROFILES[0]
}

// ─── Recommendation Engine ──────────────────────────────────────────────

/**
 * Returns a personalized health recommendation string based on the
 * current AQI value and the user's health profile.
 *
 * @param {number} aqi         — Current WAQI AQI value
 * @param {string} userProfile — Profile ID ('general', 'asthmatic', 'athlete', 'elderly')
 * @returns {{ recommendation: string, severity: string, icon: string }}
 */
export function getHealthRecommendation(aqi, userProfile) {
    const value = Number(aqi)
    if (isNaN(value) || value < 0) {
        return {
            recommendation: 'AQI data unavailable. Check back later.',
            severity: 'unknown',
            icon: '❓',
        }
    }

    const profile = getProfileById(userProfile)
    const { safe, moderate, dangerous } = profile.aqiThresholds

    // ── Profile-specific recommendation matrix ────────────────────────────

    if (userProfile === 'asthmatic') {
        if (value <= 25)
            return { recommendation: 'Air is excellent! Safe for all outdoor activities.', severity: 'good', icon: '✅' }
        if (value <= safe)
            return { recommendation: 'Air is fair. Carry your inhaler as a precaution.', severity: 'good', icon: '💚' }
        if (value <= 75)
            return { recommendation: 'Moderate air quality. Limit prolonged outdoor exertion.', severity: 'moderate', icon: '⚠️' }
        if (value <= moderate)
            return { recommendation: 'Avoid outdoor cardio today. Use air purifier indoors.', severity: 'warning', icon: '🚫' }
        if (value <= dangerous)
            return { recommendation: 'Stay indoors. Use N95 mask if going outside is unavoidable.', severity: 'danger', icon: '😷' }
        return { recommendation: 'EMERGENCY: Dangerous air. Seal windows, use medication, seek medical help if symptoms worsen.', severity: 'critical', icon: '🚨' }
    }

    if (userProfile === 'athlete') {
        if (value <= 25)
            return { recommendation: 'Perfect conditions for outdoor training!', severity: 'good', icon: '🏆' }
        if (value <= safe)
            return { recommendation: 'Good for moderate exercise. Avoid intense sprints.', severity: 'good', icon: '💪' }
        if (value <= 75)
            return { recommendation: 'Switch to low-intensity workouts. Consider indoor gym.', severity: 'moderate', icon: '⚠️' }
        if (value <= moderate)
            return { recommendation: 'Move all training indoors. Outdoor cardio not recommended.', severity: 'warning', icon: '🏠' }
        if (value <= dangerous)
            return { recommendation: 'No outdoor exercise. High respiratory strain even at rest.', severity: 'danger', icon: '🛑' }
        return { recommendation: 'EMERGENCY: All physical activity should stop. Stay indoors with air filtration.', severity: 'critical', icon: '🚨' }
    }

    if (userProfile === 'elderly') {
        if (value <= 25)
            return { recommendation: 'Wonderful air quality. Enjoy outdoor walks!', severity: 'good', icon: '🌿' }
        if (value <= safe)
            return { recommendation: 'Acceptable air. Short outdoor walks are fine.', severity: 'good', icon: '💚' }
        if (value <= 75)
            return { recommendation: 'Limit outdoor time to 30 minutes. Stay hydrated.', severity: 'moderate', icon: '⏱️' }
        if (value <= moderate)
            return { recommendation: 'Stay indoors. Monitor blood pressure and breathing.', severity: 'warning', icon: '🏠' }
        if (value <= dangerous)
            return { recommendation: 'Remain inside with windows closed. Use air purifier.', severity: 'danger', icon: '😷' }
        return { recommendation: 'EMERGENCY: Hazardous air. Seek medical attention if experiencing discomfort.', severity: 'critical', icon: '🚨' }
    }

    // ── General Public (fallback) ─────────────────────────────────────────
    if (value <= 50)
        return { recommendation: 'Air quality is great. Enjoy the outdoors!', severity: 'good', icon: '😊' }
    if (value <= safe)
        return { recommendation: 'Fair air quality. Sensitive individuals should take care.', severity: 'good', icon: '👍' }
    if (value <= moderate)
        return { recommendation: 'Reduce prolonged outdoor exertion. Close windows.', severity: 'moderate', icon: '⚠️' }
    if (value <= dangerous)
        return { recommendation: 'Unhealthy air. Avoid outdoor activities when possible.', severity: 'warning', icon: '🚫' }
    if (value <= 300)
        return { recommendation: 'Very unhealthy. Stay indoors with air filtration.', severity: 'danger', icon: '😷' }
    return { recommendation: 'HAZARDOUS: Emergency conditions. Seal indoor spaces.', severity: 'critical', icon: '🚨' }
}

// ─── Respiratory Strain Calculator ──────────────────────────────────────

/**
 * Calculates a "Respiratory Strain" percentage (0–100%) that represents
 * how much the current air quality stresses the user's respiratory system,
 * weighted by their health profile's sensitivity.
 *
 * Formula: strain = clamp( (AQI / dangerousThreshold) × sensitivity × 100, 0, 100 )
 *
 * @param {number} aqi         — Current WAQI AQI value
 * @param {string} userProfile — Profile ID
 * @returns {{ percentage: number, label: string, color: string }}
 */
export function getRespiratoryStrain(aqi, userProfile) {
    const value = Number(aqi)
    const profile = getProfileById(userProfile)

    if (isNaN(value) || value < 0) {
        return { percentage: 0, label: 'No Data', color: '#64748b' }
    }

    // Strain scales with AQI and sensitivity
    // At the "dangerous" threshold for the profile, strain = 100%
    const rawStrain = (value / profile.aqiThresholds.dangerous) * profile.sensitivity * 100
    const percentage = Math.min(Math.max(Math.round(rawStrain), 0), 100)

    // Determine label and color based on strain level
    if (percentage <= 20)
        return { percentage, label: 'Minimal', color: '#22c55e' }
    if (percentage <= 40)
        return { percentage, label: 'Low', color: '#84cc16' }
    if (percentage <= 60)
        return { percentage, label: 'Moderate', color: '#f59e0b' }
    if (percentage <= 80)
        return { percentage, label: 'High', color: '#f97316' }
    if (percentage <= 95)
        return { percentage, label: 'Very High', color: '#ef4444' }
    return { percentage, label: 'Critical', color: '#dc2626' }
}

// ─── Severity Color Map ─────────────────────────────────────────────────

export const SEVERITY_COLORS = {
    good: '#22c55e',
    moderate: '#f59e0b',
    warning: '#f97316',
    danger: '#ef4444',
    critical: '#dc2626',
    unknown: '#64748b',
}
