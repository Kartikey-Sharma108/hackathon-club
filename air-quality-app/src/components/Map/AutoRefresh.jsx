/**
 * AutoRefresh — Invisible component that re-triggers bounds fetching
 * every REFRESH_INTERVAL_MS so data stays fresh without user interaction.
 * Shows a countdown ring in the InfoPanel-adjacent area.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export default function AutoRefresh({ onRefresh }) {
    const map = useMap()
    const timerRef = useRef(null)
    const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL_MS / 1000)

    const refresh = useCallback(() => {
        const bounds = map.getBounds()
        onRefresh(bounds)
        setSecondsLeft(REFRESH_INTERVAL_MS / 1000)
    }, [map, onRefresh])

    // Countdown ticker
    useEffect(() => {
        const tick = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    refresh()
                    return REFRESH_INTERVAL_MS / 1000
                }
                return s - 1
            })
        }, 1000)

        return () => clearInterval(tick)
    }, [refresh])

    return null // purely logical; UI is in InfoPanel
}

export { REFRESH_INTERVAL_MS }
