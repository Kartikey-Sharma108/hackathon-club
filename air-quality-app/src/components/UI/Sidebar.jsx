/**
 * Sidebar — Vertical icon navigation bar
 *
 * Premium dark sidebar that lets the user switch between:
 * - 🗺️  Map (default view — clean map with stations)
 * - 🚀 Routing (Healthiest Commute routing panel + route comparison)
 * - ❤️  Health (Health Risk Meter + profile)
 *
 * Features:
 * - Glassmorphism vertical rail on the left edge
 * - Active tab indicator with animated pill + glow
 * - Tooltip labels on hover
 * - Compact icon-only design (48px wide)
 */

import React from 'react'
import { Map, Route, Heart, Wind } from 'lucide-react'

const SIDEBAR_ITEMS = [
    { id: 'map', label: 'Map', icon: Map, color: '#38bdf8' },
    { id: 'routing', label: 'Routes', icon: Route, color: '#34d399' },
    { id: 'health', label: 'Health', icon: Heart, color: '#f472b6' },
]

export default function Sidebar({ activeView, onChangeView }) {
    return (
        <nav className="sidebar" aria-label="Main navigation" id="main-sidebar">
            {/* Brand icon */}
            <div className="sidebar__brand">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Wind size={15} className="text-white" />
                </div>
            </div>

            {/* Navigation items */}
            <div className="sidebar__nav">
                {SIDEBAR_ITEMS.map((item) => {
                    const isActive = activeView === item.id
                    const Icon = item.icon

                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id)}
                            className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                            title={item.label}
                            aria-label={`Switch to ${item.label} view`}
                            aria-current={isActive ? 'page' : undefined}
                            id={`sidebar-${item.id}`}
                        >
                            {/* Active indicator pill */}
                            {isActive && (
                                <span
                                    className="sidebar__indicator"
                                    style={{
                                        backgroundColor: item.color,
                                        boxShadow: `0 0 12px ${item.color}50`,
                                    }}
                                />
                            )}

                            {/* Icon */}
                            <Icon
                                size={18}
                                className="sidebar__icon"
                                style={{ color: isActive ? item.color : undefined }}
                            />

                            {/* Label tooltip (visible on hover via CSS) */}
                            <span className="sidebar__tooltip">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
