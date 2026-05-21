/**
 * SlotConfig.js
 *
 * One document per restaurant (user_id).
 * Supports MULTIPLE named slot groups (e.g. Breakfast, Lunch, Dinner, Late Night)
 * each with their own open/close time and independent slot duration.
 *
 * Example slot_groups:
 * [
 *   { name: "Lunch",  open_time: "12:00", close_time: "15:00", slot_duration: 30, is_active: true },
 *   { name: "Dinner", open_time: "18:00", close_time: "22:00", slot_duration: 30, is_active: true },
 * ]
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const slotGroupSchema = new Schema(
    {
        name: { type: String, required: true, trim: true }, // "Lunch", "Dinner", etc.
        open_time: { type: String, required: true },             // "HH:MM"
        close_time: { type: String, required: true },             // "HH:MM"
        slot_duration: { type: Number, enum: [15, 30, 60], default: 30 },
        max_slots_per_booking: { type: Number, default: 4 },
        is_active: { type: Boolean, default: true },
        color: { type: String, default: null }, // optional UI color hint e.g. "#f59e0b"
    },
    { _id: true }
);

const slotConfigSchema = new Schema(
    {
        user_id: { type: String, required: true, unique: true },

        // Named slot groups — replaces single open/close time
        slot_groups: { type: [slotGroupSchema], default: [] },

        // Days the restaurant is open (0 = Sunday … 6 = Saturday)
        open_days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },

        // Manually blocked slots: [{ date: "2025-12-25", group_id, slot_start: "12:00" }]
        blocked_slots: [
            {
                date: { type: String },
                group_id: { type: Schema.Types.ObjectId, default: null },
                slot_start: { type: String },
                reason: { type: String, default: null },
            },
        ],
    },
    { timestamps: true }
);

const SlotConfig = mongoose.model("SlotConfig", slotConfigSchema);
module.exports = SlotConfig;