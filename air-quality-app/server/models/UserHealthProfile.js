/**
 * UserHealthProfile — Mongoose Schema for storing user health preferences
 *
 * This schema stores the user's selected health profile and related preferences
 * in MongoDB. It is designed to work with the frontend health recommendation
 * engine in `src/utils/healthRecommendations.js`.
 *
 * ─── Schema Fields ──────────────────────────────────────────────────────
 * - userId:          Unique identifier (link to your auth system)
 * - profileType:     Enum: 'general' | 'asthmatic' | 'athlete' | 'elderly'
 * - displayName:     User-chosen display name
 * - conditions:      Array of specific conditions for finer-grained logic
 * - notifications:   Whether the user wants AQI alerts
 * - aqiAlertThreshold: Custom AQI level at which to trigger alerts
 * - preferredUnits:  Metric or imperial for distance/temp
 *
 * ─── Usage ──────────────────────────────────────────────────────────────
 * const user = await UserHealthProfile.findOne({ userId: 'abc123' })
 * const profile = user.profileType  // 'asthmatic'
 */

const mongoose = require('mongoose')

const userHealthProfileSchema = new mongoose.Schema(
    {
        // Link to your authentication system (e.g., Firebase UID, Auth0 sub, etc.)
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            unique: true,
            index: true,
            trim: true,
        },

        // The selected health profile type
        profileType: {
            type: String,
            required: true,
            enum: {
                values: ['general', 'asthmatic', 'athlete', 'elderly'],
                message: '{VALUE} is not a valid profile type',
            },
            default: 'general',
        },

        // User display name (optional)
        displayName: {
            type: String,
            trim: true,
            maxLength: [100, 'Display name cannot exceed 100 characters'],
            default: '',
        },

        // Specific health conditions for finer-grained recommendations
        // e.g., ['asthma', 'pollen_allergy', 'copd']
        conditions: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    return arr.length <= 10
                },
                message: 'Cannot have more than 10 conditions',
            },
        },

        // Notification preferences
        notifications: {
            enabled: {
                type: Boolean,
                default: true,
            },
            // AQI threshold at which to send alerts
            aqiAlertThreshold: {
                type: Number,
                default: 100,
                min: [0, 'Threshold cannot be negative'],
                max: [500, 'Threshold cannot exceed 500'],
            },
            // Notification channels
            channels: {
                email: { type: Boolean, default: false },
                push: { type: Boolean, default: true },
            },
        },

        // User's last known location for proximity-based alerts
        lastLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
        },

        // Preferred unit system
        preferredUnits: {
            type: String,
            enum: ['metric', 'imperial'],
            default: 'metric',
        },

        // Tracks when the profile was last active for cleanup/analytics
        lastActiveAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // adds createdAt + updatedAt
        collection: 'user_health_profiles',
    }
)

// ── Indexes ─────────────────────────────────────────────────────────────

// Geospatial index for location-based queries
userHealthProfileSchema.index({ lastLocation: '2dsphere' })

// Compound index for finding users by profile type (useful for batch alerts)
userHealthProfileSchema.index({ profileType: 1, 'notifications.enabled': 1 })

// ── Instance Methods ────────────────────────────────────────────────────

/**
 * Check if the user should be alerted for a given AQI value.
 * @param {number} aqi
 * @returns {boolean}
 */
userHealthProfileSchema.methods.shouldAlert = function (aqi) {
    if (!this.notifications.enabled) return false
    return Number(aqi) >= this.notifications.aqiAlertThreshold
}

/**
 * Update the user's last known location.
 * @param {number} lat
 * @param {number} lng
 */
userHealthProfileSchema.methods.updateLocation = function (lat, lng) {
    this.lastLocation = {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON uses [lng, lat]
    }
    this.lastActiveAt = new Date()
    return this.save()
}

// ── Static Methods ──────────────────────────────────────────────────────

/**
 * Find all users within a radius of a point who should be notified.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @param {number} currentAqi
 * @returns {Promise<Array>}
 */
userHealthProfileSchema.statics.findUsersToNotify = function (lat, lng, radiusKm, currentAqi) {
    return this.find({
        'notifications.enabled': true,
        'notifications.aqiAlertThreshold': { $lte: currentAqi },
        lastLocation: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: radiusKm * 1000, // convert to meters
            },
        },
    })
}

const UserHealthProfile = mongoose.model('UserHealthProfile', userHealthProfileSchema)

module.exports = UserHealthProfile
