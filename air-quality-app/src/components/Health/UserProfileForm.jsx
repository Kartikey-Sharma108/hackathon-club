/**
 * UserProfileForm — Health profile selection form
 *
 * Premium card UI allowing users to select their health profile:
 * - Sensitive / Asthmatic
 * - Outdoor Athlete
 * - Elderly
 * - General Public
 *
 * Features:
 * - Animated card grid with hover effects
 * - Checkmark indicator on selected profile
 * - Profile description tooltips
 * - Smooth transition on selection change
 */

import React from 'react'
import { X, Check, Heart } from 'lucide-react'

export default function UserProfileForm({
    profiles,
    selectedProfileId,
    onSelectProfile,
    onClose,
}) {
    return (
        <div className="health-profile-form animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
                        <Heart size={13} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-none">Health Profile</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Select your condition</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close health profile panel"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Profile Cards Grid */}
            <div className="px-3 pb-3 pt-1 space-y-1.5">
                {profiles.map((profile) => {
                    const isSelected = profile.id === selectedProfileId

                    return (
                        <button
                            key={profile.id}
                            onClick={() => onSelectProfile(profile.id)}
                            className={`
                                health-profile-card w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                                transition-all duration-200 group relative overflow-hidden
                                ${isSelected
                                    ? 'health-profile-card--selected'
                                    : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]'
                                }
                            `}
                            style={isSelected ? {
                                background: `${profile.color}10`,
                                border: `1px solid ${profile.color}30`,
                                boxShadow: `0 0 20px ${profile.color}08`,
                            } : undefined}
                            id={`health-profile-${profile.id}`}
                        >
                            {/* Emoji avatar */}
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                                style={{
                                    background: isSelected
                                        ? `linear-gradient(135deg, ${profile.color}25, ${profile.color}10)`
                                        : 'rgba(255,255,255,0.04)',
                                    border: isSelected
                                        ? `1px solid ${profile.color}30`
                                        : '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                {profile.emoji}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                    }`}>
                                    {profile.label}
                                </p>
                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                                    {profile.description}
                                </p>
                            </div>

                            {/* Selected checkmark */}
                            {isSelected && (
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 animate-fade-in"
                                    style={{
                                        background: profile.color,
                                        boxShadow: `0 0 12px ${profile.color}50`,
                                    }}
                                >
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
