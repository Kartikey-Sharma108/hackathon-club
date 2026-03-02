/**
 * ZoomControls — Custom dark-themed zoom in/out buttons.
 * Replaces the default Leaflet controls which don't match the dark UI.
 */

import React from 'react'
import { useMap } from 'react-leaflet'
import { Plus, Minus } from 'lucide-react'

export default function ZoomControls() {
    const map = useMap()

    const zoomIn = () => map.zoomIn()
    const zoomOut = () => map.zoomOut()

    const btnClass = `
    glass w-10 h-10 flex items-center justify-center
    text-slate-300 hover:text-white hover:bg-white/10
    transition-all duration-150 active:scale-95
  `

    return (
        <div className="glass rounded-xl overflow-hidden shadow-2xl flex flex-col divide-y divide-white/[0.06]">
            <button onClick={zoomIn} className={btnClass} aria-label="Zoom in" title="Zoom in">
                <Plus size={16} />
            </button>
            <button onClick={zoomOut} className={btnClass} aria-label="Zoom out" title="Zoom out">
                <Minus size={16} />
            </button>
        </div>
    )
}
