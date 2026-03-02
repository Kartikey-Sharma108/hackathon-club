/**
 * LocateButton — Flies the map back to the user's current geolocation.
 * Renders as a floating action button on the map.
 */

import React, { useState } from 'react'
import { useMap } from 'react-leaflet'
import { LocateFixed, Loader2 } from 'lucide-react'

export default function LocateButton() {
    const map = useMap()
    const [locating, setLocating] = useState(false)
    const [error, setError] = useState(null)

    const handleLocate = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported')
            return
        }

        setLocating(true)
        setError(null)

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.2 })
                setLocating(false)
            },
            (err) => {
                setError('Location access denied')
                setLocating(false)
            },
            { timeout: 8000 }
        )
    }

    return (
        <div className="relative">
            <button
                onClick={handleLocate}
                disabled={locating}
                title="Fly to my location"
                className={`
          glass w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl
          transition-all duration-200
          ${locating ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10 hover:scale-105 active:scale-95'}
        `}
                aria-label="Fly to my location"
            >
                {locating
                    ? <Loader2 size={16} className="text-sky-400 animate-spin" />
                    : <LocateFixed size={16} className="text-sky-400" />
                }
            </button>

            {/* Error tooltip */}
            {error && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap glass rounded-lg px-2.5 py-1.5 text-[11px] text-red-400 shadow-xl animate-fade-in">
                    ⚠ {error}
                </div>
            )}
        </div>
    )
}
