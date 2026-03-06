/**
 * useHealthProfile — Hook for managing user health profile state
 *
 * Features:
 * - Persists profile selection to localStorage
 * - Computes live health recommendations from current AQI
 * - Computes live respiratory strain from current AQI
 * - Panel visibility toggle
 *
 * Usage:
 *   const health = useHealthProfile(nearestAqi)
 *   health.profile    // 'asthmatic' | 'general' | etc.
 *   health.recommendation  // { recommendation, severity, icon }
 *   health.strain          // { percentage, label, color }
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
    getHealthRecommendation,
    getRespiratoryStrain,
    getProfileById,
    HEALTH_PROFILES,
} from '../utils/healthRecommendations'

const STORAGE_KEY = 'airscope_health_profile'

export function useHealthProfile(currentAqi = null) {
    // Load saved profile from localStorage, default to 'general'
    const [profileId, setProfileId] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) || 'general'
        } catch {
            return 'general'
        }
    })

    const [panelOpen, setPanelOpen] = useState(false)

    // Persist profile changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, profileId)
        } catch {
            // Silently fail if localStorage is unavailable
        }
    }, [profileId])

    /**
     * Select a new health profile.
     */
    const selectProfile = useCallback((id) => {
        setProfileId(id)
    }, [])

    /**
     * Toggle the health panel visibility.
     */
    const togglePanel = useCallback(() => {
        setPanelOpen((p) => !p)
    }, [])

    const closePanel = useCallback(() => {
        setPanelOpen(false)
    }, [])

    // Get the full profile object
    const profile = useMemo(() => getProfileById(profileId), [profileId])

    // Compute recommendation and strain from current AQI
    const recommendation = useMemo(() => {
        if (currentAqi === null || currentAqi === undefined) return null
        return getHealthRecommendation(currentAqi, profileId)
    }, [currentAqi, profileId])

    const strain = useMemo(() => {
        if (currentAqi === null || currentAqi === undefined) return null
        return getRespiratoryStrain(currentAqi, profileId)
    }, [currentAqi, profileId])

    return {
        profileId,
        profile,
        profiles: HEALTH_PROFILES,
        selectProfile,
        panelOpen,
        togglePanel,
        closePanel,
        recommendation,
        strain,
        currentAqi,
    }
}
